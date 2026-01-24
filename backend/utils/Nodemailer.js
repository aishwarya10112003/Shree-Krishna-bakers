const nodemailer = require("nodemailer");

// 1. Configure the Transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    // ⚠️ USE process.env HERE!
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendOTP = async (email, otp) => {
  const mailOptions = {
    from: '"Shree Krishna Bakers" <noreply@shreekrishna.com>',
    to: email,
    subject: "Your Verification Code (OTP)",
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2>Welcome to Shree Krishna Bakers! 🎂</h2>
        <p>Your verification code is:</p>
        <h1 style="color: #ea580c; letter-spacing: 5px;">${otp}</h1>
        <p>This code expires in 10 minutes. Do not share it with anyone.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully to ${email}`);
    return true;
  } catch (error) {
    console.error("❌ Email failed to send:", error);
    return false;
  }
};

module.exports = { sendOTP };
