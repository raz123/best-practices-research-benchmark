import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface DatePickerProps {
  /** Currently selected date (controlled) */
  value?: Date | null;
  /** Callback when a date is selected */
  onChange?: (date: Date | null) => void;
  /** Minimum selectable date */
  minDate?: Date;
  /** Maximum selectable date */
  maxDate?: Date;
  /** Placeholder for the manual input field */
  placeholder?: string;
  /** Date format string for manual input (default: "MM/DD/YYYY") */
  inputFormat?: string;
  /** Whether the entire picker is disabled */
  disabled?: boolean;
  /** Accessible label for the date picker */
  ariaLabel?: string;
}

interface CalendarCell {
  date: Date;
  dayOfMonth: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  isDisabled: boolean;
}

// ── Utility helpers ────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const WEEKDAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const WEEKDAY_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

function startOfWeek(d: Date): Date {
  const result = new Date(d);
  result.setDate(result.getDate() - result.getDay());
  return result;
}

function addDays(d: Date, days: number): Date {
  const result = new Date(d);
  result.setDate(result.getDate() + days);
  return result;
}

function addMonths(d: Date, months: number): Date {
  const result = new Date(d);
  result.setMonth(result.getMonth() + months);
  return result;
}

function addYears(d: Date, years: number): Date {
  const result = new Date(d);
  result.setFullYear(result.getFullYear() + years);
  return result;
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isDateBetween(date: Date, min: Date | undefined, max: Date | undefined): boolean {
  if (min && date < startOfDay(min)) return false;
  if (max && date > startOfDay(max)) return false;
  return true;
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function isToday(d: Date): boolean {
  return sameDay(d, new Date());
}

/** Format a Date to MM/DD/YYYY */
function formatDate(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
}

/** Parse MM/DD/YYYY or MM-DD-YYYY to Date | null */
function parseDateInput(input: string): Date | null {
  const match = input.match(/^(\d{1,2})[/\-](\d{1,2})[/\-](\d{4})$/);
  if (!match) return null;
  const [, mm, dd, yyyy] = match;
  const month = parseInt(mm, 10) - 1;
  const day = parseInt(dd, 10);
  const year = parseInt(yyyy, 10);
  if (month < 0 || month > 11) return null;
  if (day < 1 || day > 31) return null;
  const date = new Date(year, month, day);
  // Guard against overflow (e.g. Feb 30 → Mar 2)
  if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) return null;
  return date;
}

// ── Keyboard navigation constants ──────────────────────────────────────────────

const KEY = {
  LEFT: 'ArrowLeft',
  RIGHT: 'ArrowRight',
  UP: 'ArrowUp',
  DOWN: 'ArrowDown',
  HOME: 'Home',
  END: 'End',
  PAGE_UP: 'PageUp',
  PAGE_DOWN: 'PageDown',
  ENTER: 'Enter',
  SPACE: ' ',
  ESCAPE: 'Escape',
} as const;

// ── Calendar grid builder ──────────────────────────────────────────────────────

function buildCalendarGrid(
  viewMonth: Date,
  selectedDate: Date | null,
  minDate: Date | undefined,
  maxDate: Date | undefined,
): CalendarCell[] {
  const monthStart = startOfMonth(viewMonth);
  const calStart = startOfWeek(monthStart);

  // We always render 6 weeks (42 cells) for a stable grid
  const cells: CalendarCell[] = [];
  for (let i = 0; i < 42; i++) {
    const date = addDays(calStart, i);
    const inMonth = date.getMonth() === viewMonth.getMonth();
    cells.push({
      date,
      dayOfMonth: date.getDate(),
      isCurrentMonth: inMonth,
      isToday: isToday(date),
      isSelected: selectedDate ? sameDay(date, selectedDate) : false,
      isDisabled: !isDateBetween(date, minDate, maxDate),
    });
  }
  return cells;
}

// ── Component ──────────────────────────────────────────────────────────────────

export const DatePicker: React.FC<DatePickerProps> = ({
  value = null,
  onChange,
  minDate,
  maxDate,
  placeholder = 'MM/DD/YYYY',
  disabled = false,
  ariaLabel = 'Date picker',
}) => {
  const today = useMemo(() => startOfDay(new Date()), []);

  // Calendar view state (which month we're looking at)
  const [viewMonth, setViewMonth] = useState<Date>(() =>
    startOfMonth(value ?? today),
  );

  // Keyboard focus position (the cell the user is "on" in grid navigation)
  const [focusDate, setFocusDate] = useState<Date | null>(() => value ?? today);

  const [isOpen, setIsOpen] = useState(false);

  // Manual input state
  const [inputValue, setInputValue] = useState(value ? formatDate(value) : '');
  const [inputError, setInputError] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const gridRef = useRef<HTMLTableElement>(null);

  // Sync input when value prop changes
  useEffect(() => {
    setInputValue(value ? formatDate(value) : '');
    setInputError(false);
  }, [value]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  // ── Derived state ──────────────────────────────────────────────────────────

  const cells = useMemo(
    () => buildCalendarGrid(viewMonth, value, minDate, maxDate),
    [viewMonth, value, minDate, maxDate],
  );

  const gridLabel = `${MONTH_NAMES[viewMonth.getMonth()]} ${viewMonth.getFullYear()}`;

  // ── Handlers ───────────────────────────────────────────────────────────────

  const selectDate = useCallback(
    (date: Date) => {
      if (!isDateBetween(date, minDate, maxDate)) return;
      onChange?.(date);
      setIsOpen(false);
      setInputValue(formatDate(date));
      setInputError(false);
    },
    [onChange, minDate, maxDate],
  );

  const goToToday = useCallback(() => {
    const t = startOfDay(new Date());
    setViewMonth(startOfMonth(t));
    setFocusDate(t);
  }, []);

  const navigateMonth = useCallback(
    (delta: number) => {
      setViewMonth((prev) => {
        const next = addMonths(prev, delta);
        // If navigating past min/max, clamp the view
        if (minDate) {
          const minMonth = startOfMonth(minDate);
          if (startOfMonth(next) < minMonth) return minMonth;
        }
        if (maxDate) {
          const maxMonth = startOfMonth(maxDate);
          if (startOfMonth(next) > maxMonth) return maxMonth;
        }
        return next;
      });
    },
    [minDate, maxDate],
  );

  const navigateYear = useCallback(
    (delta: number) => {
      setViewMonth((prev) => {
        const next = addYears(prev, delta);
        if (minDate) {
          const minMonth = startOfMonth(minDate);
          if (startOfMonth(next) < minMonth) return minMonth;
        }
        if (maxDate) {
          const maxMonth = startOfMonth(maxDate);
          if (startOfMonth(next) > maxMonth) return maxMonth;
        }
        return next;
      });
    },
    [minDate, maxDate],
  );

  /** Focus and potentially select a new date within the grid */
  const moveFocus = useCallback(
    (newDate: Date) => {
      // Clamp to min/max
      if (!isDateBetween(newDate, minDate, maxDate)) return;
      setFocusDate(newDate);
      // If the new date is in a different month, shift view
      if (newDate.getMonth() !== viewMonth.getMonth() || newDate.getFullYear() !== viewMonth.getFullYear()) {
        setViewMonth(startOfMonth(newDate));
      }
    },
    [viewMonth, minDate, maxDate],
  );

  const handleGridKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const current = focusDate ?? today;
      let newDate: Date | null = null;

      switch (e.key) {
        case KEY.LEFT:
          e.preventDefault();
          newDate = addDays(current, -1);
          break;
        case KEY.RIGHT:
          e.preventDefault();
          newDate = addDays(current, 1);
          break;
        case KEY.UP:
          e.preventDefault();
          newDate = addDays(current, -7);
          break;
        case KEY.DOWN:
          e.preventDefault();
          newDate = addDays(current, 7);
          break;
        case KEY.HOME:
          e.preventDefault();
          newDate = startOfWeek(startOfMonth(viewMonth));
          break;
        case KEY.END: {
          e.preventDefault();
          // End of the current grid week-row isn't well-defined; go to end of month
          newDate = endOfMonth(viewMonth);
          break;
        }
        case KEY.PAGE_UP:
          e.preventDefault();
          if (e.shiftKey) {
            newDate = addYears(current, -1);
          } else {
            newDate = addMonths(current, -1);
          }
          break;
        case KEY.PAGE_DOWN:
          e.preventDefault();
          if (e.shiftKey) {
            newDate = addYears(current, 1);
          } else {
            newDate = addMonths(current, 1);
          }
          break;
        case KEY.ENTER:
        case KEY.SPACE:
          e.preventDefault();
          if (current && isDateBetween(current, minDate, maxDate)) {
            selectDate(current);
          }
          return;
        case KEY.ESCAPE:
          e.preventDefault();
          setIsOpen(false);
          inputRef.current?.focus();
          return;
        default:
          return;
      }

      if (newDate) {
        moveFocus(newDate);
      }
    },
    [focusDate, today, viewMonth, minDate, maxDate, selectDate, moveFocus],
  );

  const handleInputKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === KEY.ENTER) {
        e.preventDefault();
        const parsed = parseDateInput(inputValue);
        if (parsed && isDateBetween(parsed, minDate, maxDate)) {
          onChange?.(parsed);
          setInputError(false);
          setViewMonth(startOfMonth(parsed));
          setFocusDate(parsed);
          setIsOpen(false);
        } else {
          setInputError(true);
        }
      } else if (e.key === KEY.ESCAPE) {
        setIsOpen(false);
      } else if (e.key === KEY.DOWN && !isOpen) {
        e.preventDefault();
        setIsOpen(true);
      }
    },
    [inputValue, minDate, maxDate, onChange, isOpen],
  );

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setInputError(false);
  }, []);

  const handleInputFocus = useCallback(() => {
    if (!disabled) {
      setIsOpen(true);
    }
  }, [disabled]);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div
      ref={containerRef}
      className="omp-datepicker"
      style={{ position: 'relative', display: 'inline-block', fontFamily: 'system-ui, sans-serif' }}
    >
      {/* Input field */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="dialog"
          aria-label={ariaLabel}
          aria-invalid={inputError || undefined}
          aria-describedby={inputError ? 'datepicker-input-error' : undefined}
          placeholder={placeholder}
          value={inputValue}
          disabled={disabled}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleInputKeyDown}
          style={{
            padding: '8px 32px 8px 12px',
            border: `1px solid ${inputError ? '#dc3545' : '#6c757d'}`,
            borderRadius: 4,
            fontSize: 14,
            width: 140,
            outline: 'none',
            ...(disabled ? { opacity: 0.5, cursor: 'not-allowed' } : {}),
          }}
        />
        {!disabled && (
          <button
            type="button"
            aria-label="Open calendar"
            onClick={() => setIsOpen((o) => !o)}
            style={{
              position: 'absolute',
              right: 4,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 16,
              padding: '4px 6px',
            }}
          >
            📅
          </button>
        )}
      </div>

      {inputError && (
        <div
          id="datepicker-input-error"
          role="alert"
          style={{ color: '#dc3545', fontSize: 12, marginTop: 4 }}
        >
          Invalid date. Use MM/DD/YYYY format.
        </div>
      )}

      {/* Calendar dropdown */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Choose date"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            marginTop: 4,
            zIndex: 1000,
            background: '#fff',
            border: '1px solid #dee2e6',
            borderRadius: 8,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            padding: 12,
            width: 290,
            userSelect: 'none',
          }}
        >
          {/* Navigation header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 8,
            }}
          >
            <button
              type="button"
              aria-label="Previous year"
              disabled={disabled}
              onClick={() => navigateYear(-1)}
              style={navBtnStyle}
              title="Previous year"
            >
              «
            </button>
            <button
              type="button"
              aria-label="Previous month"
              disabled={disabled}
              onClick={() => navigateMonth(-1)}
              style={navBtnStyle}
              title="Previous month"
            >
              ‹
            </button>

            <span
              style={{ fontWeight: 600, fontSize: 14, minWidth: 140, textAlign: 'center' }}
              aria-live="polite"
            >
              {gridLabel}
            </span>

            <button
              type="button"
              aria-label="Next month"
              disabled={disabled}
              onClick={() => navigateMonth(1)}
              style={navBtnStyle}
              title="Next month"
            >
              ›
            </button>
            <button
              type="button"
              aria-label="Next year"
              disabled={disabled}
              onClick={() => navigateYear(1)}
              style={navBtnStyle}
              title="Next year"
            >
              »
            </button>
          </div>

          {/* Today button */}
          <div style={{ marginBottom: 8, textAlign: 'center' }}>
            <button
              type="button"
              disabled={disabled}
              onClick={goToToday}
              style={{
                fontSize: 12,
                padding: '2px 10px',
                borderRadius: 4,
                border: '1px solid #6c757d',
                background: '#fff',
                cursor: disabled ? 'not-allowed' : 'pointer',
              }}
            >
              Today
            </button>
          </div>

          {/* Calendar grid */}
          <table
            ref={gridRef}
            role="grid"
            aria-label={gridLabel}
            onKeyDown={handleGridKeyDown}
            style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}
          >
            <thead>
              <tr>
                {WEEKDAY_LABELS.map((label, i) => (
                  <th
                    key={i}
                    scope="col"
                    aria-label={WEEKDAY_FULL[i]}
                    style={{
                      padding: '4px 0',
                      fontSize: 12,
                      fontWeight: 600,
                      color: '#6c757d',
                      textAlign: 'center',
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
                  {cells.slice(weekIdx * 7, weekIdx * 7 + 7).map((cell, dayIdx) => {
                    const weekDay = WEEKDAY_FULL[(weekIdx * 7 + dayIdx) % 7];
                    const label = `${MONTH_NAMES[cell.date.getMonth()]} ${cell.dayOfMonth}, ${cell.date.getFullYear()}, ${weekDay}`;
                    const isFocused = focusDate ? sameDay(cell.date, focusDate) : false;

                    return (
                      <td
                        key={dayIdx}
                        role="gridcell"
                        aria-selected={cell.isSelected}
                        aria-disabled={cell.isDisabled}
                        aria-label={label}
                        tabIndex={isFocused ? 0 : -1}
                        onClick={() => !cell.isDisabled && selectDate(cell.date)}
                        style={{
                          padding: 0,
                          textAlign: 'center',
                          cursor: cell.isDisabled ? 'not-allowed' : 'pointer',
                        }}
                      >
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            fontSize: 13,
                            fontWeight: cell.isToday ? 700 : 400,
                            color: cell.isDisabled
                              ? '#adb5bd'
                              : cell.isCurrentMonth
                                ? '#212529'
                                : '#adb5bd',
                            background: cell.isSelected
                              ? '#0d6efd'
                              : cell.isToday
                                ? '#e9ecef'
                                : 'transparent',
                            outline: isFocused ? '2px solid #0d6efd' : 'none',
                            outlineOffset: -2,
                            textDecoration: cell.isSelected ? 'none' : 'none',
                            ...(cell.isSelected ? { color: '#fff' } : {}),
                          }}
                        >
                          {cell.dayOfMonth}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ── Shared style for navigation buttons ────────────────────────────────────────

const navBtnStyle: React.CSSProperties = {
  background: 'none',
  border: '1px solid #dee2e6',
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: 14,
  fontWeight: 600,
  width: 28,
  height: 28,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
};

export default DatePicker;
