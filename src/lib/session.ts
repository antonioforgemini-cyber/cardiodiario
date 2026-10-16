import "server-only";
import { cookies } from "next/headers";
import { db } from "@/db/index";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  signToken,
  verifyToken,
  type SessionPayload,
  type SessionRole,
} from "./session-token";

export type Session =
  | { role: "paziente"; id: string; medicoId: string }
  | { role: "medico"; id: string };

/** Crea la sessione dopo un login riuscito (PIN/password o passkey). */
export async function createSession(role: SessionRole, userId: string): Promise<void> {
  const ver = await getSessionVersion(role, userId);
  if (ver === null) throw new Error("Utente non trovato");
  const maxAge = SESSION_MAX_AGE[role];
  const token = await signToken({ role, sub: userId, ver }, maxAge);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  });
}

export async function destroySession(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}

/**
 * Legge e valida la sessione corrente.
 * Oltre alla firma verifica che l'utente esista ancora e che la sessione_versione coincida
 * (es. dopo "Rigenera PIN" tutte le sessioni precedenti del paziente vengono invalidate).
 */
export async function getSession(): Promise<Session | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const payload: SessionPayload | null = await verifyToken(token);
  if (!payload) return null;

  if (payload.role === "medico") {
    const res = await db.execute({
      sql: "SELECT sessione_versione FROM medici WHERE id = ?",
      args: [payload.sub],
    });
    if (res.rows.length === 0) return null;
    if (Number(res.rows[0].sessione_versione ?? 0) !== payload.ver) return null;
    return { role: "medico", id: payload.sub };
  }

  const res = await db.execute({
    sql: "SELECT sessione_versione, medico_id FROM pazienti WHERE id = ?",
    args: [payload.sub],
  });
  if (res.rows.length === 0) return null;
  if (Number(res.rows[0].sessione_versione ?? 0) !== payload.ver) return null;
  return { role: "paziente", id: payload.sub, medicoId: String(res.rows[0].medico_id) };
}

async function getSessionVersion(role: SessionRole, userId: string): Promise<number | null> {
  const table = role === "medico" ? "medici" : "pazienti";
  const res = await db.execute({
    sql: `SELECT sessione_versione FROM ${table} WHERE id = ?`,
    args: [userId],
  });
  if (res.rows.length === 0) return null;
  return Number(res.rows[0].sessione_versione ?? 0);
}
