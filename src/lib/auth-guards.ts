import "server-only";
import { db } from "@/db/index";
import { seedDb } from "@/db/seed";
import { getSession, type Session } from "./session";

export class AuthError extends Error {
  constructor(message = "Non autorizzato. Effettua di nuovo l'accesso.") {
    super(message);
    this.name = "AuthError";
  }
}

type MedicoSession = Extract<Session, { role: "medico" }>;
type PazienteSession = Extract<Session, { role: "paziente" }>;

export async function requireSession(): Promise<Session> {
  await seedDb();
  const s = await getSession();
  if (!s) throw new AuthError();
  return s;
}

export async function requireMedico(): Promise<MedicoSession> {
  const s = await requireSession();
  if (s.role !== "medico") throw new AuthError();
  return s;
}

export async function requirePaziente(): Promise<PazienteSession> {
  const s = await requireSession();
  if (s.role !== "paziente") throw new AuthError();
  return s;
}

/** Il paziente stesso, oppure il medico a cui il paziente è assegnato. */
export async function requireAccessoPaziente(pazienteId: string): Promise<Session> {
  const s = await requireSession();
  if (s.role === "paziente") {
    if (s.id !== pazienteId) throw new AuthError();
    return s;
  }
  await assertPazienteDelMedico(pazienteId, s.id);
  return s;
}

/** Il paziente titolare del ciclo, oppure il medico che lo segue. */
export async function requireAccessoCiclo(cicloId: string): Promise<Session> {
  const s = await requireSession();
  const res = await db.execute({
    sql: "SELECT paziente_id, medico_id FROM cicli WHERE id = ?",
    args: [cicloId],
  });
  if (res.rows.length === 0) throw new AuthError("Ciclo non trovato.");
  const row = res.rows[0];
  if (s.role === "paziente" && String(row.paziente_id) !== s.id) throw new AuthError();
  if (s.role === "medico" && String(row.medico_id) !== s.id) throw new AuthError();
  return s;
}

/** Il paziente titolare della misurazione, oppure il medico che lo segue. */
export async function requireAccessoMisurazione(misurazioneId: string): Promise<Session> {
  const res = await db.execute({
    sql: "SELECT ciclo_id FROM misurazioni WHERE id = ?",
    args: [misurazioneId],
  });
  if (res.rows.length === 0) throw new AuthError("Misurazione non trovata.");
  return requireAccessoCiclo(String(res.rows[0].ciclo_id));
}

export async function assertPazienteDelMedico(pazienteId: string, medicoId: string): Promise<void> {
  const res = await db.execute({
    sql: "SELECT 1 FROM pazienti WHERE id = ? AND medico_id = ?",
    args: [pazienteId, medicoId],
  });
  if (res.rows.length === 0) throw new AuthError();
}
