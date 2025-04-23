import mongoose from "mongoose";
import bcrypt from "bcryptjs";
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please add a name"],
    },
    email: {
      type: String,
      required: [true, "Please add an email"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Please add a password"],
      minLength: [6, "Password should be at least 6 characters"],
    },
    cartItems: [
      {
        quantity: {
          type: Number,
          default: 1,
        },
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product", // reference to Product model
        },
      },
    ],
    role: {
      type: String,
      enum: ["customer", "admin"],
      default: "customer",
    },
  },
  {
    timestamps: true,
  }
);

// hash password before saving to db
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(this.password, salt);
    this.password = hashedPassword;
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Compare a given password to the user's hashed password.
 * @param {String} password - The password to compare.
 * @returns {Promise<Boolean>} - True if the password matches, false otherwise.
 */
userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

// must be at the end of the script to avoid circular dependencies
const User = mongoose.model("User", userSchema);

export default User;
