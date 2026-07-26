import type { Player as PrismaPlayerModel, MedicalInfo as PrismaMedicalInfo } from "@prisma/client";
import type { PlayerWithMedical } from "../../domain/entities";

export function toDomainPlayer(
  p: PrismaPlayerModel & { medicalInfo?: PrismaMedicalInfo | null },
): PlayerWithMedical {
  return {
    id: p.id,
    playerId: p.playerId,
    mobile: p.mobile,
    fullName: p.fullName,
    dateOfBirth: p.dateOfBirth.toISOString().slice(0, 10),
    gender: p.gender,
    email: p.email,
    photoUrl: p.photoUrl,
    playerType: p.playerType,
    battingStyle: p.battingStyle,
    bowlingStyle: p.bowlingStyle,
    preferredBattingPosition: p.preferredBattingPosition,
    experienceLevel: p.experienceLevel,
    addressLine1: p.addressLine1,
    addressLine2: p.addressLine2,
    city: p.city,
    state: p.state,
    country: p.country,
    pincode: p.pincode,
    emergencyContactName: p.emergencyContactName,
    emergencyContactRelation: p.emergencyContactRelation,
    emergencyContactPhone: p.emergencyContactPhone,
    jerseySize: p.jerseySize,
    jerseyNumberPref1: p.jerseyNumberPref1,
    jerseyNumberPref2: p.jerseyNumberPref2,
    jerseyName: p.jerseyName,
    medicalInfo: p.medicalInfo
      ? {
          bloodGroup: p.medicalInfo.bloodGroup,
          allergies: p.medicalInfo.allergies,
          conditions: p.medicalInfo.conditions,
          medication: p.medicalInfo.medication,
        }
      : null,
    verificationStatus: p.verificationStatus,
    rejectionReason: p.rejectionReason,
    changeRequestNote: p.changeRequestNote,
    verifiedAt: p.verifiedAt ? p.verifiedAt.toISOString() : null,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}
