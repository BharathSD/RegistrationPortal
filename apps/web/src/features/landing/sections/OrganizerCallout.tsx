import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, ScanLine, Settings2, Users } from "lucide-react";
import { Button, Card } from "../../../design-system";
import { SectionHeading } from "../../../components/ui/SectionHeading";

const CAPABILITIES = [
  { icon: Users, text: "Review every registration and catch duplicate identities before match day." },
  { icon: ScanLine, text: "Check players in at the gate with a single QR scan." },
];

export function OrganizerCallout() {
  return (
    <section id="organizers" className="mx-auto max-w-5xl px-4 py-16 sm:py-20">
      <SectionHeading title="Running a tournament?" subtitle="Verify players in minutes, not spreadsheets." />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.32, ease: [0.2, 0, 0, 1] }}
      >
        <Card variant="raised" className="mx-auto flex max-w-2xl flex-col items-center gap-6 p-8 text-center sm:p-10">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Settings2 className="h-6 w-6" aria-hidden="true" />
          </div>

          <ul className="flex flex-col gap-3 text-left">
            {CAPABILITIES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3 text-sm text-text-secondary">
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                {text}
              </li>
            ))}
          </ul>

          <Link to="/admin/login">
            <Button size="lg" variant="secondary">
              Sign In as Organizer <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </Link>
        </Card>
      </motion.div>
    </section>
  );
}
