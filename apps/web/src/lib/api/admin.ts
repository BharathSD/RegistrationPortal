import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  Player,
  PaginatedResult,
  VerificationStatus,
  DuplicateFlagStatus,
  AssignCricketProfileInput,
} from "@cricket-platform/shared";
import { apiRequest } from "./client";

export interface PlayerSearchParams {
  status?: VerificationStatus;
  q?: string;
  city?: string;
  page?: number;
  pageSize?: number;
}

function toQueryString(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") search.set(key, String(value));
  });
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export function useAdminPlayers(params: PlayerSearchParams) {
  return useQuery({
    queryKey: ["admin", "players", params],
    queryFn: () =>
      apiRequest<PaginatedResult<Player>>(
        `/admin/players${toQueryString({ ...params, page: params.page ?? 1, pageSize: params.pageSize ?? 20 })}`,
      ),
  });
}

export function useAdminPlayerDetail(playerId: string | undefined) {
  return useQuery({
    queryKey: ["admin", "players", playerId],
    queryFn: () => apiRequest<Player>(`/admin/players/${playerId}`),
    enabled: Boolean(playerId),
  });
}

function useAdminPlayerMutation<TInput>(build: (playerId: string, input: TInput) => Promise<Player>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ playerId, input }: { playerId: string; input: TInput }) => build(playerId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "players"] });
    },
  });
}

export function useApprovePlayer() {
  return useAdminPlayerMutation<void>((playerId) =>
    apiRequest<Player>(`/admin/players/${playerId}/approve`, { method: "POST" }),
  );
}

export function useRejectPlayer() {
  return useAdminPlayerMutation<{ reason: string }>((playerId, input) =>
    apiRequest<Player>(`/admin/players/${playerId}/reject`, { method: "POST", body: input }),
  );
}

export function useRequestChanges() {
  return useAdminPlayerMutation<{ message: string }>((playerId, input) =>
    apiRequest<Player>(`/admin/players/${playerId}/request-changes`, { method: "POST", body: input }),
  );
}

export function useAssignCricketProfile() {
  return useAdminPlayerMutation<AssignCricketProfileInput>((playerId, input) =>
    apiRequest<Player>(`/admin/players/${playerId}/cricket-profile`, { method: "PATCH", body: input }),
  );
}

export interface DuplicateFlag {
  id: string;
  playerId: string;
  suspectedDuplicatePlayerId: string;
  signal: string;
  status: string;
  createdAt: string;
}

export function useDuplicateFlags() {
  return useQuery({
    queryKey: ["admin", "duplicates"],
    queryFn: () => apiRequest<DuplicateFlag[]>("/admin/duplicates"),
  });
}

export function useResolveDuplicateFlag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ flagId, resolution }: { flagId: string; resolution: DuplicateFlagStatus }) =>
      apiRequest<DuplicateFlag>(`/admin/duplicates/${flagId}/resolve`, { method: "POST", body: { resolution } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "duplicates"] }),
  });
}
