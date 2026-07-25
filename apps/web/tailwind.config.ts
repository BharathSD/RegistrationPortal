import type { Config } from "tailwindcss";

/**
 * Tokens are defined as CSS custom properties in src/styles/tokens.css so a
 * single source of truth drives both light and dark themes (see
 * docs/DESIGN_SYSTEM.md). Tailwind classes below just point at those vars —
 * no hex codes live in component code.
 */
export default {
  darkMode: ["class", '[data-theme="dark"]'],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "var(--color-bg-canvas)",
        surface: "var(--color-bg-surface)",
        "surface-raised": "var(--color-bg-surface-raised)",
        border: "var(--color-border)",
        "text-primary": "var(--color-text-primary)",
        "text-secondary": "var(--color-text-secondary)",
        primary: {
          DEFAULT: "var(--color-primary-500)",
          600: "var(--color-primary-600)",
        },
        "on-primary": "var(--color-on-primary)",
        gold: "var(--color-accent-gold-500)",
        success: {
          DEFAULT: "var(--color-success-500)",
          700: "var(--color-success-700)",
        },
        warning: {
          DEFAULT: "var(--color-warning-500)",
          700: "var(--color-warning-700)",
        },
        danger: {
          DEFAULT: "var(--color-danger-500)",
          700: "var(--color-danger-700)",
        },
      },
      fontFamily: {
        display: ["Sora", "ui-sans-serif", "system-ui", "sans-serif"],
        body: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      borderRadius: {
        sm: "6px",
        md: "12px",
        lg: "20px",
      },
      backgroundImage: {
        pitch: "var(--color-pitch-gradient)",
      },
      transitionTimingFunction: {
        standard: "cubic-bezier(0.2, 0, 0, 1)",
        sharp: "cubic-bezier(0.4, 0, 1, 1)",
      },
      transitionDuration: {
        fast: "120ms",
        base: "200ms",
        slow: "320ms",
      },
    },
  },
  plugins: [],
} satisfies Config;
