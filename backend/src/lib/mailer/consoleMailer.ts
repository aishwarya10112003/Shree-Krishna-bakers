import { logger } from "../logger";
import type { Mailer } from "./index";

/** Dev driver: prints the OTP to the backend console — no email account needed. */
export const consoleMailer: Mailer = {
  async sendOtp(to, otp) {
    logger.info(
      `\n──────────────────────────────\n📧 [DEV OTP] ${to}\n     CODE: ${otp}\n──────────────────────────────`,
    );
  },
};
