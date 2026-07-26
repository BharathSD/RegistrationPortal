import { useState } from "react";
import {
  BATTING_STYLES,
  BOWLING_STYLES,
  GENDERS,
  JERSEY_SIZES,
  type AdminCreatePlayerInput,
} from "@cricket-platform/shared";
import { Button, Modal, RadioCardGroup } from "../../../design-system";
import { Input, Select } from "../../../design-system/components/Field";
import { useToast } from "../../../design-system/components/Toast";
import { useAdminCreatePlayer } from "../../../lib/api/admin";
import { ApiError } from "../../../lib/api/client";

type FormState = Partial<AdminCreatePlayerInput>;

/** Optional text fields are stored as "" while the form is filled out; the API rejects an empty string against a min-length/regex rule, so blank optional fields are dropped from the payload entirely rather than sent as "". */
function stripEmptyStrings<T extends object>(obj: T): T {
  const result = { ...obj };
  for (const key of Object.keys(result) as Array<keyof T>) {
    if (result[key] === "") delete result[key];
  }
  return result;
}

/**
 * Lets an admin create a player profile directly, for players who can't
 * complete self-service registration on their own (no smartphone,
 * unfamiliar with the OTP flow, assisted in person at a registration desk).
 * Same required fields as the self-registration wizard minus the OTP step
 * and photo — the profile lands in the normal verification queue exactly
 * like a self-registered one, so an admin still assigns a player type and
 * approves it from there. The player (or whoever holds that mobile number)
 * can also log in later via OTP to fill in anything left blank.
 */
export function AddPlayerModal({ onClose }: { onClose: () => void }) {
  const [data, setData] = useState<FormState>({ country: "India", bowlingStyle: "NONE" });
  const createPlayer = useAdminCreatePlayer();
  const toast = useToast();

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setData((prev) => ({ ...prev, [key]: value }));
  }

  const canSubmit =
    data.mobile &&
    data.fullName &&
    data.dateOfBirth &&
    data.gender &&
    data.battingStyle &&
    data.addressLine1 &&
    data.city &&
    data.state &&
    data.country &&
    data.pincode &&
    data.jerseySize;

  async function handleSubmit() {
    if (!canSubmit) return;
    try {
      const player = await createPlayer.mutateAsync(stripEmptyStrings(data) as AdminCreatePlayerInput);
      toast.success(`${player.fullName} added — now pending verification.`);
      onClose();
    } catch (err) {
      if (err instanceof ApiError) {
        const detail = err.details?.[0];
        toast.error(detail ? `${detail.path}: ${detail.message}` : err.message);
      }
    }
  }

  return (
    <Modal open onClose={onClose} title="Add player" closeOnBackdropClick={false}>
      <div className="flex flex-col gap-4">
        <p className="-mt-2 text-xs text-text-secondary">
          For players who can't complete registration themselves. This creates a profile pending verification, same
          as a self-registered one — assign a player type and approve it from the Verification Queue once it's ready.
        </p>

        <Input
          label="Mobile"
          required
          type="tel"
          placeholder="+919876543210"
          value={data.mobile ?? ""}
          onChange={(e) => update("mobile", e.target.value)}
        />
        <Input label="Full name" required value={data.fullName ?? ""} onChange={(e) => update("fullName", e.target.value)} />
        <Input
          label="Date of birth"
          required
          type="date"
          value={data.dateOfBirth ? String(data.dateOfBirth).slice(0, 10) : ""}
          onChange={(e) => update("dateOfBirth", e.target.value as unknown as Date)}
        />
        <Select
          label="Gender"
          required
          placeholder="Select gender"
          value={data.gender ?? ""}
          onChange={(e) => update("gender", e.target.value as AdminCreatePlayerInput["gender"])}
          options={GENDERS.map((g) => ({ value: g, label: g.replace(/_/g, " ") }))}
        />
        <Input label="Email (optional)" type="email" value={data.email ?? ""} onChange={(e) => update("email", e.target.value)} />

        <Input
          label="Address line 1"
          required
          value={data.addressLine1 ?? ""}
          onChange={(e) => update("addressLine1", e.target.value)}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input label="City" required value={data.city ?? ""} onChange={(e) => update("city", e.target.value)} />
          <Input label="State" required value={data.state ?? ""} onChange={(e) => update("state", e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Country" required value={data.country ?? ""} onChange={(e) => update("country", e.target.value)} />
          <Input label="Pincode" required value={data.pincode ?? ""} onChange={(e) => update("pincode", e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Emergency contact (optional)"
            value={data.emergencyContactName ?? ""}
            onChange={(e) => update("emergencyContactName", e.target.value)}
          />
          <Input
            label="Contact phone"
            type="tel"
            value={data.emergencyContactPhone ?? ""}
            onChange={(e) => update("emergencyContactPhone", e.target.value)}
          />
        </div>

        <Select
          label="Jersey size"
          required
          placeholder="Select size"
          value={data.jerseySize ?? ""}
          onChange={(e) => update("jerseySize", e.target.value as AdminCreatePlayerInput["jerseySize"])}
          options={JERSEY_SIZES.map((s) => ({ value: s, label: s }))}
        />

        <RadioCardGroup
          label="Batting style"
          value={data.battingStyle ?? ""}
          onChange={(v) => update("battingStyle", v as AdminCreatePlayerInput["battingStyle"])}
          options={BATTING_STYLES.map((s) => ({ value: s, label: s.replace("_", "-") }))}
          columns={2}
        />
        <RadioCardGroup
          label="Bowling style"
          value={data.bowlingStyle ?? "NONE"}
          onChange={(v) => update("bowlingStyle", v as AdminCreatePlayerInput["bowlingStyle"])}
          options={BOWLING_STYLES.map((s) => ({ value: s, label: s.replace(/_/g, " ") }))}
          columns={2}
        />

        <div className="mt-2 flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={createPlayer.isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={createPlayer.isPending} disabled={!canSubmit}>
            Add player
          </Button>
        </div>
      </div>
    </Modal>
  );
}
