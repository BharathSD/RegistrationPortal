import crypto from "node:crypto";
import type { PlayerRepository } from "../../domain/repositories/PlayerRepository";
import type { TournamentRepository } from "../../domain/repositories/TournamentRepository";
import type { RegistrationRepository, RegistrationWithRelations } from "../../domain/repositories/RegistrationRepository";
import type { WhatsAppProvider } from "../../domain/ports/providers";
import { ConflictError, ForbiddenError, NotFoundError } from "../../domain/errors/DomainError";

export interface RegisterForTournamentDeps {
  playerRepo: PlayerRepository;
  tournamentRepo: TournamentRepository;
  registrationRepo: RegistrationRepository;
  whatsAppProvider: WhatsAppProvider;
}

export interface RegisterForTournamentResult {
  registration: RegistrationWithRelations;
  alreadyExisted: boolean;
}

export interface RegistrationDetails {
  /** Per-tournament, not the player's general profile — defaults to true (most players who can bowl are willing to). */
  willingToBowl?: boolean;
  notes?: string;
}

export function makeRegisterForTournamentUseCase({
  playerRepo,
  tournamentRepo,
  registrationRepo,
  whatsAppProvider,
}: RegisterForTournamentDeps) {
  return async function registerForTournament(
    playerId: string,
    tournamentId: string,
    rulesAccepted: boolean,
    details: RegistrationDetails = {},
  ): Promise<RegisterForTournamentResult> {
    const player = await playerRepo.findById(playerId);
    if (!player) throw new NotFoundError("Player", playerId);
    if (player.verificationStatus !== "VERIFIED") {
      throw new ForbiddenError("Only verified players can register for tournaments");
    }

    const tournament = await tournamentRepo.findById(tournamentId);
    if (!tournament) throw new NotFoundError("Tournament", tournamentId);
    if (tournament.status !== "PUBLISHED") {
      throw new ConflictError(`Registration is not open for this tournament (status: ${tournament.status})`);
    }
    const now = new Date();
    if (now < new Date(tournament.registrationOpenAt) || now > new Date(tournament.registrationCloseAt)) {
      throw new ConflictError("Registration window is closed for this tournament");
    }

    const existing = await registrationRepo.findByPlayerAndTournament(playerId, tournamentId);
    // A CANCELLED registration doesn't count as "already registered" — the
    // player changed their mind and wants back in. Everything else
    // (PENDING_PAYMENT, CONFIRMED, CHECKED_IN) is a real existing
    // registration and stays idempotent.
    if (existing && existing.status !== "CANCELLED") {
      const full = await registrationRepo.findById(existing.id);
      return { registration: full!, alreadyExisted: true };
    }

    if (tournament.maxParticipants) {
      const confirmedCount = await tournamentRepo.countConfirmedRegistrations(tournamentId);
      if (confirmedCount >= tournament.maxParticipants) {
        throw new ConflictError("This tournament has reached its maximum number of participants");
      }
    }

    const qrToken = crypto.randomBytes(24).toString("base64url");
    const status = tournament.feeRequired ? "PENDING_PAYMENT" : "CONFIRMED";

    if (existing) {
      // Re-registering after a cancellation: the (playerId, tournamentId)
      // unique constraint means this has to reuse the same row rather than
      // insert a new one — a fresh QR token too, since the old one may
      // already have been shared/scanned before the player backed out.
      await registrationRepo.reactivate(existing.id, {
        status,
        rulesAccepted,
        willingToBowl: details.willingToBowl ?? true,
        notes: details.notes,
        qrToken,
      });
    } else {
      await registrationRepo.create({
        playerId,
        tournamentId,
        status,
        rulesAccepted,
        willingToBowl: details.willingToBowl ?? true,
        notes: details.notes,
        qrToken,
      });
    }
    const created = await registrationRepo.findByPlayerAndTournament(playerId, tournamentId);
    const full = await registrationRepo.findById(created!.id);

    if (status === "CONFIRMED") {
      await whatsAppProvider.send({
        to: player.mobile,
        templateName: "tournament_registration_confirmation",
        params: { name: player.fullName, tournament: tournament.name },
      });
    }

    return { registration: full!, alreadyExisted: false };
  };
}
