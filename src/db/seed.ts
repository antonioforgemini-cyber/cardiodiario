import { db } from "./index";
import { initDb } from "./schema";

export async function seedDb() {
  await initDb();

  // Check if doctor exists
  const existingMed = await db.execute("SELECT id FROM medici WHERE email = 'dott.marchi@cardiodiario.it'");
  if (existingMed.rows.length > 0) {
    return; // Already seeded
  }

  // Insert Doctor
  await db.execute({
    sql: `INSERT INTO medici (id, nome, cognome, email, password_hash, specializzazione, telefono)
          VALUES ('med-1', 'Valerio', 'Marchi', 'dott.marchi@cardiodiario.it', 'password123', 'Cardiologia e Malattie Vascolari', '+39 06 88776655')`,
    args: [],
  });

  // Patient 1: Giuseppe Bianchi (In corso, Giorno 11)
  await db.execute({
    sql: `INSERT INTO pazienti (id, medico_id, nome, cognome, codice_fiscale, data_nascita, telefono, email, pin_hash, note_anamnesi)
          VALUES ('paz-1', 'med-1', 'Giuseppe', 'Bianchi', 'BNCGPP58A01H501U', '1958-01-01', '+39 348 1234567', 'giuseppe.bianchi@email.it', '123456', 'Ipertensione arteriosa essenziale Grado 1 in trattamento farmacologico.')`,
    args: [],
  });

  // Patient 2: Maria Rossi (Da iniziare)
  await db.execute({
    sql: `INSERT INTO pazienti (id, medico_id, nome, cognome, codice_fiscale, data_nascita, telefono, email, pin_hash, note_anamnesi)
          VALUES ('paz-2', 'med-1', 'Maria', 'Rossi', 'RSSMRA64M41F205Z', '1964-08-15', '+39 333 9876543', 'maria.rossi@email.it', '654321', 'Sospetta ipertensione camice bianco. Avviato primo ciclo di monitoraggio domiciliare.')`,
    args: [],
  });

  // Patient 3: Antonio Ferri (In pausa)
  await db.execute({
    sql: `INSERT INTO pazienti (id, medico_id, nome, cognome, codice_fiscale, data_nascita, telefono, email, pin_hash, note_anamnesi)
          VALUES ('paz-3', 'med-1', 'Antonio', 'Ferri', 'FRRNTN72C15L219Y', '1972-03-15', '+39 340 5544332', 'antonio.ferri@email.it', '112233', 'Paziente in follow-up post modifica dosaggio antipertensivo.')`,
    args: [],
  });

  // Calculate dates for Giorno 11 today
  const today = new Date();
  const startDate = new Date();
  startDate.setDate(today.getDate() - 10); // 10 days ago = today is Day 11
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 13); // 14 days total (2 weeks)

  // Ciclo 1 per Giuseppe Bianchi
  await db.execute({
    sql: `INSERT INTO cicli (id, paziente_id, medico_id, durata_settimane, stato, braccio_riferimento, data_creazione, data_inizio_effettiva, data_fine_prevista, note_ciclo)
          VALUES ('ciclo-1', 'paz-1', 'med-1', 2, 'in corso', 'DX', ?, ?, ?, 'Monitoraggio controllo terapia. Misurazioni regolari prima dei pasti.')`,
    args: [startDate.toISOString(), startDate.toISOString(), endDate.toISOString()],
  });

  // Initial bilateral measurement for Giuseppe Bianchi
  await db.execute({
    sql: `INSERT INTO misurazioni_iniziali (id, ciclo_id, max_dx, min_dx, bpm_dx, max_sx, min_sx, bpm_sx, braccio_scelto, slot_assegnato, data_misurazione)
          VALUES ('init-1', 'ciclo-1', 138, 86, 72, 130, 82, 70, 'DX', 'mattina', ?)`,
    args: [startDate.toISOString()],
  });

  // Generate measurements for Giuseppe up to today (Day 11)
  const slots = ['mattina', 'pomeriggio', 'sera'] as const;
  for (let g = 1; g <= 10; g++) {
    const curDate = new Date(startDate);
    curDate.setDate(startDate.getDate() + (g - 1));
    const dateStr = curDate.toISOString().split('T')[0];

    // Mattina
    await db.execute({
      sql: `INSERT INTO misurazioni (id, ciclo_id, paziente_id, giorno_numero, slot, data_rilevazione, ora_rilevazione, braccio, pressione_max, pressione_min, bpm, note)
            VALUES (?, 'ciclo-1', 'paz-1', ?, 'mattina', ?, '08:15', 'DX', ?, ?, ?, ?)`,
      args: [`m-${g}-1`, g, dateStr, 125 + (g % 8), 80 + (g % 5), 68 + (g % 6), g === 1 ? 'Prima misurazione ufficiale ciclo' : null],
    });

    // Pomeriggio
    await db.execute({
      sql: `INSERT INTO misurazioni (id, ciclo_id, paziente_id, giorno_numero, slot, data_rilevazione, ora_rilevazione, braccio, pressione_max, pressione_min, bpm, note)
            VALUES (?, 'ciclo-1', 'paz-1', ?, 'pomeriggio', ?, '14:30', 'DX', ?, ?, ?, ?)`,
      args: [`m-${g}-2`, g, dateStr, 130 + (g % 10), 83 + (g % 6), 72 + (g % 4), null],
    });

    // Sera
    await db.execute({
      sql: `INSERT INTO misurazioni (id, ciclo_id, paziente_id, giorno_numero, slot, data_rilevazione, ora_rilevazione, braccio, pressione_max, pressione_min, bpm, note)
            VALUES (?, 'ciclo-1', 'paz-1', ?, 'sera', ?, '20:45', 'DX', ?, ?, ?, ?)`,
      args: [`m-${g}-3`, g, dateStr, 122 + (g % 9), 78 + (g % 5), 66 + (g % 5), null],
    });
  }

  // Day 11 (Today): Mattina and Pomeriggio recorded, Sera pending!
  const todayStr = today.toISOString().split('T')[0];
  await db.execute({
    sql: `INSERT INTO misurazioni (id, ciclo_id, paziente_id, giorno_numero, slot, data_rilevazione, ora_rilevazione, braccio, pressione_max, pressione_min, bpm, note)
          VALUES ('m-11-1', 'ciclo-1', 'paz-1', 11, 'mattina', ?, '08:20', 'DX', 142, 91, 74, 'Leggero affanno al risveglio')`,
    args: [todayStr],
  });

  await db.execute({
    sql: `INSERT INTO misurazioni (id, ciclo_id, paziente_id, giorno_numero, slot, data_rilevazione, ora_rilevazione, braccio, pressione_max, pressione_min, bpm, note)
          VALUES ('m-11-2', 'ciclo-1', 'paz-1', 11, 'pomeriggio', ?, '15:10', 'DX', 134, 85, 70, null)`,
    args: [todayStr],
  });

  // Ciclo 2 per Maria Rossi (Da Iniziare)
  await db.execute({
    sql: `INSERT INTO cicli (id, paziente_id, medico_id, durata_settimane, stato, note_ciclo)
          VALUES ('ciclo-2', 'paz-2', 'med-1', 2, 'da iniziare', 'Primo ciclo diagnostico. Seguire accuratamente il tutorial iniziale.')`,
    args: [],
  });

  // Note di terapia per Giuseppe Bianchi
  await db.execute({
    sql: `INSERT INTO note_terapia (id, paziente_id, medico_id, testo, visibile_paziente)
          VALUES ('nota-1', 'paz-1', 'med-1', 'Assumere Ramipril 5mg ogni mattina dopo colazione. Limitare il sale negli alimenti.', 1)`,
    args: [],
  });
  await db.execute({
    sql: `INSERT INTO note_terapia (id, paziente_id, medico_id, testo, visibile_paziente)
          VALUES ('nota-2', 'paz-1', 'med-1', 'Valutare aggiunta di Calcio-antagonista se la media serale rimane sopra i 135 mmHg al termine del ciclo.', 0)`,
    args: [],
  });

  // Comunicazione iniziale
  await db.execute({
    sql: `INSERT INTO comunicazioni (id, medico_id, titolo, messaggio, inviato_a_tutti)
          VALUES ('com-1', 'med-1', 'Benvenuti nel CardioDiario dello Studio', 'Gentili pazienti, attraverso questa applicazione potremo monitorare la vostra salute cardiaca con precisione. Ricordatevi di seguire i promemoria quotidiani.', 1)`,
    args: [],
  });
}
