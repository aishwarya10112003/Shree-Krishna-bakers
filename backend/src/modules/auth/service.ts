/**
 * Auth business logic. No `req`/`res` here — pure functions over inputs, which
 * makes them trivial to unit-test. HTTP concerns live in the controller.
 */
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import type { User } from "@prisma/client";
import { prisma } from "../../db/prisma";
import { ApiError } from "../../lib/ApiError";
import { mailer } from "../../lib/mailer";
import { serializeAuthUser } from "../../lib/serialize";
import {
  hashToken,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../../lib/jwt";
import { env } from "../../config/env";
import type { SigninInput, SignupInput, VerifyOtpInput } from "./schemas";

const OTP_TTL_MIN = 10;
const SALT_ROUNDS = 10;

/** Cryptographically secure 6-digit OTP (NOT Math.random). */
function generateOtp(): string {
  return crypto.randomInt(100_000, 1_000_000).toString();
}

export async function signup(input: SignupInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing?.isVerified) throw ApiError.conflict("User already exists");

  const otp = generateOtp();
  const [passwordHash, otpHash] = await Promise.all([
    bcrypt.hash(input.password, SALT_ROUNDS),
    bcrypt.hash(otp, SALT_ROUNDS), // OTP stored hashed, never plaintext
  ]);
  const otpExpiry = new Date(Date.now() + OTP_TTL_MIN * 60_000);

  // upsert: re-signing-up an existing UNVERIFIED account just refreshes its OTP.
  await prisma.user.upsert({
    where: { email: input.email },
    update: { name: input.name, password: passwordHash, phone: input.phone, otpHash, otpExpiry },
    create: {
      name: input.name,
      email: input.email,
      password: passwordHash,
      phone: input.phone,
      otpHash,
      otpExpiry,
      isVerified: false,
    },
  });

  await mailer.sendOtp(input.email, otp);
  return { msg: "OTP sent to your email! Please verify to complete signup." };
}

export async function verifyOtp(input: VerifyOtpInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) throw ApiError.badRequest("No signup found for this email. Please signup again.");
  if (user.isVerified) throw ApiError.badRequest("Email already verified. Please login.");
  if (!user.otpHash || !user.otpExpiry) {
    throw ApiError.badRequest("No OTP found. Please signup again to receive a new OTP.");
  }
  if (new Date() > user.otpExpiry) {
    await prisma.user.update({ where: { id: user.id }, data: { otpHash: null, otpExpiry: null } });
    throw ApiError.badRequest("OTP has expired. Please signup again to receive a new OTP.");
  }
  const matches = await bcrypt.compare(input.otp, user.otpHash);
  if (!matches) throw ApiError.badRequest("Invalid OTP");

  await prisma.user.update({
    where: { id: user.id },
    data: { isVerified: true, otpHash: null, otpExpiry: null },
  });
  return { msg: "Account verified and created! You can now login." };
}

/** Issue an access token + a rotation-tracked refresh token. */
async function issueSession(user: User) {
  const accessToken = signAccessToken({ id: user.id, role: user.role });
  const refreshToken = signRefreshToken({ id: user.id });
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      expiresAt: new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 86_400_000),
    },
  });
  return { accessToken, refreshToken, user: serializeAuthUser(user) };
}

export async function signin(input: SigninInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) throw ApiError.unauthorized("Invalid Credentials");
  if (!user.isVerified) {
    throw ApiError.forbidden("Email not verified. Please verify your email first.");
  }
  const matches = await bcrypt.compare(input.password, user.password);
  if (!matches) throw ApiError.unauthorized("Invalid Credentials");
  return issueSession(user);
}

/** Verify the refresh token, confirm it's still valid in the DB, then rotate. */
export async function refresh(rawToken?: string) {
  if (!rawToken) throw ApiError.unauthorized("No session. Please login again.");

  let payload: { id: string };
  try {
    payload = verifyRefreshToken(rawToken);
  } catch {
    throw ApiError.unauthorized("Session expired. Please login again.");
  }

  const record = await prisma.refreshToken.findUnique({
    where: { tokenHash: hashToken(rawToken) },
  });
  if (!record || record.revokedAt || record.expiresAt < new Date()) {
    throw ApiError.unauthorized("Invalid session. Please login again.");
  }

  const user = await prisma.user.findUnique({ where: { id: payload.id } });
  if (!user) throw ApiError.unauthorized("User no longer exists");

  // Rotation: the used refresh token is revoked and replaced. If a stolen token
  // is replayed after rotation, it's already revoked → access denied.
  await prisma.refreshToken.update({
    where: { id: record.id },
    data: { revokedAt: new Date() },
  });
  return issueSession(user);
}

export async function logout(rawToken?: string) {
  if (rawToken) {
    await prisma.refreshToken.updateMany({
      where: { tokenHash: hashToken(rawToken) },
      data: { revokedAt: new Date() },
    });
  }
  return { msg: "Logged out successfully" };
}
