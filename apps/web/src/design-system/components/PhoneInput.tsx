import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { COUNTRY_DIAL_CODES, DEFAULT_COUNTRY_ISO2, flagEmoji } from "@cricket-platform/shared";
import { FieldWrapper, inputBaseClasses } from "./Field";

interface PhoneInputProps {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  disabled?: boolean;
  /** Full E.164 value, e.g. "+919876543210", or "" when empty. */
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

/** Longest-dial-code-first, so e.g. "+971..." (UAE) never gets misread against a shorter prefix. */
const SORTED_BY_DIAL_CODE_LENGTH = [...COUNTRY_DIAL_CODES].sort((a, b) => b.dialCode.length - a.dialCode.length);

function splitE164(value: string): { iso2: string; national: string } {
  if (!value.startsWith("+")) return { iso2: DEFAULT_COUNTRY_ISO2, national: "" };
  const digits = value.slice(1);
  const match = SORTED_BY_DIAL_CODE_LENGTH.find((c) => digits.startsWith(c.dialCode));
  if (!match) return { iso2: DEFAULT_COUNTRY_ISO2, national: digits };
  return { iso2: match.iso2, national: digits.slice(match.dialCode.length) };
}

function dialCodeFor(iso2: string): string {
  return COUNTRY_DIAL_CODES.find((c) => c.iso2 === iso2)?.dialCode ?? "";
}

/** Country-code select + national-number input, combining to/from the same plain E.164 string every call site already stores — a drop-in replacement for `<Input type="tel">`. */
export function PhoneInput({ label, required, hint, error, disabled, value, onChange, onKeyDown }: PhoneInputProps) {
  // The selected country is its own state rather than purely derived from
  // `value` — the full E.164 string can't represent "country chosen, no
  // digits yet" (it's just "" either way), so deriving iso2 from value alone
  // would silently reset the picker to the default country every time the
  // number field is empty, discarding whatever the user just picked.
  const [iso2, setIso2] = useState(() => splitE164(value).iso2);
  const national = splitE164(value).national;
  const iso2Ref = useRef(iso2);
  iso2Ref.current = iso2;

  // Still follow the value prop when it actually carries a country (e.g. a
  // parent pre-fills an existing number for edit) — just not when it's "".
  // A few dial codes are shared by multiple countries (+1 for both the US
  // and Canada); if the *currently selected* country still explains the
  // digits, keep it rather than re-deriving from scratch and landing on
  // whichever country happens to come first for that dial code — otherwise
  // picking "United States" and then typing a number would immediately
  // flip the selector back to "Canada" on the very next render.
  useEffect(() => {
    if (!value.startsWith("+")) return;
    const digits = value.slice(1);
    const currentDialCode = dialCodeFor(iso2Ref.current);
    if (currentDialCode && digits.startsWith(currentDialCode)) return;
    setIso2(splitE164(value).iso2);
  }, [value]);

  function handleCountryChange(nextIso2: string) {
    setIso2(nextIso2);
    if (national) onChange(`+${dialCodeFor(nextIso2)}${national}`);
  }

  function handleNumberChange(digits: string) {
    onChange(digits ? `+${dialCodeFor(iso2)}${digits}` : "");
  }

  return (
    <FieldWrapper label={label} hint={hint} error={error} required={required}>
      {({ inputId, describedBy }) => (
        <div className="flex gap-2">
          <select
            aria-label="Country code"
            value={iso2}
            disabled={disabled}
            onChange={(e) => handleCountryChange(e.target.value)}
            className={clsx(inputBaseClasses, "!w-[7.5rem] shrink-0 pr-1")}
          >
            {COUNTRY_DIAL_CODES.map((c) => (
              <option key={c.iso2} value={c.iso2}>
                {flagEmoji(c.iso2)} +{c.dialCode} {c.name}
              </option>
            ))}
          </select>
          <input
            id={inputId}
            type="tel"
            inputMode="tel"
            required={required}
            disabled={disabled}
            aria-describedby={describedBy}
            aria-invalid={Boolean(error)}
            placeholder="98765 43210"
            value={national}
            onChange={(e) => handleNumberChange(e.target.value.replace(/\D/g, ""))}
            onKeyDown={onKeyDown}
            className={clsx(inputBaseClasses, "flex-1", error && "border-danger")}
          />
        </div>
      )}
    </FieldWrapper>
  );
}
