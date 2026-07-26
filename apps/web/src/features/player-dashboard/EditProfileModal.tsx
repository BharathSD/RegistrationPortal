import { useEffect, useMemo, useState } from "react";
import { User } from "lucide-react";
import {
  BATTING_STYLES,
  BOWLING_STYLES,
  GENDERS,
  JERSEY_SIZES,
  type Player,
  type PlayerSelfInput,
} from "@cricket-platform/shared";
import { Button, DatePicker, Modal, PhoneInput } from "../../design-system";
import { Input, Select } from "../../design-system/components/Field";
import { useToast } from "../../design-system/components/Toast";
import { useUpdateProfile, useUploadPhoto } from "../../lib/api/players";
import { ApiError } from "../../lib/api/client";

const MAX_PHOTO_SIZE_MB = 5;
const MAX_PHOTO_SIZE_BYTES = MAX_PHOTO_SIZE_MB * 1024 * 1024;

/** Everything but player type (admin-only) is the player's own — editable any time from the dashboard. Editing a VERIFIED profile sends it back for re-review (server-enforced), so identity fields stay trustworthy without blocking day-to-day edits like batting style or address. */
export function EditProfileModal({ player, onClose }: { player: Player; onClose: () => void }) {
  const updateProfile = useUpdateProfile();
  const uploadPhoto = useUploadPhoto();
  const toast = useToast();
  const [newPhoto, setNewPhoto] = useState<File | undefined>();
  const [photoError, setPhotoError] = useState<string | undefined>();
  const [form, setForm] = useState<Partial<PlayerSelfInput>>({
    fullName: player.fullName,
    dateOfBirth: player.dateOfBirth as unknown as Date,
    gender: player.gender,
    email: player.email ?? undefined,
    battingStyle: player.battingStyle ?? undefined,
    bowlingStyle: player.bowlingStyle ?? "NONE",
    addressLine1: player.addressLine1,
    addressLine2: player.addressLine2 ?? undefined,
    city: player.city,
    state: player.state,
    country: player.country,
    pincode: player.pincode,
    emergencyContactName: player.emergencyContactName ?? undefined,
    emergencyContactRelation: player.emergencyContactRelation ?? undefined,
    emergencyContactPhone: player.emergencyContactPhone ?? undefined,
    jerseySize: player.jerseySize,
    jerseyNumberPref1: player.jerseyNumberPref1 ?? undefined,
    jerseyNumberPref2: player.jerseyNumberPref2 ?? undefined,
    jerseyName: player.jerseyName ?? undefined,
  });

  function update<K extends keyof PlayerSelfInput>(key: K, value: PlayerSelfInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const newPhotoPreviewUrl = useMemo(() => (newPhoto ? URL.createObjectURL(newPhoto) : undefined), [newPhoto]);
  useEffect(() => {
    return () => {
      if (newPhotoPreviewUrl) URL.revokeObjectURL(newPhotoPreviewUrl);
    };
  }, [newPhotoPreviewUrl]);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_PHOTO_SIZE_BYTES) {
      setPhotoError(`That photo is ${(file.size / (1024 * 1024)).toFixed(1)}MB — please choose one under ${MAX_PHOTO_SIZE_MB}MB.`);
      e.target.value = "";
      return;
    }
    setPhotoError(undefined);
    setNewPhoto(file);
  }

  const canSave =
    form.fullName && form.dateOfBirth && form.gender && form.battingStyle &&
    form.addressLine1 && form.city && form.state && form.country && form.pincode && form.jerseySize;

  async function handleSave() {
    try {
      await updateProfile.mutateAsync(form);
      if (newPhoto) {
        await uploadPhoto.mutateAsync(newPhoto).catch(() => toast.error("Profile saved, but the new photo failed to upload — try again from here."));
      }
      toast.success(
        player.verificationStatus === "VERIFIED"
          ? "Profile updated — it's back with an admin for re-review since it was already verified."
          : "Profile updated.",
      );
      onClose();
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
    }
  }

  return (
    <Modal open onClose={onClose} closeOnBackdropClick={false} title="Edit profile">
      <div className="flex flex-col gap-4">
        {player.verificationStatus === "VERIFIED" && (
          <p className="rounded-sm border border-warning/30 bg-warning/5 p-3 text-xs text-warning">
            You're already verified — saving changes here sends your profile back for admin re-review. Your Player ID
            and card stay valid in the meantime.
          </p>
        )}

        <div>
          <p className="mb-2 text-sm font-semibold">Personal</p>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="edit-profile-photo-input" className="text-sm font-medium">
                Profile photo
              </label>
              <div className="flex items-center gap-3">
                {newPhotoPreviewUrl || player.photoUrl ? (
                  <img
                    src={newPhotoPreviewUrl ?? player.photoUrl ?? undefined}
                    alt=""
                    className="h-14 w-14 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-canvas text-text-secondary">
                    <User className="h-6 w-6" />
                  </div>
                )}
                <input
                  id="edit-profile-photo-input"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handlePhotoChange}
                  aria-invalid={Boolean(photoError)}
                  className="text-sm text-text-secondary file:mr-3 file:rounded-sm file:border-0 file:bg-primary/10 file:px-3 file:py-2 file:text-primary"
                />
              </div>
              <p className="text-xs text-text-secondary">JPG, PNG, or WebP. Max {MAX_PHOTO_SIZE_MB}MB.</p>
              {photoError && (
                <p role="alert" className="text-xs text-danger">
                  {photoError}
                </p>
              )}
            </div>
            <Input label="Full name" required value={form.fullName ?? ""} onChange={(e) => update("fullName", e.target.value)} />
            <DatePicker
              label="Date of birth"
              required
              max={new Date().toISOString().slice(0, 10)}
              value={form.dateOfBirth ? String(form.dateOfBirth).slice(0, 10) : ""}
              onChange={(v) => update("dateOfBirth", v as unknown as Date)}
            />
            <Select
              label="Gender"
              required
              placeholder="Select gender"
              value={form.gender ?? ""}
              onChange={(e) => update("gender", e.target.value as PlayerSelfInput["gender"])}
              options={GENDERS.map((g) => ({ value: g, label: g.replace(/_/g, " ") }))}
            />
            <Input label="Email" type="email" value={form.email ?? ""} onChange={(e) => update("email", e.target.value)} />
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold">Cricket profile</p>
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Batting style"
              required
              placeholder="Select style"
              value={form.battingStyle ?? ""}
              onChange={(e) => update("battingStyle", e.target.value as PlayerSelfInput["battingStyle"])}
              options={BATTING_STYLES.map((s) => ({ value: s, label: s.replace("_", "-") }))}
            />
            <Select
              label="Bowling style"
              value={form.bowlingStyle ?? "NONE"}
              onChange={(e) => update("bowlingStyle", e.target.value as PlayerSelfInput["bowlingStyle"])}
              options={BOWLING_STYLES.map((s) => ({ value: s, label: s.replace(/_/g, " ") }))}
            />
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold">Address</p>
          <div className="flex flex-col gap-3">
            <Input label="Address line 1" required value={form.addressLine1 ?? ""} onChange={(e) => update("addressLine1", e.target.value)} />
            <Input label="Address line 2" value={form.addressLine2 ?? ""} onChange={(e) => update("addressLine2", e.target.value)} />
            <div className="grid grid-cols-2 gap-3">
              <Input label="City" required value={form.city ?? ""} onChange={(e) => update("city", e.target.value)} />
              <Input label="State" required value={form.state ?? ""} onChange={(e) => update("state", e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Country" required value={form.country ?? ""} onChange={(e) => update("country", e.target.value)} />
              <Input label="Pincode" required value={form.pincode ?? ""} onChange={(e) => update("pincode", e.target.value)} />
            </div>
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold">Emergency contact (optional)</p>
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <Input label="Contact name" value={form.emergencyContactName ?? ""} onChange={(e) => update("emergencyContactName", e.target.value)} />
              <Input label="Relationship" value={form.emergencyContactRelation ?? ""} onChange={(e) => update("emergencyContactRelation", e.target.value)} />
            </div>
            <PhoneInput label="Contact phone" value={form.emergencyContactPhone ?? ""} onChange={(v) => update("emergencyContactPhone", v)} />
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold">Jersey</p>
          <div className="flex flex-col gap-3">
            <Select
              label="Jersey size"
              required
              placeholder="Select size"
              value={form.jerseySize ?? ""}
              onChange={(e) => update("jerseySize", e.target.value as PlayerSelfInput["jerseySize"])}
              options={JERSEY_SIZES.map((s) => ({ value: s, label: s }))}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Preferred number" value={form.jerseyNumberPref1 ?? ""} onChange={(e) => update("jerseyNumberPref1", e.target.value)} />
              <Input label="Name on jersey" value={form.jerseyName ?? ""} onChange={(e) => update("jerseyName", e.target.value)} />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={updateProfile.isPending || uploadPhoto.isPending}>
            Cancel
          </Button>
          <Button disabled={!canSave} loading={updateProfile.isPending || uploadPhoto.isPending} onClick={handleSave}>
            Save changes
          </Button>
        </div>
      </div>
    </Modal>
  );
}
