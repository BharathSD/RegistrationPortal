import { motion } from "framer-motion";
import { BadgeCheck, ClipboardCheck, Smartphone } from "lucide-react";
import { SectionHeading } from "../../../components/ui/SectionHeading";

const STEPS = [
  {
    icon: Smartphone,
    title: "Verify your mobile",
    description: "A one-time code confirms it's you. No passwords to forget.",
  },
  {
    icon: ClipboardCheck,
    title: "Build your profile",
    description: "Personal details, address, jersey size — a few minutes, once.",
  },
  {
    icon: BadgeCheck,
    title: "Get verified & play",
    description: "An organizer reviews your profile and issues your permanent Player ID.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="mx-auto max-w-5xl px-4 py-16 sm:py-20">
      <SectionHeading title="How it works" subtitle="Three steps now. Nothing to repeat later." />

      <div className="relative grid gap-10 sm:grid-cols-3 sm:gap-6">
        <div
          aria-hidden="true"
          className="absolute left-0 right-0 top-7 hidden h-px bg-border sm:block"
          style={{ marginInline: "16.66%" }}
        />
        {STEPS.map((step, i) => (
          <motion.div
            key={step.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.32, delay: i * 0.08, ease: [0.2, 0, 0, 1] }}
            className="relative flex flex-col items-center gap-3 text-center"
          >
            <div className="relative flex h-14 w-14 items-center justify-center rounded-full border border-border bg-surface text-primary">
              <step.icon className="h-6 w-6" aria-hidden="true" />
              <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-gold text-xs font-bold text-white ring-4 ring-canvas">
                {i + 1}
              </span>
            </div>
            <h3 className="font-display font-semibold">{step.title}</h3>
            <p className="max-w-[220px] text-sm text-text-secondary">{step.description}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
