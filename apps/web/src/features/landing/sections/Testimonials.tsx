import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Quote } from "lucide-react";
import { SectionHeading } from "../../../components/ui/SectionHeading";

/**
 * Honest placeholder — deliberately not fabricated quotes attributed to
 * invented players. On a product whose entire pitch is trust, fake social
 * proof is the one shortcut that could break it if anyone noticed. This
 * comes back as a real carousel once there are real players to feature.
 */
export function Testimonials() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-16 sm:py-20">
      <SectionHeading title="What players are saying" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.32, ease: [0.2, 0, 0, 1] }}
        className="mx-auto flex max-w-lg flex-col items-center gap-4 rounded-lg border border-dashed border-border bg-surface px-8 py-12 text-center"
      >
        <Quote className="h-8 w-8 text-text-secondary" aria-hidden="true" />
        <p className="text-text-secondary">
          Player stories are on their way. Be one of the first verified players on Aviyukthas Player Hub.
        </p>
        <Link to="/register" className="text-sm font-medium text-primary underline">
          Create your Cricket ID
        </Link>
      </motion.div>
    </section>
  );
}
