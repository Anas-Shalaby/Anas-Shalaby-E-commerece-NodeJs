import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

/**
 * Protect routes from unauthorized access
 * Verify the access token in the cookies if it exists
 * If the token is valid, find the user in the database and attach it to the req object
 * If the token is invalid or expired, return a 401 status with a message
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<void>}
 */
export const protectRoute = async (req, res, next) => {
  try {
    const accessToken = req.cookies.accessToken;
    if (!accessToken) {
      return res.status(401).json({
        status: false,
        message: "Unauthorized",
      });
    }

    try {
      const decode = jwt.verify(accessToken, process.env.ACCESS_JWT_SECRET);
      const user = await User.findById(decode.userId).select("-password"); // password will not be returned
      if (!user) {
        return res.status(401).json({
          status: false,
          message: "Unauthorized",
        });
      }

      req.user = user;
      next();
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        return res.status(401).json({
          status: false,
          message: "Token expired",
        });
      }
      throw error; // rethrow the error to the error handler
    }
  } catch (error) {
    res.status(401).json({
      status: false,
      message: error.message,
    });
  }
};

/**
 * Check if the user is an admin.
 * If the user is an admin, call the next middleware.
 * If the user is not an admin, return a 403 status with a message "Access-denied Admin only".
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const adminRoute = async (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    return res
      .status(403)
      .json({ status: false, message: "Access-denied Admin only" });
  }
};
