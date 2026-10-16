/**
 * Firma e verifica dei token di sessione (JWT HS256).
 * Nessuna dipendenza da DB o da next/headers: utilizzabile anche nel middleware (edge runtime).
 */
import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "cd_session";

export type SessionRole = "paziente" | "medico";

export interface SessionPayload {
  role: SessionRole;
  /** id dell'utente (pazienti.id o medici.id) */
  sub: string;
  /** sessione_versione al momento del login: se nel DB cambia, la sessione non è più valida */
  ver: number;
}

/** Durata della sessione in secondi: paziente 30 giorni, medico 1 giorno */
export const SESSION_MAX_AGE: Record<SessionRole, number> = {
  paziente: 60 * 60 * 24 * 30,
  medico: 60 * 60 * 24,
};

const DEFAULT_SECRET =
  "577a29ea9661b5461f09fad989f488e7cb86a8110268bfb7180d116d3112efa6";

function getKey(): Uint8Array {
  const secret =
    process.env.SESSION_SECRET ||
    (process.env.TURSO_AUTH_TOKEN && process.env.TURSO_AUTH_TOKEN.length >= 32
      ? process.env.TURSO_AUTH_TOKEN
      : DEFAULT_SECRET);
  return new TextEncoder().encode(secret);
}

export async function signToken(payload: SessionPayload, maxAgeSeconds: number): Promise<string> {
  return new SignJWT({ role: payload.role, ver: payload.ver })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${maxAgeSeconds}s`)
    .sign(getKey());
}

export async function verifyToken(token: string | undefined | null): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getKey(), { algorithms: ["HS256"] });
    const role = payload.role;
    if ((role !== "paziente" && role !== "medico") || typeof payload.sub !== "string") return null;
    return { role, sub: payload.sub, ver: Number(payload.ver ?? 0) };
  } catch {
    return null;
  }
}

/** Firma un piccolo payload generico a breve scadenza (usato per le challenge WebAuthn). */
export async function signShortLived(data: Record<string, unknown>, maxAgeSeconds: number): Promise<string> {
  return new SignJWT(data)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${maxAgeSeconds}s`)
    .sign(getKey());
}

export async function verifyShortLived<T extends Record<string, unknown>>(token: string | undefined): Promise<T | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getKey(), { algorithms: ["HS256"] });
    return payload as unknown as T;
  } catch {
    return null;
  }
}
