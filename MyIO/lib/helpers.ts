/**
 * lib/helpers.ts — Common helpers for the whole project.
 * Date/time: parse and format via dayjs. Currency/numbers: formatAmount.
 */

import dayjs, { type Dayjs } from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

// ---------------------------------------------------------------------------
// Date/time: parse (string | Date | Dayjs -> Dayjs | null)
// ---------------------------------------------------------------------------

/**
 * Parse a value to a Dayjs instance. Accepts ISO string, Date, or Dayjs.
 * Returns null for invalid or missing input.
 */
export function parseDate(input: string | Date | Dayjs | null | undefined): Dayjs | null {
  if (input == null) return null;
  if (dayjs.isDayjs(input)) return input;
  const d = dayjs(input);
  return d.isValid() ? d : null;
}

/**
 * Alias for parseDate. Use when the value is a full datetime (e.g. created_at, transaction_date).
 */
export const parseDateTime = parseDate;

// ---------------------------------------------------------------------------
// Date/time: format for display (Dayjs | string -> string)
// ---------------------------------------------------------------------------

/** Display: DD/MM/YYYY (e.g. 12/03/2022) */
export function formatDate(value: string | Date | Dayjs | null | undefined): string {
  const d = parseDate(value);
  return d ? d.format('DD/MM/YYYY') : '';
}

/** Display: HH:mm (e.g. 14:30) */
export function formatTime(value: string | Date | Dayjs | null | undefined): string {
  const d = parseDate(value);
  return d ? d.format('HH:mm') : '';
}

/** Display: DD/MM/YYYY HH:mm */
export function formatDateTime(value: string | Date | Dayjs | null | undefined): string {
  const d = parseDate(value);
  return d ? d.format('DD/MM/YYYY HH:mm') : '';
}

/** Display: short date for lists (e.g. 12 Mar 2022) */
export function formatDateShort(value: string | Date | Dayjs | null | undefined): string {
  const d = parseDate(value);
  return d ? d.format('DD MMM YYYY') : '';
}

/** Display: relative (e.g. "2 days ago", "today") */
export function formatRelative(value: string | Date | Dayjs | null | undefined): string {
  const d = parseDate(value);
  return d ? d.fromNow() : '';
}

/** Alias for formatDate — transaction date display (DD/MM/YYYY). */
export const formatTransactionDate = formatDate;

// ---------------------------------------------------------------------------
// Date/time: format for API (ISO strings for Supabase)
// ---------------------------------------------------------------------------

/** API: YYYY-MM-DD (date only, for transaction_date, fromDate, toDate) */
export function toISODateString(value: string | Date | Dayjs | null | undefined): string {
  const d = parseDate(value);
  return d ? d.format('YYYY-MM-DD') : '';
}

/** API: full ISO 8601 (e.g. for updated_at, created_at) */
export function toISODateTimeString(value: string | Date | Dayjs | null | undefined): string {
  const d = parseDate(value);
  return d ? d.toISOString() : '';
}

/** Current time as ISO string (e.g. for updated_at) */
export function nowISO(): string {
  return dayjs().toISOString();
}

/** Start of today, ISO (for fromDate queries) */
export function todayStartISO(): string {
  return dayjs().startOf('day').toISOString();
}

/** End of today, ISO (for toDate queries) */
export function todayEndISO(): string {
  return dayjs().endOf('day').toISOString();
}

/** Start of current month, ISO */
export function startOfMonthISO(value?: string | Date | Dayjs): string {
  const d = value != null ? parseDate(value) : dayjs();
  return (d ?? dayjs()).startOf('month').toISOString();
}

/** End of current month, ISO */
export function endOfMonthISO(value?: string | Date | Dayjs): string {
  const d = value != null ? parseDate(value) : dayjs();
  return (d ?? dayjs()).endOf('month').toISOString();
}

/** Start of day, date only YYYY-MM-DD (for Supabase date columns) */
export function startOfDayDateString(value?: string | Date | Dayjs): string {
  const d = value != null ? parseDate(value) : dayjs();
  return (d ?? dayjs()).startOf('day').format('YYYY-MM-DD');
}

/** End of day, date only YYYY-MM-DD */
export function endOfDayDateString(value?: string | Date | Dayjs): string {
  const d = value != null ? parseDate(value) : dayjs();
  return (d ?? dayjs()).endOf('day').format('YYYY-MM-DD');
}

// ---------------------------------------------------------------------------
// Date/time: predicates
// ---------------------------------------------------------------------------

export function isToday(value: string | Date | Dayjs | null | undefined): boolean {
  const d = parseDate(value);
  return d ? d.isSame(dayjs(), 'day') : false;
}

export function isPast(value: string | Date | Dayjs | null | undefined): boolean {
  const d = parseDate(value);
  return d ? d.isBefore(dayjs()) : false;
}

export function isFuture(value: string | Date | Dayjs | null | undefined): boolean {
  const d = parseDate(value);
  return d ? d.isAfter(dayjs()) : false;
}

// ---------------------------------------------------------------------------
// Currency / numbers (project-wide)
// ---------------------------------------------------------------------------

/**
 * Format a monetary amount with symbol and space-separated thousands.
 * Uses absolute value; caller should add + / − for sign.
 */
export function formatAmount(value: number, symbol: string): string {
  const abs = Math.abs(value);
  const formatted = abs.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${symbol} ${formatted.replace(/,/g, ' ')}`;
}
