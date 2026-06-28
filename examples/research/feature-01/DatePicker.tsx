import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  type KeyboardEvent,
} from "react";

// ─── Date Utilities ───────────────────────────────────────────────────────────

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

function addDays(d: Date, n: number): Date {
  const nd = new Date(d);
  nd.setDate(d.getDate() + n);
  return nd;
}

function addMonths(d: Date, n: number): Date {
  const nd = new Date(d);
  nd.setMonth(d.getMonth() + n);
  return nd;
}

function addYears(d: Date, n: number): Date {
  const nd = new Date(d);
  nd.setFullYear(d.getFullYear() + n);
  return nd;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isBefore(a: Date, b: Date): boolean {
  return a.getTime() < b.getTime();
}

function isAfter(a: Date, b: Date): boolean {
  return a.getTime() > b.getTime();
}

function clampDate(d: Date, min?: Date, max?: Date): Date {
  if (min && isBefore(d, min)) return min;
  if (max && isAfter(d, max)) return max;
  return d;
}

/** Format a Date as MM/DD/YYYY for the text input */
function formatDate(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${mm}/${dd}/${d.getFullYear()}`;
}

/** Parse MM/DD/YYYY or M/D/YYYY string, returns null on failure */
function parseDate(s: string): Date | null {
  const parts = s.split("/");
  if (parts.length !== 3) return null;
  const [mm, dd, yyyy] = parts.map(Number);
  if (isNaN(mm) || isNaN(dd) || isNaN(yyyy)) return null;
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31 || yyyy < 1 || yyyy > 9999)
    return null;
  const d = new Date(yyyy, mm - 1, dd);
  // Validate the date actually matches (e.g., Feb 30 → Mar 2)
  if (d.getMonth() !== mm - 1 || d.getDate() !== dd) return null;
  return d;
}

/** Generate the 6-week grid (42 cells) starting from the given month */
function buildCalendarDays(monthDate: Date, firstDayOfWeek: number): Date[] {
  const first = startOfMonth(monthDate);
  // Offset from the calendar's week start to the 1st of the month
  let startOffset = first.getDay() - firstDayOfWeek;
  if (startOffset < 0) startOffset += 7;
  const gridStart = addDays(first, -startOffset);
  const days: Date[] = [];
  for (let i = 0; i < 42; i++) {
    days.push(addDays(gridStart, i));
  }
  return days;
}

const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const WEEKDAY_FULL = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DatePickerProps {
  /** Currently selected date (controlled) */
  value: Date | null;
  /** Called when the user selects or clears a date */
  onChange: (date: Date | null) => void;
  /** Minimum selectable date (inclusive) */
  min?: Date;
  /** Maximum selectable date (inclusive) */
  max?: Date;
  /** Label for the date input field */
  label?: string;
  /** First day of the week (0=Sunday, 1=Monday, ...) */
  firstDayOfWeek?: number;
  /** Date format placeholder for the input */
  placeholder?: string;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface CalendarGridProps {
  monthDate: Date;
  selectedDate: Date | null;
  focusedDate: Date;
  min?: Date;
  max?: Date;
  firstDayOfWeek: number;
  onSelect: (date: Date) => void;
  onFocusChange: (date: Date) => void;
}

const CalendarGrid = React.memo(function CalendarGrid({
  monthDate,
  selectedDate,
  focusedDate,
  min,
  max,
  firstDayOfWeek,
  onSelect,
  onFocusChange,
}: CalendarGridProps) {
  const gridRef = useRef<HTMLTableElement>(null);
  const month = monthDate.getMonth();
  const year = monthDate.getFullYear();

  const days = useMemo(
    () => buildCalendarDays(monthDate, firstDayOfWeek),
    [monthDate.getFullYear(), monthDate.getMonth(), firstDayOfWeek],
  );

  /** Check if a date is outside the min/max range */
  const isDisabled = useCallback(
    (d: Date): boolean => {
      if (min && isBefore(d, min)) return true;
      if (max && isAfter(d, max)) return true;
      return false;
    },
    [min?.getTime(), max?.getTime()],
  );

  /** Move focus by delta days, skipping disabled dates in the given direction */
  const moveFocus = useCallback(
    (from: Date, delta: number) => {
      let next = addDays(from, delta);
      // Don't skip disabled for day navigation (arrow keys) — just land on it
      onFocusChange(next);
    },
    [onFocusChange],
  );

  /** Move focus by delta months, preserving day-of-month (clamped) */
  const moveMonth = useCallback(
    (from: Date, delta: number) => {
      const target = addMonths(from, delta);
      // Clamp day-of-month to the target month's last day
      const lastDay = endOfMonth(target).getDate();
      const day = Math.min(from.getDate(), lastDay);
      const result = new Date(target.getFullYear(), target.getMonth(), day);
      onFocusChange(clampDate(result, min, max));
    },
    [onFocusChange, min?.getTime(), max?.getTime()],
  );

  /** Move focus by delta years */
  const moveYear = useCallback(
    (from: Date, delta: number) => {
      const target = addYears(from, delta);
      const lastDay = endOfMonth(target).getDate();
      const day = Math.min(from.getDate(), lastDay);
      const result = new Date(target.getFullYear(), target.getMonth(), day);
      onFocusChange(clampDate(result, min, max));
    },
    [onFocusChange, min?.getTime(), max?.getTime()],
  );

  /** Handle keyboard navigation on the grid */
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTableElement>) => {
      const key = e.key;
      let handled = true;

      switch (key) {
        case "ArrowRight":
          moveFocus(focusedDate, 1);
          break;
        case "ArrowLeft":
          moveFocus(focusedDate, -1);
          break;
        case "ArrowDown":
          moveFocus(focusedDate, 7);
          break;
        case "ArrowUp":
          moveFocus(focusedDate, -7);
          break;
        case "Home":
          onFocusChange(
            addDays(focusedDate, -focusedDate.getDay() + firstDayOfWeek),
          );
          break;
        case "End": {
          const weekStart = addDays(
            focusedDate,
            -focusedDate.getDay() + firstDayOfWeek,
          );
          onFocusChange(addDays(weekStart, 6));
          break;
        }
        case "PageDown":
          if (e.shiftKey) {
            moveYear(focusedDate, 1);
          } else {
            moveMonth(focusedDate, 1);
          }
          break;
        case "PageUp":
          if (e.shiftKey) {
            moveYear(focusedDate, -1);
          } else {
            moveMonth(focusedDate, -1);
          }
          break;
        case "Enter":
        case " ":
          e.preventDefault();
          if (!isDisabled(focusedDate)) {
            onSelect(focusedDate);
          }
          return;
        default:
          handled = false;
      }

      if (handled) {
        e.preventDefault();
      }
    },
    [
      focusedDate,
      firstDayOfWeek,
      moveFocus,
      moveMonth,
      moveYear,
      onSelect,
      isDisabled,
    ],
  );

  /** Focus the active gridcell when focusedDate or month changes */
  useEffect(() => {
    if (gridRef.current) {
      const cellId = `date-cell-${focusedDate.getFullYear()}-${focusedDate.getMonth()}-${focusedDate.getDate()}`;
      const cell = gridRef.current.querySelector<HTMLTableCellElement>(
        `[data-date="${cellId}"]`,
      );
      if (cell) {
        cell.focus();
      }
    }
  }, [focusedDate, monthDate]);

  return (
    <table
      ref={gridRef}
      role="grid"
      aria-label={`Calendar for ${monthDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}`}
      onKeyDown={handleKeyDown}
      style={{ borderCollapse: "collapse", width: "100%" }}
    >
      <thead>
        <tr>
          {WEEKDAY_LABELS.map((label, i) => (
            <th
              key={i}
              scope="col"
              abbr={WEEKDAY_FULL[(firstDayOfWeek + i) % 7]}
              style={{
                padding: "8px 4px",
                textAlign: "center",
                fontSize: "0.75rem",
                fontWeight: 600,
                color: "#6b7280",
                userSelect: "none",
              }}
            >
              {label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: 6 }, (_, weekIdx) => (
          <tr key={weekIdx}>
            {days.slice(weekIdx * 7, weekIdx * 7 + 7).map((day, dayIdx) => {
              const cellIndex = weekIdx * 7 + dayIdx;
              const isCurrentMonth = day.getMonth() === month;
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isFocused = isSameDay(day, focusedDate);
              const isToday = isSameDay(day, new Date());
              const disabled = isDisabled(day);
              const cellId = `date-cell-${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`;
              const fullLabel = day.toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              });

              return (
                <td
                  key={cellIndex}
                  data-date={cellId}
                  role="gridcell"
                  tabIndex={isFocused ? 0 : -1}
                  aria-selected={isSelected || undefined}
                  aria-disabled={disabled || undefined}
                  aria-label={`${fullLabel}${isSelected ? ", selected" : ""}${isToday ? ", today" : ""}`}
                  onClick={() => !disabled && onSelect(day)}
                  style={{
                    padding: 0,
                    textAlign: "center",
                    cursor: disabled ? "default" : "pointer",
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      lineHeight: "36px",
                      margin: "2px auto",
                      borderRadius: "50%",
                      fontSize: "0.875rem",
                      fontWeight: isToday || isSelected ? 600 : 400,
                      color: disabled
                        ? "#d1d5db"
                        : isCurrentMonth
                          ? isSelected
                            ? "#ffffff"
                            : "#111827"
                          : "#9ca3af",
                      background: isSelected
                        ? "#2563eb"
                        : isFocused
                          ? "#eff6ff"
                          : "transparent",
                      outline: isFocused && !isSelected ? "2px solid #2563eb" : "none",
                      outlineOffset: "-2px",
                      opacity: disabled ? 0.5 : 1,
                      userSelect: "none",
                      transition: "background 0.1s, color 0.1s",
                    }}
                  >
                    {day.getDate()}
                  </div>
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
});

// ─── Main Component ───────────────────────────────────────────────────────────

export function DatePicker({
  value,
  onChange,
  min,
  max,
  label = "Date",
  firstDayOfWeek = 0,
  placeholder = "MM/DD/YYYY",
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(
    value ? formatDate(value) : "",
  );
  const [inputError, setInputError] = useState<string | null>(null);
  const [focusedDate, setFocusedDate] = useState<Date>(value ?? new Date());

  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const calendarId = useMemo(() => `datepicker-calendar-${Math.random().toString(36).slice(2, 9)}`, []);
  const inputId = useMemo(() => `datepicker-input-${Math.random().toString(36).slice(2, 9)}`, []);
  const errorId = useMemo(() => `datepicker-error-${Math.random().toString(36).slice(2, 9)}`, []);

  // Sync external value changes to input
  useEffect(() => {
    setInputValue(value ? formatDate(value) : "");
    if (value) setFocusedDate(value);
  }, [value?.getTime()]);

  // Current month for the calendar (derived from focused date)
  const monthDate = useMemo(
    () => startOfMonth(focusedDate),
    [focusedDate.getFullYear(), focusedDate.getMonth()],
  );

  // ─── Open / Close ─────────────────────────────────────────────────────

  const open = useCallback(() => {
    setIsOpen(true);
    setFocusedDate(value ?? new Date());
  }, [value?.getTime()]);

  const close = useCallback(() => {
    setIsOpen(false);
    // Return focus to trigger
    requestAnimationFrame(() => {
      triggerRef.current?.focus();
    });
  }, []);

  // ─── Date Selection ───────────────────────────────────────────────────

  const handleSelect = useCallback(
    (date: Date) => {
      onChange(date);
      setInputValue(formatDate(date));
      setInputError(null);
      close();
    },
    [onChange, close],
  );

  // ─── Manual Input ─────────────────────────────────────────────────────

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      setInputValue(raw);
      setInputError(null);

      // Try parsing as user types (only complete dates)
      const parsed = parseDate(raw);
      if (parsed) {
        const clamped = clampDate(parsed, min, max);
        setFocusedDate(clamped);
        onChange(clamped);
      }
    },
    [onChange, min?.getTime(), max?.getTime()],
  );

  const handleInputBlur = useCallback(() => {
    const trimmed = inputValue.trim();
    if (!trimmed) {
      setInputError(null);
      return;
    }
    const parsed = parseDate(trimmed);
    if (!parsed) {
      setInputError("Invalid date format. Use MM/DD/YYYY.");
      return;
    }
    const clamped = clampDate(parsed, min, max);
    if (clamped.getTime() !== parsed.getTime()) {
      setInputError("Date is outside the allowed range.");
    } else {
      setInputError(null);
    }
  }, [inputValue, min?.getTime(), max?.getTime()]);

  const handleInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const parsed = parseDate(inputValue.trim());
        if (parsed) {
          const clamped = clampDate(parsed, min, max);
          onChange(clamped);
          setInputValue(formatDate(clamped));
          setInputError(null);
          close();
        } else {
          setInputError("Invalid date format. Use MM/DD/YYYY.");
        }
      }
      if (e.key === "Escape" && isOpen) {
        close();
      }
    },
    [inputValue, onChange, min?.getTime(), max?.getTime(), isOpen, close],
  );

  // ─── Click Outside ────────────────────────────────────────────────────

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        close();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, close]);

  // ─── Today Button ─────────────────────────────────────────────────────

  const today = new Date();
  const todayDisabled = (min && isBefore(today, min)) || (max && isAfter(today, max));

  const handleToday = useCallback(() => {
    const clamped = clampDate(today, min, max);
    setFocusedDate(clamped);
    onSelect(clamped);
  }, [min?.getTime(), max?.getTime()]);

  function onSelect(date: Date) {
    onChange(date);
    setInputValue(formatDate(date));
    setInputError(null);
    close();
  }

  // ─── Month Navigation ─────────────────────────────────────────────────

  const goToPrevMonth = useCallback(() => {
    setFocusedDate((prev) => addMonths(prev, -1));
  }, []);

  const goToNextMonth = useCallback(() => {
    setFocusedDate((prev) => addMonths(prev, 1));
  }, []);

  // ─── Render ───────────────────────────────────────────────────────────

  return (
    <div ref={wrapperRef} style={{ position: "relative", display: "inline-block", fontFamily: "system-ui, sans-serif" }}>
      {/* Label */}
      <label
        htmlFor={inputId}
        style={{
          display: "block",
          marginBottom: 4,
          fontSize: "0.875rem",
          fontWeight: 500,
          color: "#374151",
        }}
      >
        {label}
      </label>

      {/* Input + Trigger Row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          border: `1px solid ${inputError ? "#ef4444" : "#d1d5db"}`,
          borderRadius: 6,
          overflow: "hidden",
          background: "#fff",
          boxShadow: isOpen ? "0 0 0 2px #2563eb20" : "none",
        }}
      >
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onKeyDown={handleInputKeyDown}
          placeholder={placeholder}
          aria-invalid={inputError ? true : undefined}
          aria-describedby={inputError ? errorId : undefined}
          aria-expanded={isOpen}
          aria-haspopup="dialog"
          aria-controls={isOpen ? calendarId : undefined}
          style={{
            flex: 1,
            border: "none",
            outline: "none",
            padding: "10px 12px",
            fontSize: "0.875rem",
            color: "#111827",
            background: "transparent",
            minWidth: 120,
          }}
        />
        <button
          ref={triggerRef}
          type="button"
          aria-label={value ? `Change date, ${formatDate(value)}` : "Choose date"}
          onClick={() => (isOpen ? close() : open())}
          style={{
            border: "none",
            borderLeft: "1px solid #d1d5db",
            background: "#f9fafb",
            padding: "10px 12px",
            cursor: "pointer",
            fontSize: "1rem",
            color: "#6b7280",
            lineHeight: 1,
          }}
        >
          📅
        </button>
      </div>

      {/* Validation Error */}
      {inputError && (
        <div
          id={errorId}
          role="alert"
          style={{
            marginTop: 4,
            fontSize: "0.75rem",
            color: "#ef4444",
          }}
        >
          {inputError}
        </div>
      )}

      {/* Calendar Popup */}
      {isOpen && (
        <div
          id={calendarId}
          role="dialog"
          aria-modal="true"
          aria-label="Choose date"
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            marginTop: 4,
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
            padding: 12,
            zIndex: 1000,
            width: 320,
          }}
        >
          {/* Month/Year Header with Navigation */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <button
              type="button"
              aria-label="Previous year"
              onClick={() =>
                setFocusedDate((prev) => addYears(prev, -1))
              }
              style={navButtonStyle}
            >
              «
            </button>
            <button
              type="button"
              aria-label="Previous month"
              onClick={goToPrevMonth}
              style={navButtonStyle}
            >
              ‹
            </button>

            {/* Live region for screen readers */}
            <h2
              aria-live="polite"
              style={{
                margin: 0,
                fontSize: "1rem",
                fontWeight: 600,
                color: "#111827",
                flex: 1,
                textAlign: "center",
              }}
            >
              {monthDate.toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </h2>

            <button
              type="button"
              aria-label="Next month"
              onClick={goToNextMonth}
              style={navButtonStyle}
            >
              ›
            </button>
            <button
              type="button"
              aria-label="Next year"
              onClick={() =>
                setFocusedDate((prev) => addYears(prev, 1))
              }
              style={navButtonStyle}
            >
              »
            </button>
          </div>

          {/* Calendar Grid */}
          <CalendarGrid
            monthDate={monthDate}
            selectedDate={value}
            focusedDate={focusedDate}
            min={min}
            max={max}
            firstDayOfWeek={firstDayOfWeek}
            onSelect={handleSelect}
            onFocusChange={setFocusedDate}
          />

          {/* Footer: Today + Close */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 8,
              paddingTop: 8,
              borderTop: "1px solid #e5e7eb",
            }}
          >
            <button
              type="button"
              onClick={handleToday}
              disabled={!!todayDisabled}
              style={{
                padding: "6px 12px",
                fontSize: "0.75rem",
                fontWeight: 500,
                color: todayDisabled ? "#d1d5db" : "#2563eb",
                background: "none",
                border: "none",
                cursor: todayDisabled ? "default" : "pointer",
                borderRadius: 4,
              }}
            >
              Today
            </button>
            <button
              type="button"
              onClick={close}
              style={{
                padding: "6px 12px",
                fontSize: "0.75rem",
                fontWeight: 500,
                color: "#6b7280",
                background: "none",
                border: "1px solid #d1d5db",
                borderRadius: 4,
                cursor: "pointer",
              }}
            >
              Close
            </button>
          </div>

          {/* Keyboard Help (live region, announced to screen readers) */}
          <div
            aria-live="polite"
            style={{
              marginTop: 8,
              fontSize: "0.625rem",
              color: "#9ca3af",
              lineHeight: 1.4,
            }}
          >
            Arrow keys: navigate days · Page Up/Down: change month · Home/End:
            week start/end · Enter: select · Esc: close
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const navButtonStyle: React.CSSProperties = {
  width: 28,
  height: 28,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  border: "none",
  background: "none",
  cursor: "pointer",
  fontSize: "1rem",
  color: "#6b7280",
  borderRadius: 4,
  lineHeight: 1,
};

export default DatePicker;
