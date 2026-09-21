import { db } from "./index";
import { initDb } from "./schema";

export async function seedDb() {
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
}
