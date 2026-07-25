import { motion } from "framer-motion";
import type { ReactNode } from "react";
import clsx from "clsx";

interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  align?: "center" | "left";
  tone?: "default" | "inverted";
  action?: ReactNode;
}

/** Consistent heading + optional subtitle used at the top of every landing-page section, so typographic rhythm stays identical instead of each section inventing its own scale. */
export function SectionHeading({ title, subtitle, align = "center", tone = "default", action }: SectionHeadingProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.32, ease: [0.2, 0, 0, 1] }}
      className={clsx("mb-10 flex flex-col gap-2", align === "center" ? "items-center text-center" : "items-start text-left")}
    >
      <h2
        className={clsx(
          "font-display text-2xl font-bold sm:text-3xl",
          tone === "inverted" ? "text-white" : "text-text-primary",
        )}
      >
        {title}
      </h2>
      {subtitle && (
        <p className={clsx("max-w-xl text-base", tone === "inverted" ? "text-white/70" : "text-text-secondary")}>
          {subtitle}
        </p>
      )}
      {action}
    </motion.div>
  );
}
