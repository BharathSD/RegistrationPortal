import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Player, PlayerProfileInput } from "@cricket-platform/shared";
import { apiRequest } from "./client";

export function useMyProfile(enabled: boolean) {
  return useQuery({
    queryKey: ["players", "me"],
    queryFn: () => apiRequest<Player>("/players/me"),
    enabled,
  });
}

export interface RegisterPlayerResponse extends Player {
  accessToken: string;
}

export function useRegisterPlayer() {
  return useMutation({
    mutationFn: (input: PlayerProfileInput) =>
      apiRequest<RegisterPlayerResponse>("/players/register", { method: "POST", body: input }),
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (changes: Partial<PlayerProfileInput>) =>
      apiRequest<Player>("/players/me", { method: "PATCH", body: changes }),
    onSuccess: (updated) => queryClient.setQueryData(["players", "me"], updated),
  });
}

export function useUploadPhoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => {
      const form = new FormData();
      form.append("photo", file);
      return apiRequest<Player>("/players/me/photo", { method: "POST", body: form, isFormData: true });
    },
    onSuccess: (updated) => queryClient.setQueryData(["players", "me"], updated),
  });
}
