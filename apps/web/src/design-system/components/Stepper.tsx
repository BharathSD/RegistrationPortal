import clsx from "clsx";
import { Check } from "lucide-react";

interface StepperProps {
  steps: string[];
  currentIndex: number;
}

export function Stepper({ steps, currentIndex }: StepperProps) {
  return (
    <ol className="flex items-center gap-1.5" aria-label={`Step ${currentIndex + 1} of ${steps.length}`}>
      {steps.map((step, i) => {
        const status = i < currentIndex ? "done" : i === currentIndex ? "current" : "upcoming";
        return (
          <li key={step} className="flex flex-1 items-center gap-1.5">
            <div
              className={clsx(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                status === "done" && "bg-primary text-white",
                status === "current" && "border-2 border-primary text-primary",
                status === "upcoming" && "border border-border text-text-secondary",
              )}
              aria-current={status === "current" ? "step" : undefined}
            >
              {status === "done" ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            <span
              className={clsx(
                "hidden text-xs sm:inline",
                status === "current" ? "font-semibold text-text-primary" : "text-text-secondary",
              )}
            >
              {step}
            </span>
            {i < steps.length - 1 && <div className={clsx("h-px flex-1", status === "done" ? "bg-primary" : "bg-border")} />}
          </li>
        );
      })}
    </ol>
  );
}
