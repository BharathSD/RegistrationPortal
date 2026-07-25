import type { Request, Response } from "express";

export interface CheckinUseCases {
  scanCheckin: (qrToken: string, tournamentId: string, scannedByAdminId: string, deviceInfo?: string) => Promise<unknown>;
  getAttendanceRoster: (tournamentId: string) => Promise<unknown>;
}

export function makeCheckinController(useCases: CheckinUseCases) {
  return {
    async scan(req: Request, res: Response) {
      const result = await useCases.scanCheckin(
        req.body.qrToken,
        req.body.tournamentId,
        req.auth!.sub,
        req.headers["user-agent"],
      );
      res.status(200).json(result);
    },

    async roster(req: Request, res: Response) {
      const result = await useCases.getAttendanceRoster(req.params.tournamentId);
      res.status(200).json(result);
    },
  };
}
