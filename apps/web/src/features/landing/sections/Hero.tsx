import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { Phone, ShieldCheck, UserPlus } from "lucide-react";
import { StadiumBackdrop } from "../../../components/ui/StadiumBackdrop";
import { BatsmanOutline } from "../../../components/ui/CricketDecor";
import { PlayerCardPreview } from "./PlayerCardPreview";

export function Hero() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="relative isolate overflow-hidden bg-pitch px-4 pb-20 pt-16 text-white sm:pb-28 sm:pt-24">
      <StadiumBackdrop />
      <BatsmanOutline
        aria-hidden="true"
        className="pointer-events-none absolute right-6 top-8 hidden h-64 w-64 text-white/[0.07] sm:block lg:right-16"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-[10%] top-1/2 hidden h-[420px] w-[420px] -translate-y-1/2 rounded-full bg-gold/10 blur-[110px] lg:block"
      />

      <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, ease: [0.2, 0, 0, 1] }}
          className="flex flex-col items-center gap-6 text-center lg:items-start lg:text-left"
        >
          <span className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-gold">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            Aviyukthas Player Identity Platform
          </span>

          <h1 className="font-display text-4xl font-extrabold leading-[1.05] sm:text-5xl lg:text-6xl">
            One Cricket <span className="text-gold">Identity.</span>
            <br />
            Every Tournament.
          </h1>

          <p className="max-w-md text-lg text-white/80">
            Verified once by tournament organizers. Trusted everywhere you play.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              to="/register"
              className="flex items-center gap-3 rounded-md bg-primary px-5 py-3 text-left transition-colors duration-fast ease-standard hover:bg-primary-600"
            >
              <UserPlus className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span>
                <span className="block text-sm font-semibold leading-tight text-white">Create Your Cricket ID</span>
                <span className="block text-xs text-white/70">New player? Register in minutes.</span>
              </span>
            </Link>
            <Link
              to="/login"
              className="flex items-center gap-3 rounded-md border border-white/30 bg-white/10 px-5 py-3 text-left transition-colors duration-fast ease-standard hover:bg-white/20"
            >
              <Phone className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span>
                <span className="block text-sm font-semibold leading-tight text-white">Continue with Mobile</span>
                <span className="block text-xs text-white/70">Already verified? Log in with OTP.</span>
              </span>
            </Link>
          </div>

          <p className="flex items-center gap-1.5 text-sm text-white/50">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            Only verified players can register for official tournaments.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15, ease: [0.2, 0, 0, 1] }}
          className="relative flex justify-center lg:justify-end"
        >
          <motion.div
            initial={{ opacity: 0, x: 12, rotate: 6 }}
            animate={{ opacity: 1, x: 0, rotate: -3 }}
            transition={{ duration: 0.4, delay: 0.35, ease: [0.2, 0, 0, 1] }}
            className="absolute -left-2 top-2 z-20 hidden items-center gap-1.5 rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-xs font-semibold shadow-lg backdrop-blur sm:flex"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-gold" aria-hidden="true" />
            Verified Identity
          </motion.div>

          <motion.div
            animate={shouldReduceMotion ? undefined : { y: [0, -10, 0] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
            className="[transform:rotate(-4deg)]"
          >
            <PlayerCardPreview />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
