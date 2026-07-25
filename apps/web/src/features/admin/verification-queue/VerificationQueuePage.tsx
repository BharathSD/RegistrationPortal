import { useState } from "react";
import { AlertTriangle, User } from "lucide-react";
import { Button, Card, Modal, Skeleton } from "../../../design-system";
import { Input, Select } from "../../../design-system/components/Field";
import { StatusBadge } from "../../../design-system/components/Badge";
import {
  useAdminPlayers,
  useAdminPlayerDetail,
  useApprovePlayer,
  useRejectPlayer,
  useRequestChanges,
  useDuplicateFlags,
} from "../../../lib/api/admin";
import { useToast } from "../../../design-system/components/Toast";
import { ApiError } from "../../../lib/api/client";
import { PlayerTypeEditor } from "../shared/PlayerTypeEditor";
import type { VerificationStatus } from "@cricket-platform/shared";

const STATUS_OPTIONS: Array<{ value: VerificationStatus | ""; label: string }> = [
  { value: "", label: "All statuses" },
  { value: "PENDING_VERIFICATION", label: "Pending verification" },
  { value: "CHANGES_REQUESTED", label: "Changes requested" },
  { value: "VERIFIED", label: "Verified" },
  { value: "REJECTED", label: "Rejected" },
];

export function VerificationQueuePage() {
  const [status, setStatus] = useState<VerificationStatus | "">("PENDING_VERIFICATION");
  const [q, setQ] = useState("");
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

  const { data, isLoading } = useAdminPlayers({ status: status || undefined, q: q || undefined, page: 1, pageSize: 50 });
  const { data: duplicateFlags } = useDuplicateFlags();

  const duplicateSet = new Set(duplicateFlags?.map((f) => f.playerId));

  return (
    <div>
      <h1 className="mb-4 font-display text-xl font-bold">Verification Queue</h1>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <Input label="Search" placeholder="Name, mobile, or Player ID" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="w-full sm:w-56">
          <Select
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value as VerificationStatus | "")}
            options={STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          />
        </div>
      </div>

      {isLoading && <Skeleton className="h-48" />}

      <div className="flex flex-col gap-2">
        {data?.items.map((player) => (
          <button key={player.id} onClick={() => setSelectedPlayerId(player.id)} className="text-left">
            <Card className="flex items-center justify-between gap-3">
              <div>
                <p className="font-medium">{player.fullName}</p>
                <p className="text-xs text-text-secondary">
                  {player.mobile} · {player.city}, {player.state}
                </p>
                {duplicateSet.has(player.id) && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-warning">
                    <AlertTriangle className="h-3.5 w-3.5" /> Possible duplicate
                  </p>
                )}
              </div>
              <StatusBadge status={player.verificationStatus} />
            </Card>
          </button>
        ))}
        {!isLoading && data?.items.length === 0 && (
          <Card className="text-center text-sm text-text-secondary">No players match this filter.</Card>
        )}
      </div>

      {selectedPlayerId && (
        <PlayerDetailModal
          playerId={selectedPlayerId}
          isDuplicate={duplicateSet.has(selectedPlayerId)}
          onClose={() => setSelectedPlayerId(null)}
        />
      )}
    </div>
  );
}

function PlayerDetailModal({ playerId, isDuplicate, onClose }: { playerId: string; isDuplicate: boolean; onClose: () => void }) {
  const { data: player, isLoading } = useAdminPlayerDetail(playerId);
  const approve = useApprovePlayer();
  const reject = useRejectPlayer();
  const requestChanges = useRequestChanges();
  const [rejectReason, setRejectReason] = useState("");
  const [changeMessage, setChangeMessage] = useState("");
  const [mode, setMode] = useState<"view" | "reject" | "request-changes">("view");
  const toast = useToast();

  async function handleApprove() {
    try {
      await approve.mutateAsync({ playerId, input: undefined });
      toast.success("Player approved — Player ID issued and WhatsApp confirmation sent.");
      onClose();
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
    }
  }

  async function handleReject() {
    try {
      await reject.mutateAsync({ playerId, input: { reason: rejectReason } });
      toast.success("Player rejected.");
      onClose();
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
    }
  }

  async function handleRequestChanges() {
    try {
      await requestChanges.mutateAsync({ playerId, input: { message: changeMessage } });
      toast.success("Change request sent to player.");
      onClose();
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
    }
  }

  return (
    <Modal open onClose={onClose} title={player?.fullName ?? "Player detail"}>
      {isLoading || !player ? (
        <Skeleton className="h-64" />
      ) : (
        <div className="flex flex-col gap-4">
          {player.photoUrl ? (
            <img
              src={player.photoUrl}
              alt={`${player.fullName}'s profile photo`}
              className="h-24 w-24 self-center rounded-full object-cover"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center self-center rounded-full bg-canvas text-text-secondary">
              <User className="h-10 w-10" />
            </div>
          )}
          {isDuplicate && (
            <div className="flex items-center gap-2 rounded-sm border border-warning/30 bg-warning/5 p-3 text-sm text-warning">
              <AlertTriangle className="h-4 w-4" /> Possible duplicate identity flagged — review before approving.
            </div>
          )}
          <dl className="grid grid-cols-2 gap-y-1.5 text-sm">
            <dt className="text-text-secondary">Mobile</dt>
            <dd>{player.mobile}</dd>
            <dt className="text-text-secondary">DOB</dt>
            <dd>{player.dateOfBirth}</dd>
            <dt className="text-text-secondary">Address</dt>
            <dd>
              {player.addressLine1}
              {player.addressLine2 ? `, ${player.addressLine2}` : ""}, {player.city}, {player.state},{" "}
              {player.country}
            </dd>
            <dt className="text-text-secondary">Emergency</dt>
            <dd>
              {player.emergencyContactName
                ? `${player.emergencyContactName} (${player.emergencyContactRelation}) · ${player.emergencyContactPhone}`
                : "Not provided"}
            </dd>
            <dt className="text-text-secondary">Jersey</dt>
            <dd>
              {player.jerseySize} · #{player.jerseyNumberPref1 || "—"}
            </dd>
            {player.medicalInfo && (
              <>
                <dt className="text-text-secondary">Medical (admin-only)</dt>
                <dd>
                  {[player.medicalInfo.bloodGroup, player.medicalInfo.allergies, player.medicalInfo.conditions]
                    .filter(Boolean)
                    .join(" · ") || "None provided"}
                </dd>
              </>
            )}
          </dl>

          {mode === "view" && <PlayerTypeEditor player={player} />}

          {mode === "view" && (
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={handleApprove}
                loading={approve.isPending}
                disabled={!player.cricketRole}
                title={!player.cricketRole ? "Assign a player type below before approving" : undefined}
              >
                Approve
              </Button>
              <Button variant="danger" onClick={() => setMode("reject")}>
                Reject
              </Button>
              <Button variant="secondary" onClick={() => setMode("request-changes")}>
                Request changes
              </Button>
            </div>
          )}
          {mode === "view" && !player.cricketRole && (
            <p className="text-xs text-warning">Assign a player type below before this player can be approved.</p>
          )}

          {mode === "reject" && (
            <div className="flex flex-col gap-2">
              <Input label="Reason for rejection" required value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setMode("view")}>
                  Cancel
                </Button>
                <Button variant="danger" disabled={!rejectReason} loading={reject.isPending} onClick={handleReject}>
                  Confirm rejection
                </Button>
              </div>
            </div>
          )}

          {mode === "request-changes" && (
            <div className="flex flex-col gap-2">
              <Input label="What needs to change?" required value={changeMessage} onChange={(e) => setChangeMessage(e.target.value)} />
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setMode("view")}>
                  Cancel
                </Button>
                <Button disabled={!changeMessage} loading={requestChanges.isPending} onClick={handleRequestChanges}>
                  Send request
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
