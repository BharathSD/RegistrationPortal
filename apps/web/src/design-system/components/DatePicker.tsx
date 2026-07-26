import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import clsx from "clsx";
import { FieldWrapper, inputBaseClasses } from "./Field";

interface DatePickerProps {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  disabled?: boolean;
  /** "YYYY-MM-DD", or "YYYY-MM-DDTHH:mm" when showTime is set — the exact same string shape `<input type="date">`/`<input type="datetime-local">` already produce, so this is a drop-in replacement. */
  value: string;
  onChange: (value: string) => void;
  showTime?: boolean;
  /** "YYYY-MM-DD" floor/ceiling on the selectable day (time portion, if any, is ignored for the comparison). */
  min?: string;
  max?: string;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const pad = (n: number) => String(n).padStart(2, "0");

interface ParsedValue {
  year: number;
  month: number; // 0-indexed
  day: number;
  hour: number;
  minute: number;
}

function parseValue(value: string): ParsedValue | null {
  if (!value) return null;
  const [datePart, timePart] = value.split("T");
  const [y, m, d] = datePart.split("-").map(Number);
  if (!y || !m || !d) return null;
  const [h, mi] = (timePart ?? "").split(":").map(Number);
  return { year: y, month: m - 1, day: d, hour: h || 0, minute: mi || 0 };
}

function formatValue(year: number, month: number, day: number, hour: number, minute: number, showTime?: boolean): string {
  const datePart = `${year}-${pad(month + 1)}-${pad(day)}`;
  return showTime ? `${datePart}T${pad(hour)}:${pad(minute)}` : datePart;
}

function formatDisplay(parsed: ParsedValue | null, showTime?: boolean): string {
  if (!parsed) return "";
  const datePart = `${parsed.day} ${MONTH_NAMES[parsed.month].slice(0, 3)} ${parsed.year}`;
  if (!showTime) return datePart;
  const hour12 = parsed.hour % 12 || 12;
  return `${datePart}, ${hour12}:${pad(parsed.minute)} ${parsed.hour < 12 ? "AM" : "PM"}`;
}

/** Midnight-local Date for the given Y/M/D, ignoring time — used for min/max/selected-day comparisons. */
function dayKey(year: number, month: number, day: number): number {
  return new Date(year, month, day).getTime();
}

function parseDateOnly(v: string): [number, number, number] {
  const [y, m, d] = v.split("-").map(Number);
  return [y, m - 1, d];
}

/** 42 cells (6 full weeks) covering the visible month, with leading/trailing days from adjacent months — relies on the Date constructor's own month/year rollover instead of computing it by hand. */
function getCalendarCells(viewYear: number, viewMonth: number): Date[] {
  const startWeekday = new Date(viewYear, viewMonth, 1).getDay();
  return Array.from({ length: 42 }, (_, i) => new Date(viewYear, viewMonth, 1 - startWeekday + i));
}

/**
 * Custom calendar dropdown replacing the native `<input type="date">` /
 * `type="datetime-local">` — same controlled string value/onChange contract,
 * so every call site swaps in without touching surrounding form logic.
 * Portalled to <body> and positioned from the trigger's bounding rect so it
 * isn't clipped by a scrollable Modal.
 */
export function DatePicker({ label, required, hint, error, disabled, value, onChange, showTime, min, max }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(() => {
    const parsed = parseValue(value);
    const today = new Date();
    return { year: parsed?.year ?? today.getFullYear(), month: parsed?.month ?? today.getMonth() };
  });
  const [position, setPosition] = useState({ top: 0, left: 0 });
  // The very first layout pass has to happen off-screen so the popover has a
  // real size to measure (its height depends on content — e.g. the time row
  // only showTime adds) before it's placed and revealed, otherwise flipping
  // above the trigger when there's no room below would show a visible jump.
  const [ready, setReady] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const parsed = parseValue(value);
  const minKey = min ? dayKey(...parseDateOnly(min)) : undefined;
  const maxKey = max ? dayKey(...parseDateOnly(max)) : undefined;
  const todayKey = dayKey(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());

  function reposition() {
    const rect = triggerRef.current?.getBoundingClientRect();
    const popoverRect = popoverRef.current?.getBoundingClientRect();
    if (!rect) return;
    const popoverHeight = popoverRect?.height ?? 0;
    const popoverWidth = popoverRect?.width ?? 288;
    const spaceBelow = window.innerHeight - rect.bottom;
    const fitsBelow = spaceBelow >= popoverHeight + 8 || rect.top < popoverHeight + 8;
    const top = fitsBelow ? rect.bottom + 4 : rect.top - popoverHeight - 4;
    const left = Math.min(rect.left, window.innerWidth - popoverWidth - 8);
    setPosition({ top: Math.max(8, top), left: Math.max(8, left) });
  }

  function openPicker() {
    const p = parseValue(value);
    const today = new Date();
    setView({ year: p?.year ?? today.getFullYear(), month: p?.month ?? today.getMonth() });
    setReady(false);
    setOpen(true);
  }

  // Runs once the popover has mounted (with real dimensions) for this open —
  // repositions using its actual measured height, then reveals it.
  useLayoutEffect(() => {
    if (!open) return;
    reposition();
    setReady(true);
  }, [open, view, showTime]);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(e: MouseEvent) {
      const target = e.target as Node;
      if (popoverRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
      setOpen(false);
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    function handleReposition() {
      reposition();
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, true);
    };
  }, [open]);

  function isDisabledDay(cell: Date): boolean {
    const key = cell.getTime();
    if (minKey !== undefined && key < minKey) return true;
    if (maxKey !== undefined && key > maxKey) return true;
    return false;
  }

  function selectDay(cell: Date) {
    if (isDisabledDay(cell)) return;
    onChange(formatValue(cell.getFullYear(), cell.getMonth(), cell.getDate(), parsed?.hour ?? 0, parsed?.minute ?? 0, showTime));
    if (!showTime) setOpen(false);
  }

  function changeTime(e: React.ChangeEvent<HTMLInputElement>) {
    const [h, mi] = e.target.value.split(":").map(Number);
    const base = parsed ?? { year: view.year, month: view.month, day: new Date().getDate() };
    onChange(formatValue(base.year, base.month, base.day, h || 0, mi || 0, true));
  }

  const cells = getCalendarCells(view.year, view.month);

  // Stepping month-by-month to reach a date of birth 20-30 years back would
  // take hundreds of clicks — these let you jump straight there. Bounded by
  // min/max when given (e.g. "max=today" for a DOB field), otherwise a
  // generous default range; newest year first since most users are jumping
  // back a couple of decades, not to the 1920s.
  const currentYear = new Date().getFullYear();
  const minYear = min ? parseDateOnly(min)[0] : currentYear - 100;
  const maxYear = max ? parseDateOnly(max)[0] : currentYear + 10;
  const yearOptions = Array.from({ length: maxYear - minYear + 1 }, (_, i) => maxYear - i);
  const jumpSelectClasses =
    "rounded-sm border border-border bg-surface px-1.5 py-1 text-sm font-semibold text-text-primary focus-visible:border-primary";

  return (
    <FieldWrapper label={label} hint={hint} error={error} required={required}>
      {({ inputId, describedBy }) => (
        <>
          <button
            ref={triggerRef}
            id={inputId}
            type="button"
            disabled={disabled}
            aria-haspopup="dialog"
            aria-expanded={open}
            aria-describedby={describedBy}
            aria-invalid={Boolean(error)}
            onClick={() => (open ? setOpen(false) : openPicker())}
            className={clsx(
              inputBaseClasses,
              "flex items-center justify-between text-left",
              !value && "text-text-secondary",
              error && "border-danger",
            )}
          >
            <span>{formatDisplay(parsed, showTime) || (showTime ? "Select date & time" : "Select date")}</span>
            <Calendar className="h-4 w-4 shrink-0 text-text-secondary" aria-hidden="true" />
          </button>

          {open &&
            createPortal(
              <div
                ref={popoverRef}
                role="dialog"
                aria-label={`${label} picker`}
                style={{ position: "fixed", top: position.top, left: position.left, visibility: ready ? "visible" : "hidden" }}
                className="z-[60] w-72 rounded-md border border-border bg-surface-raised p-3 shadow-xl"
              >
                <div className="mb-2 flex items-center justify-between">
                  <button
                    type="button"
                    aria-label="Previous month"
                    onClick={() => setView((v) => (v.month === 0 ? { year: v.year - 1, month: 11 } : { year: v.year, month: v.month - 1 }))}
                    className="rounded-sm p-1 text-text-secondary hover:bg-canvas"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <div className="flex items-center gap-1">
                    <select
                      aria-label="Month"
                      value={view.month}
                      onChange={(e) => setView((v) => ({ ...v, month: Number(e.target.value) }))}
                      className={jumpSelectClasses}
                    >
                      {MONTH_NAMES.map((m, i) => (
                        <option key={m} value={i}>
                          {m}
                        </option>
                      ))}
                    </select>
                    <select
                      aria-label="Year"
                      value={view.year}
                      onChange={(e) => setView((v) => ({ ...v, year: Number(e.target.value) }))}
                      className={jumpSelectClasses}
                    >
                      {yearOptions.map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    aria-label="Next month"
                    onClick={() => setView((v) => (v.month === 11 ? { year: v.year + 1, month: 0 } : { year: v.year, month: v.month + 1 }))}
                    className="rounded-sm p-1 text-text-secondary hover:bg-canvas"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-0.5 text-center text-xs text-text-secondary">
                  {WEEKDAY_LABELS.map((w) => (
                    <div key={w} className="py-1 font-medium">
                      {w}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-0.5">
                  {cells.map((cell) => {
                    const inMonth = cell.getMonth() === view.month;
                    const isSelected =
                      parsed && cell.getFullYear() === parsed.year && cell.getMonth() === parsed.month && cell.getDate() === parsed.day;
                    const isToday = dayKey(cell.getFullYear(), cell.getMonth(), cell.getDate()) === todayKey;
                    const disabledDay = isDisabledDay(cell);
                    return (
                      <button
                        key={cell.toISOString()}
                        type="button"
                        disabled={disabledDay}
                        onClick={() => selectDay(cell)}
                        className={clsx(
                          "h-8 rounded-sm text-sm tabular-nums",
                          !inMonth && "text-text-secondary/50",
                          inMonth && !isSelected && "text-text-primary hover:bg-canvas",
                          isSelected && "bg-primary text-on-primary font-semibold",
                          !isSelected && isToday && "border border-primary/50",
                          disabledDay && "cursor-not-allowed opacity-30 hover:bg-transparent",
                        )}
                      >
                        {cell.getDate()}
                      </button>
                    );
                  })}
                </div>

                {showTime && (
                  <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-3">
                    <input
                      type="time"
                      aria-label="Time"
                      value={parsed ? `${pad(parsed.hour)}:${pad(parsed.minute)}` : ""}
                      onChange={changeTime}
                      className={clsx(inputBaseClasses, "h-9 flex-1")}
                    />
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      className="h-9 shrink-0 rounded-sm bg-primary px-3 text-sm font-medium text-on-primary hover:bg-primary-600"
                    >
                      Done
                    </button>
                  </div>
                )}
              </div>,
              document.body,
            )}
        </>
      )}
    </FieldWrapper>
  );
}
