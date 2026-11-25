/**
 * Utility functions for cycle day, calendar date calculations, and Europe/Rome timezone formatting.
 */

const ROME_TZ = "Europe/Rome";

/**
 * Format a Date object to YYYY-MM-DD in local browser/runtime calendar time.
 */
export function formatLocalDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Returns YYYY-MM-DD in Europe/Rome (safe across UTC midnight boundaries and DST transitions).
 */
export function getRomeDateString(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: ROME_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/**
 * Returns HH:MM in Europe/Rome (24-hour clock).
 */
export function getRomeTimeString(date: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("it-IT", {
    timeZone: ROME_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const hour = parts.find((p) => p.type === "hour")?.value ?? "00";
  const minute = parts.find((p) => p.type === "minute")?.value ?? "00";
  return `${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`;
}

/**
 * Returns both YYYY-MM-DD and numeric hour (0..23) in Europe/Rome.
 */
export function getRomeDateAndHour(date: Date = new Date()): { date: string; hour: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: ROME_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const year = parts.find((p) => p.type === "year")?.value ?? "2026";
  const month = parts.find((p) => p.type === "month")?.value ?? "01";
  const day = parts.find((p) => p.type === "day")?.value ?? "01";
  const rawHour = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  const hour = rawHour === 24 ? 0 : rawHour;
  return { date: `${year}-${month}-${day}`, hour };
}

/**
 * Returns YYYY-MM-DD in Europe/Rome offset by N days (negative for past).
 */
export function getRomeDateOffsetString(daysOffset: number, baseDate: Date = new Date()): string {
  const todayRome = getRomeDateString(baseDate);
  const [y, m, d] = todayRome.split("-").map(Number);
  const utcMid = new Date(Date.UTC(y, m - 1, d + daysOffset));
  return utcMid.toISOString().slice(0, 10);
}

/**
 * Formats an ISO/SQLite timestamp or YYYY-MM-DD string into readable Italian date (dd/MM/yyyy).
 */
export function formatItalianDate(isoOrSql?: string | null): string {
  if (!isoOrSql) return "N/D";
  const normalized =
    isoOrSql.includes(" ") && !isoOrSql.includes("T")
      ? isoOrSql.replace(" ", "T") + "Z"
      : isoOrSql;
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) return isoOrSql;
  return new Intl.DateTimeFormat("it-IT", {
    timeZone: ROME_TZ,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parsed);
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

  const diffDays = Math.round((todayMidnight - startMidnight) / (1000 * 60 * 60 * 24));
  const calendarDay = Math.max(1, diffDays + 1);
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
