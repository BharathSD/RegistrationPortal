import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Registration } from "@cricket-platform/shared";
import { apiRequest } from "./client";

export interface RegistrationWithTournament extends Registration {
  tournament: { id: string; name: string; feeRequired: boolean; entryFee: number };
}

export function useMyRegistrations(enabled: boolean) {
  return useQuery({
    queryKey: ["players", "me", "registrations"],
    queryFn: () => apiRequest<RegistrationWithTournament[]>("/registrations/me"),
    enabled,
  });
}

export function useRegisterForTournament() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { tournamentId: string; rulesAccepted: true; willingToBowl?: boolean; notes?: string }) =>
      apiRequest<Registration>("/registrations", { method: "POST", body: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["players", "me", "registrations"] }),
  });
}

export function useCancelRegistration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (registrationId: string) =>
      apiRequest<Registration>(`/registrations/${registrationId}/cancel`, { method: "POST" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["players", "me", "registrations"] }),
  });
}
