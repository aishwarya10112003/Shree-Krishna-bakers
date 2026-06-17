import { env } from "../../config/env";
import { consoleMailer } from "./consoleMailer";
import { smtpMailer } from "./smtpMailer";

/**
 * Mailer abstraction. The app depends on this interface, not on nodemailer.
 *  - MAIL_DRIVER=console -> OTPs print to the terminal (no secrets; local dev).
 *  - MAIL_DRIVER=smtp    -> real email via SMTP.
 * Swapping providers is a one-line change with zero impact on callers.
 */
export interface Mailer {
  sendOtp(to: string, otp: string): Promise<void>;
}

export const mailer: Mailer = env.MAIL_DRIVER === "smtp" ? smtpMailer : consoleMailer;
