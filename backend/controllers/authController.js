const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { sendOTP } = require("../utils/Nodemailer"); // Import your mailer

// OTP Configuration
const OTP_EXPIRY_MINUTES = 10; // OTP expires in 10 minutes

// 🟢 1. SIGNUP (Validate -> Send OTP -> Store in Database)
exports.signup = async (req, res) => {
  try {
    // Data is already validated by your middleware before reaching here!
    const { name, email, password, phone } = req.body;

    // Check if user already exists in MongoDB
    let user = await User.findOne({ email });
    if (user && user.isVerified) {
      return res.status(400).json({ msg: "User already exists" });
    }

    // Generate 6-digit OTP
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();

    // Calculate OTP expiry time
    const otpExpiry = new Date();
    otpExpiry.setMinutes(otpExpiry.getMinutes() + OTP_EXPIRY_MINUTES);

    // Hash Password NOW (Security best practice)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // If user exists but not verified, update their data
    // Otherwise, create a new unverified user
    if (user && !user.isVerified) {
      user.name = name;
      user.password = hashedPassword;
      user.phone = phone;
      user.otp = generatedOtp;
      user.otpExpiry = otpExpiry;
      await user.save();
    } else {
      // Create new unverified user with OTP stored in database
      user = new User({
        name,
        email,
        password: hashedPassword,
        phone,
        otp: generatedOtp,
        otpExpiry: otpExpiry,
        isVerified: false,
      });
      await user.save();
    }

    // Send Email
    const isSent = await sendOTP(email, generatedOtp);
    if (!isSent) {
      // If email fails, clean up the user record
      await User.findByIdAndDelete(user._id);
      return res
        .status(500)
        .json({ msg: "Failed to send email. Check credentials." });
    }

    console.log(`📩 OTP sent to ${email}`);

    res.status(201).json({
      msg: "OTP sent to your email! Please verify to complete signup.",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error during signup" });
  }
};

// 🟢 2. VERIFY OTP (Check Database -> Verify -> Mark as Verified)
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Find user with this email
    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(400)
        .json({
          msg: "No signup found for this email. Please signup again.",
        });
    }

    // Check if user is already verified
    if (user.isVerified) {
      return res.status(400).json({ msg: "Email already verified. Please login." });
    }

    // Check if OTP exists
    if (!user.otp) {
      return res
        .status(400)
        .json({
          msg: "No OTP found. Please request a new OTP by signing up again.",
        });
    }

    // Check if OTP has expired
    if (user.otpExpiry && new Date() > user.otpExpiry) {
      // Clear expired OTP
      user.otp = undefined;
      user.otpExpiry = undefined;
      await user.save();
      return res.status(400).json({
        msg: "OTP has expired. Please signup again to receive a new OTP.",
      });
    }

    // Check if OTP matches
    if (user.otp !== otp) {
      return res.status(400).json({ msg: "Invalid OTP" });
    }

    // OTP IS CORRECT! Mark user as verified and clear OTP
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    res
      .status(200)
      .json({ msg: "Account verified and created! You can now login." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error during verification" });
  }
};

// 🟢 3. SIGNIN (Standard Login)
exports.signin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: "Invalid Credentials" });

    // Check if user is verified
    if (!user.isVerified) {
      return res.status(403).json({
        msg: "Email not verified. Please verify your email first.",
      });
    }

    // Check Password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(403).json({ msg: "Invalid Credentials" });

    // Generate Token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
