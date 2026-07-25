import clsx from "clsx";
import { CheckCircle2, Clock, XCircle, AlertTriangle, ScanLine } from "lucide-react";

type BadgeTone = "success" | "warning" | "danger" | "primary" | "neutral";

// success/warning/danger use the darker "-700" text variant on top of the
// same tint background — the base -500 color reads below 4.5:1 against its
// own bg/10 tint in light theme (see tokens.css). Text stays on the -500
// value for primary/neutral, which already clear AA.
const TONE_CLASSES: Record<BadgeTone, string> = {
  success: "bg-success/10 text-success-700",
  warning: "bg-warning/10 text-warning-700",
  danger: "bg-danger/10 text-danger-700",
  primary: "bg-primary/10 text-primary",
  neutral: "bg-text-secondary/10 text-text-secondary",
};

const TONE_ICON: Record<BadgeTone, typeof CheckCircle2> = {
  success: CheckCircle2,
  warning: Clock,
  danger: XCircle,
  primary: ScanLine,
  neutral: AlertTriangle,
};

export function Badge({ tone, children }: { tone: BadgeTone; children: string }) {
  const Icon = TONE_ICON[tone];
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
        TONE_CLASSES[tone],
      )}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {children}
    </span>
  );
}

const STATUS_TONE: Record<string, BadgeTone> = {
  VERIFIED: "success",
  CONFIRMED: "success",
  DELIVERED: "success",
  PENDING_VERIFICATION: "warning",
  PENDING_PAYMENT: "warning",
  CHANGES_REQUESTED: "warning",
  QUEUED: "warning",
  REJECTED: "danger",
  CANCELLED: "danger",
  FAILED: "danger",
  SUSPENDED: "danger",
  CHECKED_IN: "primary",
  SENT: "primary",
};

const STATUS_LABEL: Record<string, string> = {
  PENDING_VERIFICATION: "Pending",
  CHANGES_REQUESTED: "Changes requested",
  PENDING_PAYMENT: "Payment pending",
  CHECKED_IN: "Checked in",
};

/** Maps a domain status string (VerificationStatus | RegistrationStatus | MessageStatus | ...) straight to a themed Badge. */
export function StatusBadge({ status }: { status: string }) {
  return <Badge tone={STATUS_TONE[status] ?? "neutral"}>{STATUS_LABEL[status] ?? status.replace(/_/g, " ")}</Badge>;
}

const TIMEFRAME_TONE: Record<string, BadgeTone> = {
  ONGOING: "success",
  UPCOMING: "primary",
  PAST: "neutral",
};

const TIMEFRAME_LABEL: Record<string, string> = {
  ONGOING: "Ongoing",
  UPCOMING: "Upcoming",
  PAST: "Past",
};

/** Where a tournament sits relative to today — derived from its dates, distinct from its admin-set workflow status (StatusBadge). */
export function TimeframeBadge({ timeframe }: { timeframe: "UPCOMING" | "ONGOING" | "PAST" }) {
  return <Badge tone={TIMEFRAME_TONE[timeframe]}>{TIMEFRAME_LABEL[timeframe]}</Badge>;
}
