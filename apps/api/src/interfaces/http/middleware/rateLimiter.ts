import rateLimit from "express-rate-limit";
import { env } from "../../../config/env";

/** General API-wide limiter. */
export const globalRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: "RATE_LIMITED", message: "Too many requests, please slow down." } },
});

/** Tighter limiter for OTP request/verify — the endpoints most attractive to abuse (SMS-bombing, brute force). */
export const otpRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.OTP_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `otp:${req.body?.mobile ?? req.ip}`,
  message: { error: { code: "RATE_LIMITED", message: "Too many OTP attempts. Please wait before trying again." } },
});

/** Stricter limiter for admin login to slow down credential stuffing. */
export const loginRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: "RATE_LIMITED", message: "Too many login attempts. Please wait before trying again." } },
});
