import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Download, Pencil, Trash2, User } from "lucide-react";
import { Button, Card, ConfirmDialog, Modal, QueryError, Skeleton } from "../../../design-system";
import { Input, Select } from "../../../design-system/components/Field";
import { StatusBadge } from "../../../design-system/components/Badge";
import { useToast } from "../../../design-system/components/Toast";
import { ApiError } from "../../../lib/api/client";
import { useAdminPlayerDetail, useAdminPlayers, useDeletePlayer } from "../../../lib/api/admin";
import { PlayerTypeEditor } from "../shared/PlayerTypeEditor";
import type { VerificationStatus } from "@cricket-platform/shared";

const STATUS_OPTIONS: Array<{ value: VerificationStatus | ""; label: string }> = [
  { value: "", label: "All statuses" },
  { value: "PENDING_VERIFICATION", label: "Pending verification" },
  { value: "CHANGES_REQUESTED", label: "Changes requested" },
  { value: "VERIFIED", label: "Verified" },
  { value: "REJECTED", label: "Rejected" },
  { value: "SUSPENDED", label: "Suspended" },
];

function exportToCsv(rows: Array<Record<string, string | number | null>>) {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => JSON.stringify(r[h] ?? "")).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `players-export-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function PlayerSearchPage() {
  // Supports deep-linking a search from elsewhere in the admin (e.g. "View in Player Search" from a duplicate flag) via ?q=.
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<VerificationStatus | "">("");
  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const [city, setCity] = useState("");

  const { data, isLoading, isError, refetch } = useAdminPlayers({ status: status || undefined, q: q || undefined, city: city || undefined, page: 1, pageSize: 100 });
  const deletePlayer = useDeletePlayer();
  const toast = useToast();
  const [editPlayerId, setEditPlayerId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setDeletingId(deleteTarget.id);
    try {
      await deletePlayer.mutateAsync(deleteTarget.id);
      toast.success(`${deleteTarget.name} removed.`);
      setDeleteTarget(null);
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-display text-xl font-bold">Player Search</h1>
        <Button
          size="sm"
          variant="secondary"
          disabled={!data?.items.length}
          onClick={() =>
            exportToCsv(
              (data?.items ?? []).map((p) => ({
                playerId: p.playerId,
                fullName: p.fullName,
                mobile: p.mobile,
                city: p.city,
                state: p.state,
                role: p.playerType,
                status: p.verificationStatus,
              })),
            )
          }
        >
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Input label="Search" placeholder="Name, mobile, Player ID" value={q} onChange={(e) => setQ(e.target.value)} />
        <Input label="City" value={city} onChange={(e) => setCity(e.target.value)} />
        <Select
          label="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value as VerificationStatus | "")}
          options={STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
        />
      </div>

      {isError && <QueryError onRetry={refetch} />}

      {!isError && isLoading && <Skeleton className="h-64" />}

      {!isError && (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left text-text-secondary">
              <tr>
                <th className="p-3">Player ID</th>
                <th className="p-3">Name</th>
                <th className="p-3">Mobile</th>
                <th className="p-3">Location</th>
                <th className="p-3">Player Type</th>
                <th className="p-3">Status</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {data?.items.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0">
                  <td className="p-3 font-mono text-xs">{p.playerId ?? "—"}</td>
                  <td className="p-3">{p.fullName}</td>
                  <td className="p-3">{p.mobile}</td>
                  <td className="p-3">
                    {p.city}, {p.state}
                  </td>
                  <td className="p-3">{p.playerType ? p.playerType.replace("_", " ") : "—"}</td>
                  <td className="p-3">
                    <StatusBadge status={p.verificationStatus} />
                  </td>
                  <td className="p-3 text-right">
                    <Button size="sm" variant="ghost" aria-label={`Edit ${p.fullName}`} onClick={() => setEditPlayerId(p.id)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      aria-label={`Remove ${p.fullName}`}
                      loading={deletingId === p.id}
                      onClick={() => setDeleteTarget({ id: p.id, name: p.fullName })}
                    >
                      <Trash2 className="h-4 w-4 text-danger" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!isLoading && data?.items.length === 0 && (
            <p className="p-6 text-center text-sm text-text-secondary">No players match this search.</p>
          )}
        </Card>
      )}
      {data && <p className="mt-2 text-xs text-text-secondary">{data.total} total players match this filter.</p>}

      {editPlayerId && <PlayerEditModal playerId={editPlayerId} onClose={() => setEditPlayerId(null)} />}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Remove player"
        message={`Remove ${deleteTarget?.name} from the platform? Their profile will no longer be searchable or able to log in. This cannot be undone.`}
        confirmLabel="Remove player"
        variant="danger"
        loading={deletingId === deleteTarget?.id}
      />
    </div>
  );
}

/** Reassign a player's type (and the rest of their cricket profile) any time after registration — not just from the Verification Queue. */
function PlayerEditModal({ playerId, onClose }: { playerId: string; onClose: () => void }) {
  const { data: player, isLoading } = useAdminPlayerDetail(playerId);

  return (
    <Modal open onClose={onClose} title={player?.fullName ?? "Edit player"}>
      {isLoading || !player ? (
        <Skeleton className="h-48" />
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
          <dl className="grid grid-cols-2 gap-y-1.5 text-sm">
            <dt className="text-text-secondary">Mobile</dt>
            <dd>{player.mobile}</dd>
            <dt className="text-text-secondary">Status</dt>
            <dd>
              <StatusBadge status={player.verificationStatus} />
            </dd>
          </dl>
          <PlayerTypeEditor player={player} />
        </div>
      )}
    </Modal>
  );
}
