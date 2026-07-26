import type {
  PlayerType,
  BattingStyle,
  BowlingStyle,
  ExperienceLevel,
  Gender,
  JerseySize,
  VerificationStatus,
  RegistrationStatus,
  TournamentStatus,
  AdminRole,
} from "../constants/enums";

export interface MedicalInfo {
  bloodGroup?: string | null;
  allergies?: string | null;
  conditions?: string | null;
  medication?: string | null;
}

export interface PlayerSummary {
  id: string;
  playerId: string | null;
  fullName: string;
  verificationStatus: VerificationStatus;
}

export interface Player {
  id: string;
  playerId: string | null;
  mobile: string;
  fullName: string;
  dateOfBirth: string;
  gender: Gender;
  email?: string | null;
  photoUrl?: string | null;

  // Assigned by an admin after reviewing the player, not set by the player
  // at registration — null until assigned (see assignCricketProfileSchema).
  playerType: PlayerType | null;
  battingStyle: BattingStyle | null;
  bowlingStyle: BowlingStyle | null;
  preferredBattingPosition: number | null;
  experienceLevel: ExperienceLevel | null;

  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  country: string;
  pincode: string;

  // Optional — a player may not have this on hand at registration time.
  emergencyContactName?: string | null;
  emergencyContactRelation?: string | null;
  emergencyContactPhone?: string | null;

  jerseySize: JerseySize;
  jerseyNumberPref1?: string | null;
  jerseyNumberPref2?: string | null;
  jerseyName?: string | null;

  medicalInfo?: MedicalInfo | null;

  verificationStatus: VerificationStatus;
  rejectionReason?: string | null;
  changeRequestNote?: string | null;
  verifiedAt?: string | null;

  createdAt: string;
  updatedAt: string;
}

export interface Tournament {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  venue: string;
  startDate: string;
  endDate: string;
  registrationOpenAt: string;
  registrationCloseAt: string;
  maxParticipants?: number | null;
  entryFee: number;
  feeRequired: boolean;
  rulesMarkdown?: string | null;
  status: TournamentStatus;
  createdAt: string;
}

export interface Registration {
  id: string;
  playerId: string;
  tournamentId: string;
  status: RegistrationStatus;
  rulesAccepted: boolean;
  rulesAcceptedAt?: string | null;
  qrToken: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  role: AdminRole;
  isActive: boolean;
}

export interface PaginatedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: Array<{ path: string; message: string }>;
  };
}
