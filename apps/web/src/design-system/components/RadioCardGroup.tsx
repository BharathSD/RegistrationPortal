import clsx from "clsx";

export interface RadioCardOption {
  value: string;
  label: string;
  description?: string;
}

interface RadioCardGroupProps {
  label: string;
  options: RadioCardOption[];
  value: string;
  onChange: (value: string) => void;
  error?: string;
  columns?: 2 | 3 | 4;
}

/** Large, tappable cards instead of tiny radio dots — this is the primary picker for cricket role / batting style / experience level on mobile (see docs/WIREFRAMES.md). */
export function RadioCardGroup({ label, options, value, onChange, error, columns = 2 }: RadioCardGroupProps) {
  const gridCols = { 2: "grid-cols-2", 3: "grid-cols-3", 4: "grid-cols-2 sm:grid-cols-4" }[columns];

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-sm font-medium text-text-primary">{label}</legend>
      <div className={clsx("grid gap-2", gridCols)} role="radiogroup" aria-label={label}>
        {options.map((opt) => {
          const selected = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(opt.value)}
              className={clsx(
                "min-h-[44px] rounded-sm border px-3 py-2.5 text-left text-sm transition-colors duration-fast",
                selected
                  ? "border-primary bg-primary/10 font-semibold text-primary"
                  : "border-border bg-surface text-text-primary hover:bg-canvas",
              )}
            >
              <div>{opt.label}</div>
              {opt.description && <div className="text-xs font-normal text-text-secondary">{opt.description}</div>}
            </button>
          );
        })}
      </div>
      {error && (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
    </fieldset>
  );
}
