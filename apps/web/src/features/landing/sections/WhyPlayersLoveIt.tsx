import { motion } from "framer-motion";
import { ClipboardCheck, Heart, QrCode, ShieldCheck, Zap } from "lucide-react";

const REASONS = [
  {
    icon: ClipboardCheck,
    title: "No repeated registration forms",
    description: "Register once and you're good to go.",
  },
  {
    icon: ShieldCheck,
    title: "Verified player identity",
    description: "Approved by tournament organizers for trust and safety.",
  },
  {
    icon: Zap,
    title: "Fast tournament registration",
    description: "Just enter your mobile number and register.",
  },
  {
    icon: QrCode,
    title: "Instant check-in with QR code",
    description: "Scan and play. No manual attendance.",
  },
];

/**
 * Sits directly against the hero (same dark surface, pulled up with a
 * negative margin) so hero + this panel read as one continuous "opening
 * statement" before the page shifts to a lighter, explanatory register.
 * One accent color throughout (gold + white) — no per-icon rainbow.
 */
export function WhyPlayersLoveIt() {
  return (
    <section id="trust" className="relative isolate bg-pitch px-4 pb-16 pt-4 text-white sm:pb-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.32, ease: [0.2, 0, 0, 1] }}
        className="relative z-10 mx-auto grid max-w-5xl gap-8 rounded-xl border border-white/10 bg-white/5 p-8 backdrop-blur sm:p-10 lg:grid-cols-[0.7fr_2fr] lg:items-center"
      >
        <div className="flex items-center gap-2 lg:flex-col lg:items-start lg:gap-3">
          <Heart className="h-6 w-6 shrink-0 text-gold" aria-hidden="true" />
          <h2 className="font-display text-xl font-bold sm:text-2xl">Why players love it</h2>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {REASONS.map((reason) => (
            <div key={reason.title} className="flex flex-col gap-2">
              <reason.icon className="h-5 w-5 text-gold" aria-hidden="true" />
              <h3 className="text-sm font-semibold leading-snug">{reason.title}</h3>
              <p className="text-xs text-white/60">{reason.description}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
