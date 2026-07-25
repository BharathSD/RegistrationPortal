import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "./client";

interface CheckinResult {
  checkin: { id: string; scannedAt: string };
  player: { id: string; fullName: string; playerId: string | null };
}

export function useScanCheckin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { qrToken: string; tournamentId: string }) =>
      apiRequest<CheckinResult>("/checkin/scan", { method: "POST", body: input }),
    onSuccess: (_data, variables) =>
      queryClient.invalidateQueries({ queryKey: ["checkin", variables.tournamentId, "roster"] }),
  });
}

interface AttendanceRoster {
  roster: Array<{ id: string; status: string; player: { fullName: string; playerId: string | null } }>;
  totalConfirmed: number;
  checkedInCount: number;
}

export function useAttendanceRoster(tournamentId: string | undefined) {
  return useQuery({
    queryKey: ["checkin", tournamentId, "roster"],
    queryFn: () => apiRequest<AttendanceRoster>(`/checkin/${tournamentId}/roster`),
    enabled: Boolean(tournamentId),
    refetchInterval: 5000,
  });
}
