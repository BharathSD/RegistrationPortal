import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GENDERS, JERSEY_SIZES, type PlayerProfileInput } from "@cricket-platform/shared";
import { Button, Card, Checkbox, Stepper } from "../../design-system";
import { Input, Select } from "../../design-system/components/Field";
import { OtpGate } from "../auth-otp/OtpGate";
import { useRegisterPlayer, useUploadPhoto } from "../../lib/api/players";
import { useAuthStore } from "../../lib/hooks/useAuthStore";
import { useToast } from "../../design-system/components/Toast";
import { ApiError } from "../../lib/api/client";
import { TermsAndConditionsModal } from "./TermsAndConditionsModal";

const STEPS = ["Verify mobile", "Personal", "Address", "Emergency contact", "Jersey", "Review"];

const MAX_PHOTO_SIZE_MB = 5;
const MAX_PHOTO_SIZE_BYTES = MAX_PHOTO_SIZE_MB * 1024 * 1024;

type WizardData = Partial<PlayerProfileInput> & { photo?: File; termsAccepted?: boolean };

/** Optional text fields are stored as "" while the form is filled out; the API rejects an empty string against a min-length/regex rule, so blank optional fields are dropped from the payload entirely rather than sent as "". */
function stripEmptyStrings<T extends object>(obj: T): T {
  const result = { ...obj };
  for (const key of Object.keys(result) as Array<keyof T>) {
    if (result[key] === "") delete result[key];
  }
  return result;
}

export function PlayerRegistrationWizard() {
  const [stepIndex, setStepIndex] = useState(0);
  const [mobile, setMobile] = useState("");
  // country defaults to "India" — must be real initial state, not just a
  // display fallback on the input, or it never makes it into the submitted
  // payload when the user doesn't touch the field (required by the schema).
  const [data, setData] = useState<WizardData>({ country: "India" });
  const navigate = useNavigate();
  const toast = useToast();
  const setTokens = useAuthStore((s) => s.setTokens);
  const setSession = useAuthStore((s) => s.setSession);

  const registerPlayer = useRegisterPlayer();
  const uploadPhoto = useUploadPhoto();

  function update<K extends keyof WizardData>(key: K, value: WizardData[K]) {
    setData((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit() {
    if (!data.photo) {
      toast.error("A profile photo is required — go back to the Personal step to add one.");
      return;
    }
    try {
      const { photo, termsAccepted: _termsAccepted, ...profile } = data;
      const result = await registerPlayer.mutateAsync(stripEmptyStrings(profile) as PlayerProfileInput);
      setTokens(result.accessToken, result.refreshToken);
      setSession({ type: "PLAYER", profile: { id: result.id, playerId: result.playerId, fullName: result.fullName, verificationStatus: result.verificationStatus } });

      await uploadPhoto.mutateAsync(photo).catch(() => toast.error("Photo upload failed — you can retry from your dashboard."));

      toast.success("Registration submitted! An admin will review your profile shortly.");
      navigate("/dashboard");
    } catch (err) {
      if (err instanceof ApiError) {
        // A step's Continue button should already prevent this, but if
        // validation ever slips through (e.g. a future regression), show
        // exactly which field the server rejected instead of a bare
        // "Request validation failed" that gives no way to act on it.
        const detail = err.details?.[0];
        toast.error(detail ? `${detail.path}: ${detail.message}` : err.message);
      }
    }
  }

  if (stepIndex === 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-12">
        <OtpGate
          purpose="REGISTRATION"
          title="Let's get you registered"
          subtitle="Verify your mobile number to begin — this becomes your permanent player identity."
          onVerified={(result, verifiedMobile) => {
            setTokens(result.accessToken, result.refreshToken);
            if (result.isNewPlayer) {
              setMobile(verifiedMobile);
              setStepIndex(1);
            } else {
              setSession({ type: "PLAYER", profile: result.player });
              toast.info("You're already registered — taking you to your dashboard.");
              navigate("/dashboard");
            }
          }}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <div className="mb-6">
        <Stepper steps={STEPS} currentIndex={stepIndex} />
      </div>

      {stepIndex === 1 && (
        <StepPersonal data={data} update={update} onNext={() => setStepIndex(2)} onBack={() => setStepIndex(0)} />
      )}
      {stepIndex === 2 && (
        <StepAddress data={data} update={update} onNext={() => setStepIndex(3)} onBack={() => setStepIndex(1)} />
      )}
      {stepIndex === 3 && (
        <StepEmergencyContact data={data} update={update} onNext={() => setStepIndex(4)} onBack={() => setStepIndex(2)} />
      )}
      {stepIndex === 4 && (
        <StepJersey data={data} update={update} onNext={() => setStepIndex(5)} onBack={() => setStepIndex(3)} />
      )}
      {stepIndex === 5 && (
        <StepReview
          data={data}
          update={update}
          mobile={mobile}
          submitting={registerPlayer.isPending || uploadPhoto.isPending}
          onSubmit={handleSubmit}
          onBack={() => setStepIndex(4)}
        />
      )}
    </div>
  );
}

function NavButtons({
  onBack,
  onNext,
  nextDisabled,
  nextLabel = "Continue",
}: {
  onBack: () => void;
  onNext: () => void;
  nextDisabled?: boolean;
  nextLabel?: string;
}) {
  return (
    <div className="mt-6 flex justify-between gap-3">
      <Button variant="secondary" onClick={onBack}>
        Back
      </Button>
      <Button onClick={onNext} disabled={nextDisabled}>
        {nextLabel} →
      </Button>
    </div>
  );
}

type StepProps = {
  data: WizardData;
  update: <K extends keyof WizardData>(k: K, v: WizardData[K]) => void;
  onNext: () => void;
  onBack: () => void;
};

function StepPersonal({ data, update, onNext, onBack }: StepProps) {
  const [photoError, setPhotoError] = useState<string | undefined>();
  const canContinue = data.fullName && data.dateOfBirth && data.gender && data.photo;

  // Recreating an object URL on every keystroke (this component re-renders
  // on every field change) would leak one blob URL per render — only derive
  // a new one when the selected file actually changes, and revoke it after.
  const photoPreviewUrl = useMemo(() => (data.photo ? URL.createObjectURL(data.photo) : undefined), [data.photo]);
  useEffect(() => {
    return () => {
      if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
    };
  }, [photoPreviewUrl]);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_PHOTO_SIZE_BYTES) {
      setPhotoError(`That photo is ${(file.size / (1024 * 1024)).toFixed(1)}MB — please choose one under ${MAX_PHOTO_SIZE_MB}MB.`);
      update("photo", undefined);
      e.target.value = "";
      return;
    }
    setPhotoError(undefined);
    update("photo", file);
  }

  return (
    <Card className="flex flex-col gap-4">
      <h2 className="font-display text-lg font-semibold">Personal information</h2>
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
        onChange={(e) => update("gender", e.target.value as PlayerProfileInput["gender"])}
        options={GENDERS.map((g) => ({ value: g, label: g.replace(/_/g, " ") }))}
      />
      <Input label="Email (optional)" type="email" value={data.email ?? ""} onChange={(e) => update("email", e.target.value)} />
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">
          Profile photo <span className="text-danger">*</span>
        </label>
        <div className="flex items-center gap-3">
          {photoPreviewUrl && <img src={photoPreviewUrl} alt="" className="h-14 w-14 shrink-0 rounded-full object-cover" />}
          <input
            type="file"
            required
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
      <NavButtons onBack={onBack} onNext={onNext} nextDisabled={!canContinue} />
      {!canContinue && <p className="text-xs text-text-secondary">Fill in name, date of birth, gender, and a profile photo to continue.</p>}
    </Card>
  );
}

function StepAddress({ data, update, onNext, onBack }: StepProps) {
  const canContinue = data.addressLine1 && data.city && data.state && data.country && data.pincode;
  return (
    <Card className="flex flex-col gap-4">
      <h2 className="font-display text-lg font-semibold">Address</h2>
      <Input
        label="Address line 1"
        required
        placeholder="House/flat no., street, area"
        value={data.addressLine1 ?? ""}
        onChange={(e) => update("addressLine1", e.target.value)}
      />
      <Input
        label="Address line 2 (optional)"
        placeholder="Landmark, apartment, etc."
        value={data.addressLine2 ?? ""}
        onChange={(e) => update("addressLine2", e.target.value)}
      />
      <div className="grid grid-cols-2 gap-3">
        <Input label="City" required value={data.city ?? ""} onChange={(e) => update("city", e.target.value)} />
        <Input label="State" required value={data.state ?? ""} onChange={(e) => update("state", e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Country" required value={data.country ?? ""} onChange={(e) => update("country", e.target.value)} />
        <Input label="Pincode" required value={data.pincode ?? ""} onChange={(e) => update("pincode", e.target.value)} />
      </div>
      <NavButtons onBack={onBack} onNext={onNext} nextDisabled={!canContinue} />
      {!canContinue && <p className="text-xs text-text-secondary">Fill in address line 1, city, state, country, and pincode to continue.</p>}
    </Card>
  );
}

function StepEmergencyContact({ data, update, onNext, onBack }: StepProps) {
  return (
    <Card className="flex flex-col gap-4">
      <h2 className="font-display text-lg font-semibold">Emergency contact</h2>
      <p className="-mt-2 text-xs text-text-secondary">Optional — add this now, or later from your dashboard.</p>
      <Input label="Contact name" value={data.emergencyContactName ?? ""} onChange={(e) => update("emergencyContactName", e.target.value)} />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Relationship" value={data.emergencyContactRelation ?? ""} onChange={(e) => update("emergencyContactRelation", e.target.value)} />
        <Input label="Contact phone" type="tel" value={data.emergencyContactPhone ?? ""} onChange={(e) => update("emergencyContactPhone", e.target.value)} />
      </div>
      <NavButtons onBack={onBack} onNext={onNext} />
    </Card>
  );
}

function StepJersey({ data, update, onNext, onBack }: StepProps) {
  const canContinue = data.jerseySize;
  return (
    <Card className="flex flex-col gap-4">
      <h2 className="font-display text-lg font-semibold">Jersey details</h2>
      <Select
        label="Jersey size"
        required
        placeholder="Select size"
        value={data.jerseySize ?? ""}
        onChange={(e) => update("jerseySize", e.target.value as PlayerProfileInput["jerseySize"])}
        options={JERSEY_SIZES.map((s) => ({ value: s, label: s }))}
      />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Preferred number" value={data.jerseyNumberPref1 ?? ""} onChange={(e) => update("jerseyNumberPref1", e.target.value)} />
        <Input label="Name on jersey" value={data.jerseyName ?? ""} onChange={(e) => update("jerseyName", e.target.value)} />
      </div>
      <NavButtons onBack={onBack} onNext={onNext} nextDisabled={!canContinue} />
      {!canContinue && <p className="text-xs text-text-secondary">Select a jersey size to continue.</p>}
    </Card>
  );
}

function StepReview({
  data,
  update,
  mobile,
  submitting,
  onSubmit,
  onBack,
}: {
  data: WizardData;
  update: <K extends keyof WizardData>(k: K, v: WizardData[K]) => void;
  mobile: string;
  submitting: boolean;
  onSubmit: () => void;
  onBack: () => void;
}) {
  const [showTerms, setShowTerms] = useState(false);
  const photoPreviewUrl = useMemo(() => (data.photo ? URL.createObjectURL(data.photo) : undefined), [data.photo]);
  useEffect(() => {
    return () => {
      if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
    };
  }, [photoPreviewUrl]);

  return (
    <Card className="flex flex-col gap-4">
      <h2 className="font-display text-lg font-semibold">Review &amp; submit</h2>
      {photoPreviewUrl && (
        <img src={photoPreviewUrl} alt="Your profile photo" className="h-20 w-20 self-center rounded-full object-cover" />
      )}
      <dl className="grid grid-cols-2 gap-y-2 text-sm">
        <dt className="text-text-secondary">Mobile</dt>
        <dd>{mobile}</dd>
        <dt className="text-text-secondary">Name</dt>
        <dd>{data.fullName}</dd>
        <dt className="text-text-secondary">Address</dt>
        <dd>
          {data.addressLine1}
          {data.addressLine2 ? `, ${data.addressLine2}` : ""}, {data.city}, {data.state} — {data.pincode}
        </dd>
        <dt className="text-text-secondary">Emergency contact</dt>
        <dd>{data.emergencyContactName ? `${data.emergencyContactName} (${data.emergencyContactRelation})` : "Not provided"}</dd>
        <dt className="text-text-secondary">Jersey</dt>
        <dd>
          {data.jerseySize} · #{data.jerseyNumberPref1 || "—"}
        </dd>
      </dl>

      <div className="rounded-sm border border-border bg-canvas p-3 text-sm">
        <p className="font-medium text-text-primary">What happens next</p>
        <ul className="mt-1.5 list-disc space-y-1 pl-4 text-xs text-text-secondary">
          <li>An admin reviews your profile — this usually takes a day or two.</li>
          <li>Your cricket role, batting/bowling style, and experience level are assigned by the admin, not by you.</li>
          <li>Once approved, you'll get a WhatsApp confirmation with your permanent Player ID and digital player card.</li>
        </ul>
      </div>

      <Checkbox
        checked={Boolean(data.termsAccepted)}
        onChange={(checked) => update("termsAccepted", checked)}
        label={
          <>
            I have read and agree to the{" "}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setShowTerms(true);
              }}
              className="font-medium text-primary underline"
            >
              Terms &amp; Conditions
            </button>
          </>
        }
      />

      <div className="flex justify-between gap-3">
        <Button variant="secondary" onClick={onBack} disabled={submitting}>
          Back
        </Button>
        <Button onClick={onSubmit} loading={submitting} disabled={!data.termsAccepted}>
          Submit
        </Button>
      </div>

      {showTerms && <TermsAndConditionsModal onClose={() => setShowTerms(false)} />}
    </Card>
  );
}
