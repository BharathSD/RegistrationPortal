import type { HTMLAttributes } from "react";
import clsx from "clsx";

type Variant = "surface" | "raised" | "gradient";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: Variant;
}

const VARIANT_CLASSES: Record<Variant, string> = {
  surface: "bg-surface border border-border",
  raised: "bg-surface-raised border border-border shadow-lg shadow-black/5",
  gradient: "bg-pitch text-white border-0",
};

export function Card({ variant = "surface", className, children, ...props }: CardProps) {
  return (
    <div className={clsx("rounded-md p-5", VARIANT_CLASSES[variant], className)} {...props}>
      {children}
    </div>
  );
}
