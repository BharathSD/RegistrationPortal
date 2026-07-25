import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreateCampaignInput } from "@cricket-platform/shared";
import { apiRequest } from "./client";

interface CampaignWithStats {
  campaign: {
    id: string;
    title: string;
    channel: string;
    template: string;
    tournamentId: string | null;
    sentAt: string | null;
    createdAt: string;
  };
  stats: { queued: number; sent: number; failed: number; delivered: number };
}

export function useCampaigns() {
  return useQuery({
    queryKey: ["communications", "campaigns"],
    queryFn: () => apiRequest<CampaignWithStats[]>("/communications/campaigns"),
  });
}

export function useCreateCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCampaignInput) =>
      apiRequest<{ campaign: unknown; audienceSize: number }>("/communications/campaigns", {
        method: "POST",
        body: input,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["communications", "campaigns"] }),
  });
}
