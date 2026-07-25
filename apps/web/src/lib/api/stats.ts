import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "./client";

interface PlayerStats {
  totals: { matchesPlayed: number; runsScored: number; wicketsTaken: number; catches: number };
  perTournament: Array<{ tournamentId: string; matchesPlayed: number; runsScored: number; wicketsTaken: number; catches: number }>;
}

export function usePlayerStats(playerId: string | undefined) {
  return useQuery({
    queryKey: ["stats", "players", playerId],
    queryFn: () => apiRequest<PlayerStats>(`/stats/players/${playerId}`),
    enabled: Boolean(playerId),
  });
}
