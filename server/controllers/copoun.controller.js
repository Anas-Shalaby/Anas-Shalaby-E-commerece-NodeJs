import Copoun from "../models/copoun.model.js";

/**
 * Handle GET /coupons request
 * Return the active coupon for the logged in user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - The promise resolves when the coupon is successfully retrieved
 */
export const getCopoun = async (req, res) => {
  try {
    const user = req.user;
    const copoun = await Copoun.findOne({ userId: user._id, isActive: true });
    if (!copoun) {
      return res
        .status(404)
        .json({ status: false, message: "Copoun not found" });
    }

    res.status(200).json({ status: true, data: copoun });
  } catch (error) {
    res.status(500).json({ status: false, message: error.message });
  }
};

/**
 * Handle POST /coupons/validate request
 * Validate the coupon code for the logged in user
 * Return the coupon if it is valid
 * Return a 400 status with a message "Copoun not found" if the coupon is not found
 * Return a 400 status with a message "Copoun expired" if the coupon is expired
 * Return a 500 status with a message if there is an error
 * @param {Object} req - Express request object
 * @param {Object} req.body - The request body containing the coupon code
 * @param {string} req.body.code - The coupon code to be validated
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - The promise resolves when the coupon is successfully validated
 */
export const validateCopoun = async (req, res) => {
  try {
    const { code } = req.body;

    const isValidate = await Copoun.findOne({
      code,
      userId: req.user._id,
      isActive: true,
    });
    if (!isValidate) {
      return res
        .status(400)
        .json({ status: false, message: "Copoun not found" });
    }
    if (isValidate.expirationDate < new Date()) {
      isValidate.isActive = false;
      await isValidate.save();

      return res.status(400).json({ status: false, message: "Copoun expired" });
    }

    res.status(200).json({
      status: true,
      data: isValidate,
      message: "Copoun is valid",
      disccountPercentage: isValidate.discountAmount,
    });
  } catch (error) {
    res.status(500).json({ status: false, message: error.message });
  }
};
