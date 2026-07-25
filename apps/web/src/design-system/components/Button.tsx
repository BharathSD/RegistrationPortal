import { forwardRef, type ButtonHTMLAttributes } from "react";
import clsx from "clsx";
import { Loader2 } from "lucide-react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const VARIANT_CLASSES: Record<Variant, string> = {
  // text-on-primary (not text-white): in dark theme --color-primary-500 is
  // too light for white text to clear 4.5:1, so that token flips to a dark
  // color instead — see tokens.css.
  primary: "bg-primary text-on-primary hover:bg-primary-600 disabled:opacity-50",
  secondary:
    "bg-surface border border-border text-text-primary hover:bg-canvas disabled:opacity-50",
  ghost: "bg-transparent text-text-primary hover:bg-canvas disabled:opacity-50",
  danger: "bg-danger text-white hover:brightness-110 disabled:opacity-50",
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: "h-9 px-3 text-sm gap-1.5",
  md: "h-11 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", loading, disabled, className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={clsx(
          "inline-flex items-center justify-center rounded-md font-medium",
          "transition-colors duration-fast ease-standard",
          "disabled:cursor-not-allowed",
          VARIANT_CLASSES[variant],
          SIZE_CLASSES[size],
          className,
        )}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";
