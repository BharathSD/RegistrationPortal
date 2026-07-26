import { useState } from "react";
import { motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { RotateCw, ShieldCheck, User } from "lucide-react";
import type { Player } from "@cricket-platform/shared";

/** The digital player ID card: front shows photo/name/player type/Player ID, back shows a QR for match-day identity verification. Tap or click to flip (docs/WIREFRAMES.md #10). */
export function PlayerCard({ player }: { player: Player }) {
  const [flipped, setFlipped] = useState(false);

  return (
    <button
      onClick={() => setFlipped((f) => !f)}
      aria-label="Flip player card to see QR code"
      className="block w-full [perspective:1200px]"
    >
      <motion.div
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.5, ease: [0.2, 0, 0, 1] }}
        className="relative h-52 w-full [transform-style:preserve-3d]"
      >
        {/* Front */}
        <div className="absolute inset-0 flex flex-col justify-between rounded-lg bg-pitch p-5 text-white [backface-visibility:hidden]">
          <div className="flex items-center justify-between">
            <span className="font-display text-xs font-semibold uppercase tracking-wider text-white/70">Player ID</span>
            {player.verificationStatus === "VERIFIED" && (
              <span className="flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-xs font-semibold text-gold">
                <ShieldCheck className="h-3.5 w-3.5" /> Verified
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-white/15">
              {player.photoUrl ? (
                <img src={player.photoUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <User className="h-7 w-7 text-white/70" />
              )}
            </div>
            <div>
              <p className="font-display text-lg font-bold leading-tight">{player.fullName}</p>
              <p className="text-sm text-white/70">
                {player.playerType
                  ? `${player.playerType.replace("_", " ")} · Position ${player.preferredBattingPosition}`
                  : "Cricket profile not yet assigned"}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <p className="font-display text-xl font-bold tabular-nums tracking-wide">{player.playerId ?? "Pending"}</p>
            <RotateCw className="h-4 w-4 text-white/50" aria-hidden="true" />
          </div>
        </div>

        {/* Back */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-lg border border-border bg-surface p-5 [backface-visibility:hidden] [transform:rotateY(180deg)]">
          {player.playerId ? (
            <QRCodeSVG value={player.playerId} size={128} />
          ) : (
            <p className="text-sm text-text-secondary">QR available once verified</p>
          )}
          <div className="text-center text-xs text-text-secondary">
            <p className="font-semibold text-text-primary">Emergency: {player.emergencyContactName}</p>
            <p>{player.emergencyContactPhone}</p>
            <p className="mt-1">Scan to verify identity at check-in</p>
          </div>
        </div>
      </motion.div>
    </button>
  );
}
