import type { Request, Response } from "express";
import type { TournamentInput, TournamentStatus } from "@cricket-platform/shared";

export interface TournamentsUseCases {
  createTournament: (input: TournamentInput, adminId: string) => Promise<unknown>;
  listTournaments: (status?: TournamentStatus) => Promise<unknown>;
  getTournament: (id: string) => Promise<unknown>;
  updateTournament: (id: string, changes: Partial<TournamentInput>) => Promise<unknown>;
  publishTournament: (id: string) => Promise<unknown>;
  getRoster: (id: string) => Promise<unknown>;
  deleteTournament: (id: string, adminId: string) => Promise<void>;
  removeRegistration: (tournamentId: string, registrationId: string, adminId: string) => Promise<void>;
  addPlayerToRoster: (
    tournamentId: string,
    playerId: string,
    adminId: string,
    details?: { willingToBowl?: boolean; notes?: string },
  ) => Promise<{ registration: unknown; alreadyExisted: boolean }>;
}

export function makeTournamentsController(useCases: TournamentsUseCases) {
  return {
    async create(req: Request, res: Response) {
      const tournament = await useCases.createTournament(req.body, req.auth!.sub);
      res.status(201).json(tournament);
    },

    async list(req: Request, res: Response) {
      const tournaments = (await useCases.listTournaments(
        req.query.status as TournamentStatus | undefined,
      )) as Array<{ status: TournamentStatus }>;
      const isAdmin = req.auth?.type === "ADMIN";
      // Draft tournaments are an organizer's working copy — never expose them to anonymous/player callers.
      const visible = isAdmin ? tournaments : tournaments.filter((t) => t.status !== "DRAFT");
      res.status(200).json(visible);
    },

    async get(req: Request, res: Response) {
      const tournament = await useCases.getTournament(req.params.tournamentId);
      res.status(200).json(tournament);
    },

    async update(req: Request, res: Response) {
      const tournament = await useCases.updateTournament(req.params.tournamentId, req.body);
      res.status(200).json(tournament);
    },

    async publish(req: Request, res: Response) {
      const tournament = await useCases.publishTournament(req.params.tournamentId);
      res.status(200).json(tournament);
    },

    async roster(req: Request, res: Response) {
      const roster = await useCases.getRoster(req.params.tournamentId);
      res.status(200).json(roster);
    },

    async remove(req: Request, res: Response) {
      await useCases.deleteTournament(req.params.tournamentId, req.auth!.sub);
      res.status(204).send();
    },

    async removeFromRoster(req: Request, res: Response) {
      await useCases.removeRegistration(req.params.tournamentId, req.params.registrationId, req.auth!.sub);
      res.status(204).send();
    },

    async addToRoster(req: Request, res: Response) {
      const { registration, alreadyExisted } = await useCases.addPlayerToRoster(
        req.params.tournamentId,
        req.body.playerId,
        req.auth!.sub,
        { willingToBowl: req.body.willingToBowl, notes: req.body.notes },
      );
      res.status(alreadyExisted ? 200 : 201).json(registration);
    },
  };
}
