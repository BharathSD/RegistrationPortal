import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Tournament, TournamentInput, TournamentStatus } from "@cricket-platform/shared";
import { apiRequest } from "./client";

export function useTournaments(status?: TournamentStatus, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["tournaments", status ?? "all"],
    queryFn: () => apiRequest<Tournament[]>(`/tournaments${status ? `?status=${status}` : ""}`),
    enabled: options?.enabled ?? true,
  });
}

export function useTournament(id: string | undefined) {
  return useQuery({
    queryKey: ["tournaments", id],
    queryFn: () => apiRequest<Tournament>(`/tournaments/${id}`),
    enabled: Boolean(id),
  });
}

export function useCreateTournament() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: TournamentInput) => apiRequest<Tournament>("/tournaments", { method: "POST", body: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tournaments"] }),
  });
}

export function usePublishTournament() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiRequest<Tournament>(`/tournaments/${id}/publish`, { method: "POST" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tournaments"] }),
  });
}

interface RosterEntry {
  id: string;
  status: string;
  player: { id: string; fullName: string; playerId: string | null; mobile: string };
}

export function useTournamentRoster(tournamentId: string | undefined) {
  return useQuery({
    queryKey: ["tournaments", tournamentId, "roster"],
    queryFn: () => apiRequest<RosterEntry[]>(`/tournaments/${tournamentId}/roster`),
    enabled: Boolean(tournamentId),
  });
}
