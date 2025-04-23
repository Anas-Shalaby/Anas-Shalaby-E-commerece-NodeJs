import mongoose from "mongoose";

const copounSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, "Please add a code"],
      unique: true,
    },
    discountAmount: {
      type: Number,
      required: true,
      min: 0,
      max: 10,
    },
    expirationDate: {
      type: Date,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

const Copoun = mongoose.model("Copoun", copounSchema);
export default Copoun;
