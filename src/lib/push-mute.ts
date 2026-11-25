const ROME_TZ = "Europe/Rome";

export type NotificationMuteMode = "active" | "8h" | "24h" | "forever";

export interface NotificationMuteState {
  mode: NotificationMuteMode;
  muteUntil: string | null;
  isMuted: boolean;
}

const VALID_MUTE_MODES = new Set<string>(["active", "8h", "24h", "forever"]);

export function isValidMuteMode(value: unknown): value is NotificationMuteMode {
  return typeof value === "string" && VALID_MUTE_MODES.has(value);
}

/**
 * Calcola il timestamp ISO di fine silenzioso per la modalità scelta.
 */
export function computeMuteUntil(
  mode: NotificationMuteMode,
  nowMs: number = Date.now()
): string | null {
  if (mode === "8h") {
    return new Date(nowMs + 8 * 60 * 60 * 1000).toISOString();
  }
  if (mode === "24h") {
    return new Date(nowMs + 24 * 60 * 60 * 1000).toISOString();
  }
  return null;
}

/**
 * Risolve lo stato effettivo delle notifiche considerando scadenze temporanee (8h / 24h).
 */
export function resolveMuteState(
  mode?: string | null,
  muteUntil?: string | null,
  nowMs: number = Date.now()
): NotificationMuteState {
  if (mode === "forever") {
    return { mode: "forever", muteUntil: null, isMuted: true };
  }

  if ((mode === "8h" || mode === "24h") && muteUntil) {
    const ts = Date.parse(muteUntil);
    if (Number.isFinite(ts) && ts > nowMs) {
      return { mode, muteUntil, isMuted: true };
    }
  }

  return { mode: "active", muteUntil: null, isMuted: false };
}

function getRomeCalendarKey(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: ROME_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/**
 * Formatta l'orario di fine silenzioso in italiano leggibile (fuso Europe/Rome).
 */
export function formatMuteUntilItalian(iso: string): string {
  const ts = Date.parse(iso);
  if (!Number.isFinite(ts)) return iso;

  const targetDate = new Date(ts);
  const nowDate = new Date();
  const todayKey = getRomeCalendarKey(nowDate);
  const [y, m, d] = todayKey.split("-").map(Number);
  const tomorrowKey = new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10);
  const targetKey = getRomeCalendarKey(targetDate);

  const timeParts = new Intl.DateTimeFormat("it-IT", {
    timeZone: ROME_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(targetDate);
  const hour = (timeParts.find((p) => p.type === "hour")?.value ?? "00").padStart(2, "0");
  const minute = (timeParts.find((p) => p.type === "minute")?.value ?? "00").padStart(2, "0");
  const timeStr = `${hour === "24" ? "00" : hour}:${minute}`;

  if (targetKey === todayKey) {
    return `oggi alle ${timeStr}`;
  }
  if (targetKey === tomorrowKey) {
    return `domani alle ${timeStr}`;
  }

  const dayMonthStr = new Intl.DateTimeFormat("it-IT", {
    timeZone: ROME_TZ,
    day: "numeric",
    month: "short",
  }).format(targetDate);
  return `${dayMonthStr} alle ${timeStr}`;
}
