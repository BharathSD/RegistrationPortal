import { z } from "zod";
import { MOBILE_REGEX, OTP_CODE_REGEX } from "../constants/validation";
import { OTP_PURPOSES } from "../constants/enums";

export const requestOtpSchema = z.object({
  mobile: z.string().regex(MOBILE_REGEX, "Enter a valid mobile number in E.164 format, e.g. +919876543210"),
  purpose: z.enum(OTP_PURPOSES),
});
export type RequestOtpInput = z.infer<typeof requestOtpSchema>;

export const verifyOtpSchema = z.object({
  mobile: z.string().regex(MOBILE_REGEX),
  code: z.string().regex(OTP_CODE_REGEX, "Enter the code exactly as received"),
  purpose: z.enum(OTP_PURPOSES),
});
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(10),
});
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;

export const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});
export type AdminLoginInput = z.infer<typeof adminLoginSchema>;
