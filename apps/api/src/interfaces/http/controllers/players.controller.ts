import type { Request, Response } from "express";
import type { PlayerProfileInput } from "@cricket-platform/shared";
import { ForbiddenError, UnauthorizedError } from "../../../domain/errors/DomainError";
import { isPendingSubject } from "../../../application/auth/otp.util";
import { hasValidImageSignature } from "../middleware/upload";

export interface PlayersUseCases {
  registerPlayer: (mobile: string, profile: PlayerProfileInput) => Promise<{ id: string }>;
  getMyProfile: (playerId: string) => Promise<unknown>;
  updateProfile: (playerId: string, changes: Partial<PlayerProfileInput>) => Promise<unknown>;
  uploadPhoto: (playerId: string, buffer: Buffer) => Promise<unknown>;
  detectDuplicates: (playerId: string) => Promise<unknown>;
  issueSessionForPlayer: (playerId: string, mobile: string) => Promise<{ accessToken: string; refreshToken: string }>;
}

function requireExistingPlayerId(req: Request): string {
  const sub = req.auth?.sub;
  if (!sub || isPendingSubject(sub)) {
    throw new UnauthorizedError("Complete registration before accessing this resource");
  }
  return sub;
}

export function makePlayersController(useCases: PlayersUseCases) {
  return {
    async register(req: Request, res: Response) {
      if (req.auth?.purpose !== "REGISTRATION" || !req.auth.mobile) {
        throw new ForbiddenError("A REGISTRATION-purpose OTP session is required");
      }
      const player = await useCases.registerPlayer(req.auth.mobile, req.body);
      await useCases.detectDuplicates(player.id);
      const session = await useCases.issueSessionForPlayer(player.id, req.auth.mobile);
      res.status(201).json({ ...player, ...session });
    },

    async getMe(req: Request, res: Response) {
      const playerId = requireExistingPlayerId(req);
      const player = await useCases.getMyProfile(playerId);
      res.status(200).json(player);
    },

    async updateMe(req: Request, res: Response) {
      const playerId = requireExistingPlayerId(req);
      const player = await useCases.updateProfile(playerId, req.body);
      res.status(200).json(player);
    },

    async uploadPhoto(req: Request, res: Response) {
      const playerId = requireExistingPlayerId(req);
      const file = (req as Request & { file?: Express.Multer.File }).file;
      if (!file) throw new ForbiddenError("No photo file was provided");
      if (!hasValidImageSignature(file.buffer)) {
        res.status(415).json({ error: { code: "UNSUPPORTED_FILE_TYPE", message: "File does not look like a valid image" } });
        return;
      }
      const player = await useCases.uploadPhoto(playerId, file.buffer);
      res.status(200).json(player);
    },
  };
}
