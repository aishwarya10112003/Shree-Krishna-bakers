const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { sendOTP } = require("../utils/Nodemailer"); // Import your mailer

// 🔒 Temporary Memory to store OTPs before saving to DB
// Format: { "email@gmail.com": { name, password, phone, otp } }
let otpStore = {};

// 🟢 1. SIGNUP (Validate -> Send OTP -> Store in Memory)
exports.signup = async (req, res) => {
  try {
    // Data is already validated by your middleware before reaching here!
    const { name, email, password, phone } = req.body;

    // Check if user already exists in MongoDB
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ msg: "User already exists" });

    // Generate 6-digit OTP
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();

    // Send Email
    const isSent = await sendOTP(email, generatedOtp);
    if (!isSent) {
      return res
        .status(500)
        .json({ msg: "Failed to send email. Check credentials." });
    }

    // Hash Password NOW (Security best practice)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Save to Temporary Memory (NOT MongoDB yet)
    otpStore[email] = {
      name,
      email,
      password: hashedPassword,
      phone,
      otp: generatedOtp,
      createdAt: Date.now(),
    };

    console.log(`📩 OTP sent to ${email}`);

    res.status(201).json({
      msg: "OTP sent to your email! Please verify to complete signup.",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error during signup" });
  }
};

// 🟢 2. VERIFY OTP (Check Memory -> Save to MongoDB)
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Check if we have a pending signup for this email
    const pendingUser = otpStore[email];

    if (!pendingUser) {
      return res
        .status(400)
        .json({
          msg: "Session expired or invalid email. Please signup again.",
        });
    }

    // Check if OTP matches
    if (pendingUser.otp !== otp) {
      return res.status(400).json({ msg: "Invalid OTP" });
    }

    // OTP IS CORRECT! Now we save to MongoDB.
    const newUser = new User({
      name: pendingUser.name,
      email: pendingUser.email,
      password: pendingUser.password, // Already hashed
      phone: pendingUser.phone,
      isVerified: true,
    });

    await newUser.save();

    // Clear the memory
    delete otpStore[email];

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
