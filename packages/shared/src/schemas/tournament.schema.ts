import { z } from "zod";

/** Base object shape — kept separate from the refined version below so callers can still call `.partial()` on it (Zod's `.refine()` returns a ZodEffects, which no longer exposes `.partial()`). */
export const tournamentInputObjectSchema = z.object({
  name: z.string().trim().min(3).max(150),
  description: z.string().max(5000).optional(),
  venue: z.string().trim().min(2).max(200),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  registrationOpenAt: z.coerce.date(),
  registrationCloseAt: z.coerce.date(),
  maxParticipants: z.coerce.number().int().min(1).max(100000).optional(),
  entryFee: z.coerce.number().min(0).default(0),
  feeRequired: z.boolean().default(false),
  rulesMarkdown: z.string().max(20000).optional(),
});

export const tournamentInputSchema = tournamentInputObjectSchema
  .refine((v) => v.endDate >= v.startDate, {
    message: "endDate must be on or after startDate",
    path: ["endDate"],
  })
  .refine((v) => v.registrationCloseAt > v.registrationOpenAt, {
    message: "registrationCloseAt must be after registrationOpenAt",
    path: ["registrationCloseAt"],
  });
export type TournamentInput = z.infer<typeof tournamentInputSchema>;

/** For PATCH endpoints: all fields optional, no cross-field refinement (partial updates may only touch one side of a date pair). */
export const tournamentUpdateSchema = tournamentInputObjectSchema.partial();
export type TournamentUpdateInput = z.infer<typeof tournamentUpdateSchema>;

export const registerForTournamentSchema = z.object({
  tournamentId: z.string().uuid(),
  rulesAccepted: z.literal(true, {
    errorMap: () => ({ message: "You must accept the tournament rules to register" }),
  }),
});
export type RegisterForTournamentInput = z.infer<typeof registerForTournamentSchema>;
