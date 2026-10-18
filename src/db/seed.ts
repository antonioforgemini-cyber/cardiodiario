import { db } from "./index";
import { initDb } from "./schema";
import { hashSecret, isHashed } from "@/lib/crypto";

// Evita di rieseguire schema/migrazioni a ogni server action nella stessa istanza
let seedPromise: Promise<void> | null = null;

export async function seedDb() {
  if (!seedPromise) {
    seedPromise = runSeed().catch((e) => {
      seedPromise = null; // riprova alla prossima chiamata
      throw e;
    });
  }
  return seedPromise;
}

async function runSeed() {
  await initDb();

  // Check if Dottoressa Ivana Pariggiano exists
  const existingMed = await db.execute({
    sql: "SELECT id FROM medici WHERE email = 'ivana.pariggiano@libero.it'",
    args: [],
  });

  if (existingMed.rows.length === 0) {
    // Insert Dottoressa Ivana Pariggiano without deleting any existing data
    await db.execute({
      sql: `INSERT OR IGNORE INTO medici (id, nome, cognome, email, password_hash, specializzazione, telefono)
            VALUES ('med-1', 'Ivana', 'Pariggiano', 'ivana.pariggiano@libero.it', 'PasswordTemp', 'Specialista in Cardiologia', '')`,
      args: [],
    });
  } else {
    // Update specializzazione if it still references A.O. or Caserta
    await db.execute({
      sql: `UPDATE medici
            SET specializzazione = 'Specialista in Cardiologia'
            WHERE (specializzazione LIKE '%Caserta%' OR specializzazione LIKE '%A.O.%' OR specializzazione LIKE '%A.O %')`,
      args: [],
    });
  }

  await migratePlaintextSecrets();
}

/**
 * Migrazione una tantum: converte in hash bcrypt PIN e password ancora salvati in chiaro.
 * Gli utenti continuano ad accedere con le stesse credenziali.
 */
async function migratePlaintextSecrets() {
  const medici = await db.execute("SELECT id, password_hash FROM medici WHERE password_hash NOT LIKE '$2%'");
  for (const m of medici.rows) {
    const value = String(m.password_hash);
    if (isHashed(value)) continue;
    await db.execute({
      sql: "UPDATE medici SET password_hash = ? WHERE id = ?",
      args: [await hashSecret(value), String(m.id)],
    });
  }

  const pazienti = await db.execute("SELECT id, pin_hash FROM pazienti WHERE pin_hash NOT LIKE '$2%'");
  for (const p of pazienti.rows) {
    const value = String(p.pin_hash).trim();
    if (isHashed(value)) continue;
    await db.execute({
      sql: "UPDATE pazienti SET pin_hash = ? WHERE id = ?",
      args: [await hashSecret(value), String(p.id)],
    });
  }
}
