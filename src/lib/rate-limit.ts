import "server-only";
import { db } from "@/db/index";

const MAX_TENTATIVI = 5;
const FINESTRA_MINUTI = 15;

/** True se la chiave (es. "paz:CODICEFISCALE") ha superato i tentativi falliti consentiti. */
export async function isBloccato(chiave: string): Promise<boolean> {
  const res = await db.execute({
    sql: `SELECT COUNT(*) as n FROM login_tentativi
          WHERE chiave = ? AND created_at > datetime('now', ?)`,
    args: [chiave, `-${FINESTRA_MINUTI} minutes`],
  });
  return Number(res.rows[0]?.n ?? 0) >= MAX_TENTATIVI;
}

export async function registraTentativoFallito(chiave: string): Promise<void> {
  await db.execute({ sql: "INSERT INTO login_tentativi (chiave) VALUES (?)", args: [chiave] });
  // pulizia dei record vecchi
  await db.execute({
    sql: "DELETE FROM login_tentativi WHERE created_at < datetime('now', '-1 day')",
    args: [],
  });
}

export async function azzeraTentativi(chiave: string): Promise<void> {
  await db.execute({ sql: "DELETE FROM login_tentativi WHERE chiave = ?", args: [chiave] });
}

export const MESSAGGIO_BLOCCO = `Troppi tentativi errati. Per sicurezza l'accesso è bloccato per ${FINESTRA_MINUTI} minuti.`;
