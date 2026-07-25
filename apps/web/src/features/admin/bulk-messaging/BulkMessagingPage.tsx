import { useState } from "react";
import { Send } from "lucide-react";
import { Button, Card } from "../../../design-system";
import { Input, Select } from "../../../design-system/components/Field";
import { StatusBadge } from "../../../design-system/components/Badge";
import { useCampaigns, useCreateCampaign } from "../../../lib/api/communications";
import { useTournaments } from "../../../lib/api/tournaments";
import { useToast } from "../../../design-system/components/Toast";
import { ApiError } from "../../../lib/api/client";
import type { MessageChannel, VerificationStatus } from "@cricket-platform/shared";

export function BulkMessagingPage() {
  const [title, setTitle] = useState("");
  const [channel, setChannel] = useState<MessageChannel>("WHATSAPP");
  const [template, setTemplate] = useState("Hi {{name}}, ");
  const [tournamentId, setTournamentId] = useState("");
  const [statusFilter, setStatusFilter] = useState<VerificationStatus | "">("");

  const { data: tournaments } = useTournaments();
  const { data: campaigns, isLoading } = useCampaigns();
  const createCampaign = useCreateCampaign();
  const toast = useToast();

  async function handleSend() {
    try {
      const result = await createCampaign.mutateAsync({
        title,
        channel,
        template,
        audienceFilter: { verificationStatus: statusFilter || undefined },
        tournamentId: tournamentId || undefined,
      });
      toast.success(`Campaign queued for ${result.audienceSize} player(s).`);
      setTitle("");
      setTemplate("Hi {{name}}, ");
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <h2 className="mb-4 font-display font-semibold">New campaign</h2>
        <div className="flex flex-col gap-3">
          <Input label="Title" required value={title} onChange={(e) => setTitle(e.target.value)} />
          <Select
            label="Channel"
            value={channel}
            onChange={(e) => setChannel(e.target.value as MessageChannel)}
            options={[
              { value: "WHATSAPP", label: "WhatsApp" },
              { value: "SMS", label: "SMS" },
              { value: "EMAIL", label: "Email" },
            ]}
          />
          <Select
            label="Tournament (optional — restricts audience to its roster)"
            value={tournamentId}
            onChange={(e) => setTournamentId(e.target.value)}
            placeholder="All players"
            options={(tournaments ?? []).map((t) => ({ value: t.id, label: t.name }))}
          />
          <Select
            label="Verification status filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as VerificationStatus | "")}
            placeholder="Any status"
            options={[
              { value: "VERIFIED", label: "Verified" },
              { value: "PENDING_VERIFICATION", label: "Pending verification" },
            ]}
          />
          <div>
            <label className="text-sm font-medium">Message template</label>
            <textarea
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              rows={4}
              className="mt-1.5 w-full rounded-sm border border-border bg-surface p-3 text-sm focus-visible:border-primary"
              placeholder="Use {{name}} and {{playerId}} as placeholders"
            />
          </div>
          <Button disabled={!title || !template} loading={createCampaign.isPending} onClick={handleSend}>
            <Send className="h-4 w-4" /> Send campaign
          </Button>
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 font-display font-semibold">Campaign history</h2>
        {isLoading && <p className="text-sm text-text-secondary">Loading...</p>}
        <div className="flex flex-col gap-2">
          {campaigns?.map(({ campaign, stats }) => (
            <div key={campaign.id} className="rounded-sm border border-border p-3">
              <div className="flex items-center justify-between">
                <p className="font-medium">{campaign.title}</p>
                <StatusBadge status={campaign.channel} />
              </div>
              <p className="mt-1 text-xs text-text-secondary">
                Sent {stats.sent} · Failed {stats.failed} · Delivered {stats.delivered}
              </p>
            </div>
          ))}
          {!isLoading && campaigns?.length === 0 && <p className="text-sm text-text-secondary">No campaigns sent yet.</p>}
        </div>
      </Card>
    </div>
  );
}
