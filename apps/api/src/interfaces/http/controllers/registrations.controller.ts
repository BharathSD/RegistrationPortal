import type { Request, Response } from "express";
import { isPendingSubject } from "../../../application/auth/otp.util";
import { UnauthorizedError } from "../../../domain/errors/DomainError";

export interface RegistrationsUseCases {
  registerForTournament: (
    playerId: string,
    tournamentId: string,
    rulesAccepted: boolean,
  ) => Promise<{ registration: unknown; alreadyExisted: boolean }>;
  createPaymentOrder: (registrationId: string) => Promise<unknown>;
  cancelRegistration: (registrationId: string) => Promise<unknown>;
  listMyRegistrations: (playerId: string) => Promise<unknown>;
}

function requirePlayerId(req: Request): string {
  const sub = req.auth?.sub;
  if (!sub || isPendingSubject(sub)) throw new UnauthorizedError("Complete registration first");
  return sub;
}

export function makeRegistrationsController(useCases: RegistrationsUseCases) {
  return {
    async register(req: Request, res: Response) {
      const playerId = requirePlayerId(req);
      const { registration, alreadyExisted } = await useCases.registerForTournament(
        playerId,
        req.body.tournamentId,
        req.body.rulesAccepted,
      );
      res.status(alreadyExisted ? 200 : 201).json(registration);
    },

    async pay(req: Request, res: Response) {
      const order = await useCases.createPaymentOrder(req.params.registrationId);
      res.status(200).json(order);
    },

    async cancel(req: Request, res: Response) {
      const registration = await useCases.cancelRegistration(req.params.registrationId);
      res.status(200).json(registration);
    },

    async listMine(req: Request, res: Response) {
      const playerId = requirePlayerId(req);
      const registrations = await useCases.listMyRegistrations(playerId);
      res.status(200).json(registrations);
    },
  };
}
