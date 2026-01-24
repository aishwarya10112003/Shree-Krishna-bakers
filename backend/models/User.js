const mongoose =  require("mongoose")

const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      unique: true,
      required: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    // This helps us distinguish between a hungry customer and the store owner
    role: {
      type: String,
      enum: ["customer", "admin"],
      default: "customer",
    },
    // For the OTP functionality you mentioned
    isVerified: {
      type: Boolean,
      default: false,
    },
    otp: {
      type: String,
    },
    otpExpiry: {
      type: Date,
    },
  },
  { timestamps: true }
); // This adds 'createdAt' and 'updatedAt' automatically

module.exports = mongoose.model("User", userSchema);