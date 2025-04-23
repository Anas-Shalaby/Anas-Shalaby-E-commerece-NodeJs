import { redis } from "../lib/redis.js";
import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
/**
 * Generate an access token and refresh token for a user.
 * @param {ObjectId} userId - User's MongoDB ObjectId.
 * @returns {Object} - Object with two properties: `accessToken` and `refreshToken`.
 * `accessToken` is a JWT with a short expiration time (15 minutes).
 * `refreshToken` is a JWT with a longer expiration time (7 days).
 */
const generateToken = (userId) => {
  const accessToken = jwt.sign({ userId }, process.env.ACCESS_JWT_SECRET, {
    expiresIn: "15m",
  });
  const refreshToken = jwt.sign({ userId }, process.env.REFRESH_JWT_SECRET, {
    expiresIn: "7d",
  });
  return { accessToken, refreshToken };
};

/**
 * Store a refresh token in Redis for a user.
 * @param {ObjectId} userId - User's MongoDB ObjectId.
 * @param {String} refreshToken - The refresh token to store.
 * @returns {Promise<void>} - The promise resolves when the token is stored.
 */
const storeRefreshToken = async (userId, refreshToken) => {
  await redis.set(
    `refreshToken:${userId}`,
    refreshToken,
    "EX",
    60 * 60 * 24 * 7
  );
};

/**
 * Set cookies for the user.
 * @param {Object} res - Express response object
 * @param {String} accessToken - The access token for the user.
 * @param {String} refreshToken - The refresh token for the user.
 */
const setCookies = (res, accessToken, refreshToken) => {
  // Set the access token cookie
  res.cookie("accessToken", accessToken, {
    /**
     * Set httpOnly to true to protect against XSS attacks.
     * An attacker cannot read the cookie from the client-side.
     */
    httpOnly: true,

    /**
     * Set the max age of the cookie to 15 minutes.
     * This is the time the user has to use the access token before it expires.
     */
    maxAge: 1000 * 60 * 15,

    /**
     * Set the secure flag to true to only send the cookie over https.
     * This prevents the cookie from being sent over an insecure connection.
     */
    secure: process.env.NODE_ENV === "production",

    /**
     * Set the sameSite flag to 'strict' to prevent CSRF attacks.
     * This means that the cookie will only be sent on the same site.
     */
    sameSite: "strict",
  });

  // Set the refresh token cookie
  res.cookie("refreshToken", refreshToken, {
    /**
     * Set httpOnly to true to protect against XSS attacks.
     * An attacker cannot read the cookie from the client-side.
     */
    httpOnly: true,

    /**
     * Set the max age of the cookie to 7 days.
     * This is the time the user has to use the refresh token before it expires.
     */
    maxAge: 1000 * 60 * 60 * 24 * 7,

    /**
     * Set the secure flag to true to only send the cookie over https.
     * This prevents the cookie from being sent over an insecure connection.
     */
    secure: process.env.NODE_ENV === "production",

    /**
     * Set the sameSite flag to 'strict' to prevent CSRF attacks.
     * This means that the cookie will only be sent on the same site.
     */
    sameSite: "strict",
  });
};

/**
 * Handle sign up request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const signup = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = await User.create({ name, email, password });

    // authicate user
    // const { accessToken, refreshToken } = generateToken(user._id);

    // // store refresh token in redis
    // await storeRefreshToken(user._id, refreshToken);

    // // save tokens to cookies
    // setCookies(res, accessToken, refreshToken);
    res.status(201).json({
      status: true,
      message: "User created successfully",
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ status: false, message: error.message });
  }
};

/**
 * Handle login request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      const decode = jwt.verify(refreshToken, process.env.REFRESH_JWT_SECRET);
      await redis.del(`refreshToken:${decode.userId}`);
    }

    res.clearCookie("refreshToken");
    res.clearCookie("accessToken");

    res.status(200).json({
      status: true,
      message: "Logout successfully",
    });
  } catch (error) {
    res.status(500).json({ status: false, message: error.message });
  }
};

/**
 * Handle login request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - The promise resolves when the login is successful
 */
export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(400)
        .json({ status: false, message: "User does not exist" });
    }
    if (!(await user.comparePassword(password))) {
      return res
        .status(400)
        .json({ status: false, message: "Incorrect password or email" });
    }

    // authicate user
    const { accessToken, refreshToken } = generateToken(user._id);
    await storeRefreshToken(user._id, refreshToken);
    setCookies(res, accessToken, refreshToken);

    res.status(200).json({
      status: true,
      message: "Login successfully",
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (e) {
    res.status(500).json({ status: false, message: e.message });
  }
};

/**
 * Handle refresh token request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - The promise resolves when the refresh token is successfully
 */
export const refreshToken = async (req, res) => {
  try {
    // get refresh token from cookies
    const refreshToken = req.cookies.refreshToken;

    // check if refresh token exists
    if (!refreshToken) {
      return res
        .status(401)
        .json({ status: false, message: "No refresh token" });
    }

    // verify refresh token
    const decode = jwt.verify(refreshToken, process.env.REFRESH_JWT_SECRET);

    // get token from redis
    const storedToken = await redis.get(`refreshToken:${decode.userId}`);

    // check if refresh token is valid
    if (storedToken !== refreshToken) {
      return res
        .status(401)
        .json({ status: false, message: "Invalid refresh token" });
    }

    // generate new access token
    const accessToken = jwt.sign(
      { userId: decode.userId },
      process.env.ACCESS_JWT_SECRET,
      {
        expiresIn: "15m",
      }
    );

    // set new access token in cookies
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // prevent cross-site scripting
      sameSite: "strict", // only send cookie over https
      maxAge: 1000 * 60 * 15, // 15 minutes
    });

    res.status(200).json({
      status: true,
      message: "Refresh token successfully",
    });
  } catch (error) {
    res.status(500).json({ status: false, message: error.message });
  }
};
