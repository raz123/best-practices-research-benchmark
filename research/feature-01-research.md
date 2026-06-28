# Research: React Date Picker with ARIA & Keyboard Navigation

## Task Type: feature
## Date: 2026-06-28

---

## 1. ARIA Grid Pattern (W3C APG)

The authoritative pattern is the **Date Picker Dialog** from WAI-ARIA Authoring Practices Guide:
- Calendar renders as `role="grid"` on a `<table>` element
- Rows use `<tr>` (implicit `row` role), headers use `<th>` (implicit `columnheader`), days use `<td>` or `<button>` (implicit `gridcell`)
- Only ONE gridcell has `tabindex="0"` at a time (roving tabindex); all others use `tabindex="-1"`
- `aria-selected="true"` on the currently selected cell only
- Grid labeled via `aria-labelledby` pointing to the month/year heading
- Month/year heading uses `aria-live="polite"` so screen readers announce month changes
- Dialog wrapper: `role="dialog"`, `aria-modal="true"`, `aria-label="Choose Date"`

**Source:** https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/examples/datepicker-dialog/

## 2. Keyboard Navigation (W3C APG Spec)

| Key | Action |
|-----|--------|
| ArrowRight | Next day |
| ArrowLeft | Previous day |
| ArrowDown | Same day next week (+7 days) |
| ArrowUp | Same day previous week (-7 days) |
| Home | First day of current week |
| End | Last day of current week |
| PageDown | Next month, same day-of-month (clamp to last day) |
| PageUp | Previous month, same day-of-month (clamp to last day) |
| Shift+PageDown | Next year, same day-of-month |
| Shift+PageUp | Previous year, same day-of-month |
| Enter / Space | Select focused date, close dialog |
| Escape | Close dialog without selecting |

**Key detail:** When navigating months, if the target day doesn't exist (e.g., Feb 31), focus moves to the **last day** of that month.

## 3. Focus Management

- **On open:** Focus moves to the selected date if one exists; otherwise to today's date
- **After selection:** Focus returns to the trigger button/input
- **Roving tabindex:** Only the focused gridcell is in the Tab sequence; arrow keys move between cells
- **Trap focus** within the modal dialog while open (Tab cycles through: prev-year → prev-month → grid → next-month → next-year → cancel → ok)

## 4. Anti-Patterns to Avoid

- **Don't** use `role="button"` on every day cell inside a grid — the grid pattern uses implicit gridcell semantics
- **Don't** put all cells in the Tab sequence — use roving tabindex (one `tabindex="0"`, rest `tabindex="-1"`)
- **Don't** forget `aria-live` on the month/year heading — screen readers won't announce month changes
- **Don't** use `aria-selected` on non-selected cells — only the selected cell gets it
- **Don't** skip the `abbr` attribute on abbreviated day-of-week headers — screen readers need full names
- **Don't** forget to restore focus to the trigger after closing the dialog
- **Don't** create date objects in render loops without memoization — expensive for 42-cell grids

## 5. Performance Considerations

- Memoize calendar grid renders with `React.memo` or `useMemo` for the 42-cell grid
- Pre-compute date arrays rather than recalculating on every keystroke
- Use `useCallback` for keyboard handlers to prevent child re-renders
- Avoid unnecessary `Date` object creation — store focused date as a string key or year/month/day tuple internally
- The grid re-renders on every arrow key press; ensure only the affected cells update

## 6. TypeScript Patterns

- Define a `DatePickerProps` interface with: `value`, `onChange`, `min?`, `max?`, `locale?`, `firstDayOfWeek?`, `label?`
- Use discriminated unions for internal state: `{ isOpen: boolean; focusedDate: Date }`
- Export the component as a named export for tree-shaking
- Keep date utility functions pure and separate from the component

## 7. Manual Input with Validation

- Provide a text input that accepts date strings in a configurable format (default: `MM/DD/YYYY`)
- Validate on blur or Enter key press
- Show inline validation error for invalid dates
- On valid input, update the calendar to show the parsed date's month
- On invalid input, keep the previous valid date and show error state

## 8. Min/Max Date Constraints

- Visually distinguish disabled dates (greyed out, reduced opacity)
- `aria-disabled="true"` on disabled cells
- Arrow key navigation should skip over disabled dates or stop at boundaries
- PageUp/PageDown should not navigate past min/max boundaries
- Today button should be disabled if today falls outside min/max range

## 9. Testing Strategy

- Unit test date utility functions (addDays, isSameDay, getDaysInMonth, etc.)
- Test keyboard navigation by simulating key events and asserting focused date
- Test ARIA attributes via `toHaveAttribute` assertions
- Test min/max boundary behavior
- Test manual input validation (valid date, invalid date, empty, boundary dates)
- Test focus management (open → focus grid, close → focus trigger)

## 10. Key Implementation Decisions

1. **Dialog vs inline calendar:** Use a dialog pattern (popup) — matches W3C APG example, better UX for forms
2. **Controlled component:** Parent owns state via `value`/`onChange` — standard React pattern
3. **No external dependencies:** Pure React + TypeScript, no date-fns or lodash
4. **Roving tabindex:** Implement manually per W3C spec — essential for screen reader compatibility
5. **Month/year navigation:** Include prev/next month buttons AND PageUp/PageDown keyboard shortcuts
6. **Today button:** Quick-jump to current date, standard UX expectation
