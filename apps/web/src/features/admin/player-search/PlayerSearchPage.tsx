import { useState } from "react";
import { Download } from "lucide-react";
import { Button, Card, Skeleton } from "../../../design-system";
import { Input, Select } from "../../../design-system/components/Field";
import { StatusBadge } from "../../../design-system/components/Badge";
import { useAdminPlayers } from "../../../lib/api/admin";
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
  const [status, setStatus] = useState<VerificationStatus | "">("");
  const [q, setQ] = useState("");
  const [city, setCity] = useState("");

  const { data, isLoading } = useAdminPlayers({ status: status || undefined, q: q || undefined, city: city || undefined, page: 1, pageSize: 100 });

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
                role: p.cricketRole,
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

      {isLoading && <Skeleton className="h-64" />}

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="border-b border-border text-left text-text-secondary">
            <tr>
              <th className="p-3">Player ID</th>
              <th className="p-3">Name</th>
              <th className="p-3">Mobile</th>
              <th className="p-3">Location</th>
              <th className="p-3">Role</th>
              <th className="p-3">Status</th>
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
                <td className="p-3">{p.cricketRole ? p.cricketRole.replace("_", " ") : "—"}</td>
                <td className="p-3">
                  <StatusBadge status={p.verificationStatus} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!isLoading && data?.items.length === 0 && (
          <p className="p-6 text-center text-sm text-text-secondary">No players match this search.</p>
        )}
      </Card>
      {data && <p className="mt-2 text-xs text-text-secondary">{data.total} total players match this filter.</p>}
    </div>
  );
}
