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

export function useUpdateTournament() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, changes }: { id: string; changes: Partial<TournamentInput> }) =>
      apiRequest<Tournament>(`/tournaments/${id}`, { method: "PATCH", body: changes }),
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

export function useDeleteTournament() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiRequest<void>(`/tournaments/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tournaments"] }),
  });
}

export function useRemoveFromRoster(tournamentId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (registrationId: string) =>
      apiRequest<void>(`/tournaments/${tournamentId}/roster/${registrationId}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tournaments", tournamentId, "roster"] }),
  });
}

export function useAdminAddToRoster(tournamentId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (playerId: string) =>
      apiRequest<RosterEntry>(`/tournaments/${tournamentId}/roster`, {
        method: "POST",
        body: { playerId, rulesAccepted: true },
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tournaments", tournamentId, "roster"] }),
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
