import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button, Card, QueryError } from "../../../design-system";
import { StatusBadge } from "../../../design-system/components/Badge";
import { useToast } from "../../../design-system/components/Toast";
import { ApiError } from "../../../lib/api/client";
import {
  useDuplicateFlags,
  useResolveDuplicateFlag,
  type DuplicateFlag,
  type DuplicateFlagPlayerSummary,
} from "../../../lib/api/admin";

const SIGNAL_LABEL: Record<string, string> = {
  NAME_DOB_MATCH: "Same name & date of birth",
  EMERGENCY_CONTACT_REUSE: "Same emergency contact number",
  PHOTO_HASH_MATCH: "Similar profile photo",
};

/**
 * Registration auto-flags likely duplicate identities (see
 * DetectDuplicatesUseCase) but never blocks or merges anything — an admin
 * has to look at both profiles and decide. This is that decision screen:
 * dismiss if it's a coincidence, or confirm if it's the same person so the
 * admin knows to go remove the duplicate profile from Player Search.
 */
export function DuplicateFlagsPage() {
  const { data: flags, isLoading, isError, refetch } = useDuplicateFlags();
  const resolve = useResolveDuplicateFlag();
  const toast = useToast();

  async function handleResolve(flag: DuplicateFlag, resolution: "DISMISSED" | "CONFIRMED_MERGED") {
    try {
      await resolve.mutateAsync({ flagId: flag.id, resolution });
      toast.success(resolution === "DISMISSED" ? "Dismissed — not a duplicate." : "Marked as a confirmed duplicate.");
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
    }
  }

  return (
    <div>
      <h1 className="mb-1 font-display text-xl font-bold">Duplicate Flags</h1>
      <p className="mb-4 text-sm text-text-secondary">
        The system flags players who share an exact name + date of birth, or the same emergency contact number, in
        case the same person registered twice under different mobile numbers. Review each pair below.
      </p>

      {isError && <QueryError onRetry={refetch} />}
      {!isError && isLoading && <p className="text-sm text-text-secondary">Loading...</p>}
      {!isError && !isLoading && flags?.length === 0 && (
        <Card className="text-center text-sm text-text-secondary">No open duplicate flags — nothing to review.</Card>
      )}

      <div className="flex flex-col gap-3">
        {!isError && flags?.map((flag) => (
          <Card key={flag.id} className="flex flex-col gap-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-warning">
              {SIGNAL_LABEL[flag.signal] ?? flag.signal}
            </p>
            <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
              <PlayerSummaryCard player={flag.player} />
              <ArrowRight className="hidden h-4 w-4 shrink-0 rotate-90 text-text-secondary sm:block sm:rotate-0" />
              <PlayerSummaryCard player={flag.suspectedDuplicatePlayer} />
            </div>
            <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-3">
              <Button
                size="sm"
                variant="secondary"
                loading={resolve.isPending}
                onClick={() => handleResolve(flag, "DISMISSED")}
              >
                Not a duplicate
              </Button>
              <Button
                size="sm"
                variant="danger"
                loading={resolve.isPending}
                onClick={() => handleResolve(flag, "CONFIRMED_MERGED")}
              >
                Confirm duplicate
              </Button>
            </div>
            <p className="text-xs text-text-secondary">
              Confirming only marks this pair as resolved — it doesn't delete anything. Remove the duplicate profile
              yourself from Player Search once you've decided which one to keep.
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}

function PlayerSummaryCard({ player }: { player: DuplicateFlagPlayerSummary }) {
  return (
    <div className="rounded-sm border border-border p-3 text-sm">
      <p className="font-medium">{player.fullName}</p>
      <p className="text-xs text-text-secondary">
        {player.mobile} {player.playerId ? `· ${player.playerId}` : ""}
      </p>
      <div className="mt-1.5 flex items-center justify-between gap-2">
        <StatusBadge status={player.verificationStatus} />
        <Link to={`/admin/players?q=${encodeURIComponent(player.mobile)}`} className="text-xs font-medium text-primary">
          View in Player Search →
        </Link>
      </div>
    </div>
  );
}
