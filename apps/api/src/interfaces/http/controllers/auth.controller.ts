import type { Request, Response } from "express";
import type { RequestOtpInput, VerifyOtpInput, AdminLoginInput } from "@cricket-platform/shared";
import type { RequestOtpResult } from "../../../application/auth/RequestOtpUseCase";

export interface AuthUseCases {
  requestOtp: (input: RequestOtpInput) => Promise<RequestOtpResult>;
  verifyOtp: (input: VerifyOtpInput) => Promise<unknown>;
  refreshSession: (refreshToken: string) => Promise<unknown>;
  adminLogin: (input: AdminLoginInput) => Promise<unknown>;
}

export function makeAuthController(useCases: AuthUseCases) {
  return {
    async requestOtp(req: Request, res: Response) {
      const result = await useCases.requestOtp(req.body);
      res.status(202).json(result);
    },

    async verifyOtp(req: Request, res: Response) {
      const result = await useCases.verifyOtp(req.body);
      res.status(200).json(result);
    },

    async refreshToken(req: Request, res: Response) {
      const result = await useCases.refreshSession(req.body.refreshToken);
      res.status(200).json(result);
    },

    async adminLogin(req: Request, res: Response) {
      const result = await useCases.adminLogin(req.body);
      res.status(200).json(result);
    },
  };
}
