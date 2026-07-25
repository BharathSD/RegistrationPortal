import { useMutation } from "@tanstack/react-query";
import type {
  RequestOtpInput,
  VerifyOtpInput,
  AdminLoginInput,
  PlayerSummary,
  AdminUser,
} from "@cricket-platform/shared";
import { apiRequest } from "./client";

export interface RequestOtpResponse {
  expiresInSeconds: number;
  /** Only ever present in local/dev environments using the console SMS provider — see RequestOtpUseCase.ts. */
  devCode?: string;
}

export interface VerifyOtpResponse {
  accessToken: string;
  refreshToken: string;
  player: PlayerSummary | null;
  isNewPlayer: boolean;
}

export interface AdminLoginResponse {
  accessToken: string;
  refreshToken: string;
  admin: AdminUser;
}

export function useRequestOtp() {
  return useMutation({
    mutationFn: (input: RequestOtpInput) =>
      apiRequest<RequestOtpResponse>("/auth/otp/request", { method: "POST", body: input, auth: false }),
  });
}

export function useVerifyOtp() {
  return useMutation({
    mutationFn: (input: VerifyOtpInput) =>
      apiRequest<VerifyOtpResponse>("/auth/otp/verify", { method: "POST", body: input, auth: false }),
  });
}

export function useAdminLogin() {
  return useMutation({
    mutationFn: (input: AdminLoginInput) =>
      apiRequest<AdminLoginResponse>("/auth/admin/login", { method: "POST", body: input, auth: false }),
  });
}
