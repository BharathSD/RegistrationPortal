import { useId, type ReactNode } from "react";
import clsx from "clsx";

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: ReactNode;
  error?: string;
}

export function Checkbox({ checked, onChange, label, error }: CheckboxProps) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-start gap-2.5">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          aria-invalid={Boolean(error)}
          className={clsx(
            "mt-0.5 h-5 w-5 shrink-0 rounded-sm border-border text-primary focus-visible:ring-2 focus-visible:ring-primary",
          )}
        />
        <label htmlFor={id} className="text-sm text-text-primary">
          {label}
        </label>
      </div>
      {error && (
        <p role="alert" className="pl-7 text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
