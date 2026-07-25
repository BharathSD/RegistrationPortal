import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BATTING_STYLES,
  BOWLING_STYLES,
  GENDERS,
  JERSEY_SIZES,
  type PlayerProfileInput,
} from "@cricket-platform/shared";
import { Button, Card, Checkbox, RadioCardGroup, Stepper } from "../../design-system";
import { Input, Select } from "../../design-system/components/Field";
import { OtpGate } from "../auth-otp/OtpGate";
import { useRegisterPlayer, useUploadPhoto } from "../../lib/api/players";
import { useAuthStore } from "../../lib/hooks/useAuthStore";
import { useToast } from "../../design-system/components/Toast";
import { ApiError } from "../../lib/api/client";
import { TermsAndConditionsModal } from "./TermsAndConditionsModal";

const STEPS = ["Verify mobile", "Personal", "Address", "Emergency contact", "Jersey", "Cricket profile", "Review"];

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

// A closed tab, an incoming call, a flaky mobile connection mid-registration
// — none of these should cost a player their 6 filled-in steps. Persisted
// to sessionStorage (not localStorage: this is in-progress scratch data,
// not something that should survive to a different day/device) on every
// field/step change, restored on mount, and cleared on successful submit or
// an explicit "Start over". `photo` is a File and can't be JSON-serialized,
// so it's the one field dropped before persisting — the player just re-picks
// it if they come back mid-flow.
const WIZARD_STORAGE_KEY = "playerRegistrationWizard:v1";

interface PersistedWizardState {
  stepIndex: number;
  mobile: string;
  data: Omit<WizardData, "photo">;
}

function loadPersistedState(): PersistedWizardState | null {
  try {
    const raw = sessionStorage.getItem(WIZARD_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedWizardState;
    if (typeof parsed.stepIndex !== "number" || !parsed.data) return null;
    return parsed;
  } catch {
    return null;
  }
}

function savePersistedState(state: PersistedWizardState) {
  try {
    sessionStorage.setItem(WIZARD_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Persistence is a convenience, not a requirement — private browsing /
    // storage-full shouldn't break the wizard itself.
  }
}

function clearPersistedState() {
  try {
    sessionStorage.removeItem(WIZARD_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function PlayerRegistrationWizard() {
  const [stepIndex, setStepIndex] = useState(() => loadPersistedState()?.stepIndex ?? 0);
  const [mobile, setMobile] = useState(() => loadPersistedState()?.mobile ?? "");
  // country defaults to "India" — must be real initial state, not just a
  // display fallback on the input, or it never makes it into the submitted
  // payload when the user doesn't touch the field (required by the schema).
  const [data, setData] = useState<WizardData>(() => loadPersistedState()?.data ?? { country: "India" });
  const [restored, setRestored] = useState(() => Boolean(loadPersistedState()));
  const navigate = useNavigate();
  const toast = useToast();
  const setTokens = useAuthStore((s) => s.setTokens);
  const setSession = useAuthStore((s) => s.setSession);

  const registerPlayer = useRegisterPlayer();
  const uploadPhoto = useUploadPhoto();

  const stepRegionRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);

  // Persist on every field/step change (skipping the un-serializable File).
  useEffect(() => {
    if (stepIndex === 0) return; // pre-OTP: nothing worth restoring yet
    const { photo: _photo, ...rest } = data;
    savePersistedState({ stepIndex, mobile, data: rest });
  }, [stepIndex, mobile, data]);

  // Scroll to top and move focus to the new step's heading on every step
  // change, and announce it for screen-reader users — otherwise a step
  // transition is silent and the new content can render off-screen.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
    const heading = stepRegionRef.current?.querySelector<HTMLElement>("h1, h2");
    if (heading) {
      heading.setAttribute("tabindex", "-1");
      heading.focus();
    }
  }, [stepIndex]);

  const stepAnnouncement = `Step ${stepIndex + 1} of ${STEPS.length}: ${STEPS[stepIndex]}`;

  function update<K extends keyof WizardData>(key: K, value: WizardData[K]) {
    setData((prev) => ({ ...prev, [key]: value }));
  }

  function handleStartOver() {
    clearPersistedState();
    setData({ country: "India" });
    setMobile("");
    setStepIndex(0);
    setRestored(false);
  }

  async function handleSubmit() {
    if (!data.photo) {
      toast.error("A profile photo is required — go back to the Personal step to add one.");
      return;
    }
    try {
      const { photo, termsAccepted: _termsAccepted, ...profile } = data;
      const result = await registerPlayer.mutateAsync(stripEmptyStrings(profile) as PlayerProfileInput);
      setTokens(result.accessToken);
      setSession({ type: "PLAYER", profile: { id: result.id, playerId: result.playerId, fullName: result.fullName, verificationStatus: result.verificationStatus } });

      await uploadPhoto.mutateAsync(photo).catch(() => toast.error("Photo upload failed — you can retry from your dashboard."));

      clearPersistedState();
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

  return (
    <>
      <div aria-live="polite" role="status" className="sr-only">
        {stepAnnouncement}
      </div>

      {stepIndex === 0 ? (
        <div ref={stepRegionRef} className="mx-auto max-w-md px-4 py-12">
          <OtpGate
            purpose="REGISTRATION"
            title="Let's get you registered"
            subtitle="Verify your mobile number to begin — this becomes your permanent player identity."
            onVerified={(result, verifiedMobile) => {
              setTokens(result.accessToken);
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
      ) : (
        <div ref={stepRegionRef} className="mx-auto max-w-xl px-4 py-8">
          <div className="mb-6">
            <Stepper steps={STEPS} currentIndex={stepIndex} />
          </div>

          {restored && (
            <div className="mb-4 flex items-center justify-between gap-3 rounded-sm border border-primary/30 bg-primary/5 px-3 py-2 text-xs text-text-secondary">
              <span>We picked up where you left off.</span>
              <button type="button" onClick={handleStartOver} className="font-medium text-primary underline">
                Start over
              </button>
            </div>
          )}

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
            <StepCricketProfile data={data} update={update} onNext={() => setStepIndex(6)} onBack={() => setStepIndex(4)} />
          )}
          {stepIndex === 6 && (
            <StepReview
              data={data}
              update={update}
              mobile={mobile}
              submitting={registerPlayer.isPending || uploadPhoto.isPending}
              onSubmit={handleSubmit}
              onBack={() => setStepIndex(5)}
            />
          )}
        </div>
      )}
    </>
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
        <label htmlFor="wizard-photo-input" className="text-sm font-medium">
          Profile photo <span className="text-danger">*</span>
        </label>
        <div className="flex items-center gap-3">
          {photoPreviewUrl && <img src={photoPreviewUrl} alt="" className="h-14 w-14 shrink-0 rounded-full object-cover" />}
          <input
            id="wizard-photo-input"
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

function StepCricketProfile({ data, update, onNext, onBack }: StepProps) {
  const canContinue = data.battingStyle;
  return (
    <Card className="flex flex-col gap-4">
      <h2 className="font-display text-lg font-semibold">Cricket profile</h2>
      <p className="-mt-2 text-xs text-text-secondary">
        Tell us how you play. Your player type (e.g. Super Striker, All-Rounder) is assigned separately by an admin —
        this is just about your style.
      </p>
      <RadioCardGroup
        label="Batting style"
        value={data.battingStyle ?? ""}
        onChange={(v) => update("battingStyle", v as PlayerProfileInput["battingStyle"])}
        options={BATTING_STYLES.map((s) => ({ value: s, label: s.replace("_", "-") }))}
        columns={2}
      />
      <RadioCardGroup
        label="Bowling style"
        value={data.bowlingStyle ?? "NONE"}
        onChange={(v) => update("bowlingStyle", v as PlayerProfileInput["bowlingStyle"])}
        options={BOWLING_STYLES.map((s) => ({ value: s, label: s.replace(/_/g, " ") }))}
        columns={2}
      />
      <NavButtons onBack={onBack} onNext={onNext} nextDisabled={!canContinue} />
      {!canContinue && <p className="text-xs text-text-secondary">Select a batting style to continue.</p>}
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
        <dt className="text-text-secondary">Batting / bowling</dt>
        <dd>
          {data.battingStyle?.replace("_", "-")} · {(data.bowlingStyle ?? "NONE").replace(/_/g, " ")}
        </dd>
      </dl>

      <div className="rounded-sm border border-border bg-canvas p-3 text-sm">
        <p className="font-medium text-text-primary">What happens next</p>
        <ul className="mt-1.5 list-disc space-y-1 pl-4 text-xs text-text-secondary">
          <li>An admin reviews your profile — this usually takes a day or two.</li>
          <li>An admin assigns your player type (e.g. Super Striker, All-Rounder); everything else here is yours to edit anytime from your dashboard.</li>
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
