import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  ClipboardCheck,
  QrCode,
  Settings2,
  ShieldCheck,
  Smartphone,
  Trophy,
  User,
  Users,
} from "lucide-react";
import { Button, Card } from "../../design-system";
import { StadiumBackdrop } from "../../components/ui/StadiumBackdrop";

const STEPS = [
  {
    icon: Smartphone,
    title: "Verify your mobile",
    description: "Enter your number and confirm a one-time OTP — no password to remember, ever.",
  },
  {
    icon: ClipboardCheck,
    title: "Complete your profile",
    description: "Personal details, address, and jersey preferences — a few minutes, once.",
  },
  {
    icon: BadgeCheck,
    title: "Get approved & play",
    description: "An admin verifies your profile and issues your permanent Player ID.",
  },
];

const AUDIENCES = [
  {
    icon: Users,
    title: "For Players",
    description:
      "Register once, carry a verified digital Player ID and QR card, and join any open tournament in a couple of taps.",
    to: "/register",
    cta: "Register as a player",
  },
  {
    icon: Settings2,
    title: "For Tournament Admins",
    description:
      "Review and verify players, catch duplicate identities, run tournaments, and message your roster in bulk.",
    to: "/admin/login",
    cta: "Admin sign in",
  },
];

export function LandingPage() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div>
      {/* ---------------------------------------------------------------- Hero */}
      <section className="relative isolate overflow-hidden bg-pitch px-4 pb-20 pt-16 text-white sm:pb-28 sm:pt-24">
        <StadiumBackdrop />
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
              <Trophy className="h-4 w-4" aria-hidden="true" />
              Aviyukthas Player Hub
            </span>
            <h1 className="font-display text-4xl font-extrabold leading-[1.05] sm:text-5xl lg:text-6xl">
              Your Aviyukthas
              <br />
              Identity <span className="text-gold">Starts Here.</span>
            </h1>
            <p className="max-w-md text-lg text-white/80">
              One verified cricket profile unlocks every tournament on the portal. Just your mobile number and an
              OTP — never fill out the same form twice.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link to="/login">
                <Button size="lg" className="w-full sm:w-auto">
                  Log In
                </Button>
              </Link>
              <Link to="/register">
                <Button size="lg" variant="secondary" className="w-full border-white/30 bg-white/10 text-white hover:bg-white/20 sm:w-auto">
                  Register as a New Player
                </Button>
              </Link>
            </div>
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

      {/* ---------------------------------------------------------- How it works */}
      <section className="mx-auto max-w-5xl px-4 py-16 sm:py-20">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.32, ease: [0.2, 0, 0, 1] }}
          className="mb-10 text-center"
        >
          <h2 className="font-display text-2xl font-bold sm:text-3xl">How it works</h2>
          <p className="mt-2 text-text-secondary">Three steps, once. Every tournament after that is instant.</p>
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.32, delay: i * 0.08, ease: [0.2, 0, 0, 1] }}
              className="relative flex flex-col items-center gap-3 text-center"
            >
              <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                <step.icon className="h-6 w-6" aria-hidden="true" />
                <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-gold text-xs font-bold text-white">
                  {i + 1}
                </span>
              </div>
              <h3 className="font-display font-semibold">{step.title}</h3>
              <p className="text-sm text-text-secondary">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------- Built for */}
      <section className="border-y border-border bg-surface px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.32, ease: [0.2, 0, 0, 1] }}
            className="mb-10 text-center font-display text-2xl font-bold sm:text-3xl"
          >
            Built for players and organizers alike
          </motion.h2>

          <div className="grid gap-6 sm:grid-cols-2">
            {AUDIENCES.map((audience, i) => (
              <motion.div
                key={audience.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.32, delay: i * 0.08, ease: [0.2, 0, 0, 1] }}
              >
                <Card className="flex h-full flex-col gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <audience.icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <h3 className="font-display text-lg font-semibold">{audience.title}</h3>
                  <p className="flex-1 text-sm text-text-secondary">{audience.description}</p>
                  <Link to={audience.to} className="inline-flex items-center gap-1 text-sm font-medium text-primary">
                    {audience.cta} <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------- Closing band */}
      <section className="relative isolate overflow-hidden bg-pitch px-4 py-16 text-center text-white">
        <StadiumBackdrop />
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.32, ease: [0.2, 0, 0, 1] }}
          className="relative z-10 mx-auto flex max-w-xl flex-col items-center gap-5"
        >
          <ShieldCheck className="h-8 w-8 text-gold" aria-hidden="true" />
          <h2 className="font-display text-2xl font-bold sm:text-3xl">Ready to step onto the pitch?</h2>
          <p className="text-white/75">Verification takes minutes. Your identity travels with you from here on.</p>
          <Link to="/register">
            <Button size="lg">Register as a New Player</Button>
          </Link>
        </motion.div>
      </section>
    </div>
  );
}

/** Static, decorative preview of the digital player card issued on approval — not real data, just illustrating the product on the hero. */
function PlayerCardPreview() {
  return (
    <div className="w-80 rounded-xl border border-white/10 bg-gradient-to-br from-white/20 to-white/5 p-1.5 shadow-2xl shadow-black/50 backdrop-blur">
      <div className="flex flex-col gap-5 rounded-lg bg-pitch p-6">
        <div className="flex items-center justify-between">
          <span className="font-display text-xs font-semibold uppercase tracking-wider text-white/70">Player ID</span>
          <span className="flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-xs font-semibold text-gold">
            <ShieldCheck className="h-3.5 w-3.5" /> Verified
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/15">
            <User className="h-7 w-7 text-white/70" />
          </div>
          <div>
            <p className="font-display text-lg font-bold leading-tight text-white">Sample Player</p>
            <p className="text-xs text-white/60">Batter · Position 4</p>
          </div>
          <QrCode className="ml-auto h-9 w-9 text-white/30" aria-hidden="true" />
        </div>
        <p className="font-display text-xl font-bold tabular-nums tracking-wide text-white">CKT-KA-26-000187</p>
      </div>
    </div>
  );
}
