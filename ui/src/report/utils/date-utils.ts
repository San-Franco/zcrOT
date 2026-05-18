import { format, isValid, parseISO } from 'date-fns';

function parseReportDate(value: string): Date | null {
  if (!value) return null;

  const isoParsed = parseISO(value);
  if (isValid(isoParsed)) {
    return isoParsed;
  }

  const fallback = new Date(value);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
}

/**
 * Format a date to ISO date string (YYYY-MM-DD).
 */
function formatToDateOnly(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format a date to ISO datetime string with Bangkok timezone offset (+07:00).
 * Used for end-of-day boundaries.
 */
function formatToEndOfDayISO(date: Date): string {
  // Bangkok is UTC+7
  const bangkokOffset = 7 * 60; // in minutes
  const localOffset = date.getTimezoneOffset(); // local offset in minutes (negative for ahead of UTC)
  const offsetDiff = bangkokOffset + localOffset;

  // Adjust date to Bangkok time
  const bangkokDate = new Date(date.getTime() + offsetDiff * 60 * 1000);

  const year = bangkokDate.getFullYear();
  const month = String(bangkokDate.getMonth() + 1).padStart(2, '0');
  const day = String(bangkokDate.getDate()).padStart(2, '0');

  // End of day: 23:59:59
  return `${year}-${month}-${day}T23:59:59+07:00`;
}

/**
 * Format a date to start of day in Bangkok timezone.
 */
function formatToStartOfDayISO(date: Date): string {
  // Bangkok is UTC+7
  const bangkokOffset = 7 * 60; // in minutes
  const localOffset = date.getTimezoneOffset(); // local offset in minutes (negative for ahead of UTC)
  const offsetDiff = bangkokOffset + localOffset;

  // Adjust date to Bangkok time
  const bangkokDate = new Date(date.getTime() + offsetDiff * 60 * 1000);

  const year = bangkokDate.getFullYear();
  const month = String(bangkokDate.getMonth() + 1).padStart(2, '0');
  const day = String(bangkokDate.getDate()).padStart(2, '0');

  // Start of day: 00:00:00
  return `${year}-${month}-${day}T00:00:00+07:00`;
}

export function formatReportDate(value: string, pattern: string): string {
  const parsed = parseReportDate(value);
  return parsed ? format(parsed, pattern) : value;
}

export function toDateTimeLocalInput(value: string): string {
  const parsed = parseReportDate(value);
  return parsed ? format(parsed, "yyyy-MM-dd'T'HH:mm") : value;
}

export function toReportDateOnly(value: string): string {
  const parsed = parseReportDate(value);
  return parsed ? formatToDateOnly(parsed) : value;
}

/**
 * Convert to report date range: start of day for startDate, end of day for endDate.
 */
export function toReportDateRange(startDate: string, endDate: string): { start: string; end: string } {
  const startParsed = parseReportDate(startDate);
  const endParsed = parseReportDate(endDate);

  return {
    start: startParsed ? formatToStartOfDayISO(startParsed) : startDate,
    end: endParsed ? formatToEndOfDayISO(endParsed) : endDate,
  };
}

// Deprecated: Use toReportDateRange instead
export function toReportDateTime(value: string): string {
  const parsed = parseReportDate(value);
  return parsed ? formatToStartOfDayISO(parsed) : value;
}
