import type { Request, Response } from "express";
import type { RequestOtpInput, VerifyOtpInput, AdminLoginInput } from "@cricket-platform/shared";
import type { RequestOtpResult } from "../../../application/auth/RequestOtpUseCase";
import { setRefreshTokenCookie, clearRefreshTokenCookie, readRefreshTokenCookie } from "../cookies";

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUseCases {
  requestOtp: (input: RequestOtpInput) => Promise<RequestOtpResult>;
  verifyOtp: (input: VerifyOtpInput) => Promise<TokenPair>;
  refreshSession: (refreshToken: string) => Promise<TokenPair>;
  adminLogin: (input: AdminLoginInput) => Promise<TokenPair>;
  logout: (refreshToken: string | undefined) => Promise<void>;
}

/** Strips the refresh token out of a use-case result before it goes in a JSON response — it belongs only in the httpOnly cookie set alongside it, never in a client-readable response body. Generic so extra fields (player, admin, isNewPlayer, ...) pass through untouched. */
function withoutRefreshToken<T extends TokenPair>(result: T): Omit<T, "refreshToken"> {
  const { refreshToken: _refreshToken, ...rest } = result;
  return rest;
}

export function makeAuthController(useCases: AuthUseCases) {
  return {
    async requestOtp(req: Request, res: Response) {
      const result = await useCases.requestOtp(req.body);
      res.status(202).json(result);
    },

    async verifyOtp(req: Request, res: Response) {
      const result = await useCases.verifyOtp(req.body);
      setRefreshTokenCookie(res, result.refreshToken);
      res.status(200).json(withoutRefreshToken(result));
    },

    async refreshToken(req: Request, res: Response) {
      const token = readRefreshTokenCookie(req);
      const result = await useCases.refreshSession(token ?? "");
      setRefreshTokenCookie(res, result.refreshToken);
      res.status(200).json(withoutRefreshToken(result));
    },

    async adminLogin(req: Request, res: Response) {
      const result = await useCases.adminLogin(req.body);
      setRefreshTokenCookie(res, result.refreshToken);
      res.status(200).json(withoutRefreshToken(result));
    },

    async logout(req: Request, res: Response) {
      await useCases.logout(readRefreshTokenCookie(req));
      clearRefreshTokenCookie(res);
      res.status(204).send();
    },
  };
}
