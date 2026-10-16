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
    // Clean all previous mock data and fake patients
    await db.execute("DELETE FROM misurazioni;");
    await db.execute("DELETE FROM misurazioni_iniziali;");
    await db.execute("DELETE FROM cicli;");
    await db.execute("DELETE FROM note_terapia;");
    await db.execute("DELETE FROM comunicazione_destinatari;");
    await db.execute("DELETE FROM comunicazioni;");
    await db.execute("DELETE FROM push_subscriptions;");
    await db.execute("DELETE FROM pazienti;");
    await db.execute("DELETE FROM medici;");

    // Insert ONLY Dottoressa Ivana Pariggiano
    await db.execute({
      sql: `INSERT INTO medici (id, nome, cognome, email, password_hash, specializzazione, telefono)
            VALUES ('med-1', 'Ivana', 'Pariggiano', 'ivana.pariggiano@libero.it', 'PasswordTemp', 'Dirigente Medico Cardiologia presso A.O Sant''Anna e San Sebastiano, Caserta', '')`,
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
