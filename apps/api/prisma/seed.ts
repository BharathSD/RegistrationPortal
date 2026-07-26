/* eslint-disable no-console */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  const passwordHash = await bcrypt.hash("Admin@12345", 10);
  const admin = await prisma.adminUser.upsert({
    where: { email: "admin@aviyukthas.com" },
    update: {},
    create: {
      email: "admin@aviyukthas.com",
      passwordHash,
      fullName: "Aviyukthas Admin",
      role: "ADMIN",
    },
  });

  const scannerHash = await bcrypt.hash("Scanner@12345", 10);
  await prisma.adminUser.upsert({
    where: { email: "scanner@aviyukthas.com" },
    update: {},
    create: {
      email: "scanner@aviyukthas.com",
      passwordHash: scannerHash,
      fullName: "Gate Volunteer",
      role: "SCANNER",
    },
  });

  const players = [
    {
      mobile: "+919876543210",
      fullName: "Rohan Sharma",
      dateOfBirth: new Date("1998-04-12"),
      gender: "MALE" as const,
      playerType: "BATSMAN" as const,
      battingStyle: "RIGHT_HAND" as const,
      bowlingStyle: "NONE" as const,
      preferredBattingPosition: 3,
      experienceLevel: "ADVANCED" as const,
      addressLine1: "221 Indiranagar 100 Feet Road",
      city: "Bengaluru",
      pincode: "560001",
      state: "Karnataka",
      country: "India",
      emergencyContactName: "Meena Sharma",
      emergencyContactRelation: "Mother",
      emergencyContactPhone: "+919876543211",
      jerseySize: "L" as const,
      jerseyNumberPref1: "7",
      jerseyName: "R. SHARMA",
      playerId: "AVI-000001",
    },
    {
      mobile: "+919876543220",
      fullName: "Ananya Rao",
      dateOfBirth: new Date("2001-09-03"),
      gender: "FEMALE" as const,
      playerType: "ALL_ROUNDER" as const,
      battingStyle: "LEFT_HAND" as const,
      bowlingStyle: "LEFT_ARM_SPIN" as const,
      preferredBattingPosition: 5,
      experienceLevel: "INTERMEDIATE" as const,
      addressLine1: "45 Vidyaranyapuram Main Road",
      city: "Mysuru",
      pincode: "570001",
      state: "Karnataka",
      country: "India",
      emergencyContactName: "Suresh Rao",
      emergencyContactRelation: "Father",
      emergencyContactPhone: "+919876543221",
      jerseySize: "M" as const,
      jerseyNumberPref1: "23",
      jerseyName: "A. RAO",
      playerId: "AVI-000002",
    },
    {
      mobile: "+919876543230",
      fullName: "Vikram Singh",
      dateOfBirth: new Date("1995-01-20"),
      gender: "MALE" as const,
      playerType: "BOWLER" as const,
      battingStyle: "RIGHT_HAND" as const,
      bowlingStyle: "RIGHT_ARM_FAST" as const,
      preferredBattingPosition: 9,
      experienceLevel: "PROFESSIONAL" as const,
      addressLine1: "12 Sector 17 Market",
      city: "Chandigarh",
      pincode: "160017",
      state: "Punjab",
      country: "India",
      emergencyContactName: "Harpreet Singh",
      emergencyContactRelation: "Brother",
      emergencyContactPhone: "+919876543231",
      jerseySize: "XL" as const,
      jerseyNumberPref1: "99",
      jerseyName: "V. SINGH",
      playerId: null, // still pending verification, to populate the admin queue
      verificationStatus: "PENDING_VERIFICATION" as const,
    },
  ];

  const createdPlayers = [];
  for (const p of players) {
    const { playerId, verificationStatus, ...rest } = p;
    // mobile isn't DB-unique on its own (see the partial-index comment on
    // the schema field) so this can't be a prisma.player.upsert() keyed on
    // it — findFirst + conditional create, same workaround as
    // PrismaPlayerRepository.findByMobile.
    const existing = await prisma.player.findFirst({ where: { mobile: p.mobile, deletedAt: null } });
    const player =
      existing ??
      (await prisma.player.create({
        data: {
          ...rest,
          playerId: playerId ?? undefined,
          verificationStatus: verificationStatus ?? "VERIFIED",
          ...(playerId ? { verifiedByAdminId: admin.id, verifiedAt: new Date() } : {}),
        },
      }));
    createdPlayers.push(player);
  }

  const tournament = await prisma.tournament.upsert({
    where: { slug: "summer-t20-cup-2026" },
    update: {},
    create: {
      name: "Summer T20 Cup 2026",
      slug: "summer-t20-cup-2026",
      description: "An open, community T20 tournament for verified players across Karnataka.",
      venue: "M. Chinnaswamy Community Ground, Bengaluru",
      startDate: new Date("2026-09-05"),
      endDate: new Date("2026-09-20"),
      registrationOpenAt: new Date("2026-07-01T00:00:00Z"),
      registrationCloseAt: new Date("2026-08-25T23:59:59Z"),
      maxParticipants: 200,
      entryFee: 500,
      feeRequired: true,
      rulesMarkdown: "## Rules\n1. Players must be 16+.\n2. Standard ICC playing conditions apply.\n3. Verified Player ID required at check-in.",
      status: "PUBLISHED",
      createdByAdminId: admin.id,
    },
  });

  await prisma.tournament.upsert({
    where: { slug: "winter-league-2026-draft" },
    update: {},
    create: {
      name: "Winter League 2026",
      slug: "winter-league-2026-draft",
      description: "Draft tournament — not yet published.",
      venue: "TBD",
      startDate: new Date("2026-12-01"),
      endDate: new Date("2026-12-15"),
      registrationOpenAt: new Date("2026-10-01T00:00:00Z"),
      registrationCloseAt: new Date("2026-11-20T23:59:59Z"),
      feeRequired: false,
      status: "DRAFT",
      createdByAdminId: admin.id,
    },
  });

  const verifiedPlayers = createdPlayers.filter((p) => p.verificationStatus === "VERIFIED");
  for (const player of verifiedPlayers) {
    await prisma.registration.upsert({
      where: { playerId_tournamentId: { playerId: player.id, tournamentId: tournament.id } },
      update: {},
      create: {
        playerId: player.id,
        tournamentId: tournament.id,
        status: "CONFIRMED",
        rulesAccepted: true,
        rulesAcceptedAt: new Date(),
        qrToken: crypto.randomBytes(24).toString("base64url"),
      },
    });
  }

  console.log("✅ Seed complete:");
  console.log("   Admin:    admin@aviyukthas.com / Admin@12345");
  console.log("   Scanner:  scanner@aviyukthas.com / Scanner@12345");
  console.log(`   Verified players:  ${verifiedPlayers.length} (mobiles above), 1 pending verification`);
  console.log(`   Tournament:        ${tournament.name} (${tournament.slug})`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
