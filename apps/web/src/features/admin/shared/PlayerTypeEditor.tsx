import { useState } from "react";
import { Button } from "../../../design-system";
import { Select } from "../../../design-system/components/Field";
import { useToast } from "../../../design-system/components/Toast";
import { useAssignCricketProfile } from "../../../lib/api/admin";
import { ApiError } from "../../../lib/api/client";
import { CRICKET_ROLES, type AssignCricketProfileInput, type Player } from "@cricket-platform/shared";

/**
 * A player never sets their own player type — an admin assigns it here
 * while reviewing them, since it's a judgment call, not a self-reported
 * fact. Everything else about how they play (batting/bowling style,
 * position, experience) is the player's own, set at registration and
 * editable from their dashboard — this is the only field an admin can
 * touch. Reused from the Verification Queue and Player Search.
 */
export function PlayerTypeEditor({ player }: { player: Player }) {
  const assignCricketProfile = useAssignCricketProfile();
  const toast = useToast();
  const [cricketRole, setCricketRole] = useState<AssignCricketProfileInput["cricketRole"] | "">(
    player.cricketRole ?? "",
  );

  async function handleSave() {
    if (!cricketRole) return;
    try {
      await assignCricketProfile.mutateAsync({ playerId: player.id, input: { cricketRole } });
      toast.success("Player type updated.");
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
    }
  }

  return (
    <div className="rounded-sm border border-border p-3">
      <p className="mb-3 text-sm font-semibold">
        Player Type <span className="font-normal text-text-secondary">(assigned by admin, not the player)</span>
      </p>
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <Select
            label="Player Type"
            placeholder="Select player type"
            value={cricketRole}
            onChange={(e) => setCricketRole(e.target.value as AssignCricketProfileInput["cricketRole"])}
            options={CRICKET_ROLES.map((r) => ({ value: r, label: r.replace("_", " ") }))}
          />
        </div>
        <Button
          size="sm"
          disabled={!cricketRole || cricketRole === player.cricketRole}
          loading={assignCricketProfile.isPending}
          onClick={handleSave}
        >
          Save
        </Button>
      </div>
    </div>
  );
}
