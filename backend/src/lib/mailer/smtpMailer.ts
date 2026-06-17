import nodemailer from "nodemailer";
import { env } from "../../config/env";
import { logger } from "../logger";
import type { Mailer } from "./index";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
});

/** Production driver: sends real email via SMTP. */
export const smtpMailer: Mailer = {
  async sendOtp(to, otp) {
    await transporter.sendMail({
      from: env.MAIL_FROM,
      to,
      subject: "Your Verification Code (OTP)",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2>Welcome to Shree Krishna Bakers! 🎂</h2>
          <p>Your verification code is:</p>
          <h1 style="color: #ea580c; letter-spacing: 5px;">${otp}</h1>
          <p>This code expires in 10 minutes. Do not share it with anyone.</p>
        </div>`,
    });
    logger.info(`OTP email sent to ${to}`);
  },
};
