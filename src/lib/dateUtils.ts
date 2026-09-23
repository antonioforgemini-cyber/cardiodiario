/**
 * Utility functions for cycle day and calendar date calculations.
 * Ensures consistent day computation based on local calendar dates.
 */

/**
 * Format a Date object to YYYY-MM-DD in local time.
 */
export function formatLocalDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Parses an ISO string or Date into a normalized Date object set to 00:00:00 local time.
 */
export function getLocalMidnight(dateOrIso?: string | Date | null): Date {
  const d = dateOrIso ? new Date(dateOrIso) : new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

/**
 * Calculates the current active day of a cycle based on calendar days elapsed since dataInizioEffettiva.
 * Day 1 = start day (regardless of hour).
 * Day 2 = next calendar day (regardless of whether 24 full hours have passed).
 * Also respects any recorded measurements if they exceed the calendar day.
 */
export function calculateCurrentActiveDay(
  dataInizioEffettiva?: string | null,
  totalDays: number = 28,
  maxRecordedDay: number = 1
): number {
  if (!dataInizioEffettiva) {
    return Math.min(Math.max(1, maxRecordedDay), totalDays);
  }

  const startMidnight = getLocalMidnight(dataInizioEffettiva).getTime();
  const todayMidnight = getLocalMidnight(new Date()).getTime();

  // Calendar days difference
  const diffDays = Math.round((todayMidnight - startMidnight) / (1000 * 60 * 60 * 24));
  const calendarDay = Math.max(1, diffDays + 1);

  // If a measurement was recorded for a higher day, at least allow that day
  const effectiveDay = Math.max(calendarDay, maxRecordedDay || 1);

  return Math.min(effectiveDay, totalDays);
}

/**
 * Computes the Date for a specific cycle day number (1-based) given a start date.
 */
export function getDateForCycleDay(dataInizioEffettiva: string | null | undefined, dayNum: number): Date {
  const base = getLocalMidnight(dataInizioEffettiva);
  const result = new Date(base);
  result.setDate(base.getDate() + (dayNum - 1));
  return result;
}
