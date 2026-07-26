import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from "react";
import clsx from "clsx";

export interface FieldWrapperProps {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: (ids: { inputId: string; describedBy: string | undefined }) => ReactNode;
}

/** Shared label/hint/error wrapper so every field gets consistent a11y wiring: explicit <label>, aria-describedby, aria-live error text. Exported so composite fields (PhoneInput, DatePicker) get the same chrome without duplicating it. */
export function FieldWrapper({ label, hint, error, required, children }: FieldWrapperProps) {
  const inputId = useId();
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-medium text-text-primary">
        {label}
        {required && (
          <span className="text-danger" aria-hidden="true">
            {" "}
            *
          </span>
        )}
      </label>
      {children({ inputId, describedBy })}
      {hint && !error && (
        <p id={hintId} className="text-xs text-text-secondary">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" aria-live="polite" className="text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

export const inputBaseClasses =
  "h-11 w-full rounded-sm border border-border bg-surface px-3 text-sm text-text-primary placeholder:text-text-secondary focus-visible:border-primary disabled:opacity-50";

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "id">, Omit<FieldWrapperProps, "children"> {}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, required, className, ...props }, ref) => (
    <FieldWrapper label={label} hint={hint} error={error} required={required}>
      {({ inputId, describedBy }) => (
        <input
          ref={ref}
          id={inputId}
          aria-describedby={describedBy}
          aria-invalid={Boolean(error)}
          required={required}
          className={clsx(inputBaseClasses, error && "border-danger", className)}
          {...props}
        />
      )}
    </FieldWrapper>
  ),
);
Input.displayName = "Input";

interface SelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "id">,
    Omit<FieldWrapperProps, "children"> {
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, hint, error, required, options, placeholder, className, ...props }, ref) => (
    <FieldWrapper label={label} hint={hint} error={error} required={required}>
      {({ inputId, describedBy }) => (
        <select
          ref={ref}
          id={inputId}
          aria-describedby={describedBy}
          aria-invalid={Boolean(error)}
          required={required}
          className={clsx(inputBaseClasses, "appearance-none", error && "border-danger", className)}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      )}
    </FieldWrapper>
  ),
);
Select.displayName = "Select";
