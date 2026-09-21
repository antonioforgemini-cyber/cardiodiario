import { db } from "./index";

export async function initDb() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS medici (
      id TEXT PRIMARY KEY,
      nome TEXT NOT NULL,
      cognome TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      specializzazione TEXT,
      telefono TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS pazienti (
      id TEXT PRIMARY KEY,
      medico_id TEXT NOT NULL,
      nome TEXT NOT NULL,
      cognome TEXT NOT NULL,
      codice_fiscale TEXT NOT NULL,
      data_nascita DATE NOT NULL,
      telefono TEXT NOT NULL,
      email TEXT,
      pin_hash TEXT NOT NULL,
      note_anamnesi TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(medico_id, codice_fiscale)
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS cicli (
      id TEXT PRIMARY KEY,
      paziente_id TEXT NOT NULL,
      medico_id TEXT NOT NULL,
      durata_settimane INTEGER NOT NULL,
      stato TEXT CHECK(stato IN ('da iniziare', 'in corso', 'in pausa', 'concluso', 'annullato')) NOT NULL DEFAULT 'da iniziare',
      braccio_riferimento TEXT CHECK(braccio_riferimento IN ('DX', 'SX')),
      data_creazione DATETIME DEFAULT CURRENT_TIMESTAMP,
      data_inizio_effettiva DATETIME,
      data_fine_prevista DATETIME,
      data_fine_effettiva DATETIME,
      note_ciclo TEXT
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS misurazioni_iniziali (
      id TEXT PRIMARY KEY,
      ciclo_id TEXT UNIQUE NOT NULL,
      max_dx INTEGER NOT NULL,
      min_dx INTEGER NOT NULL,
      bpm_dx INTEGER,
      max_sx INTEGER NOT NULL,
      min_sx INTEGER NOT NULL,
      bpm_sx INTEGER,
      braccio_scelto TEXT CHECK(braccio_scelto IN ('DX', 'SX')) NOT NULL,
      slot_assegnato TEXT CHECK(slot_assegnato IN ('mattina', 'pomeriggio', 'sera')) NOT NULL,
      data_misurazione DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS misurazioni (
      id TEXT PRIMARY KEY,
      ciclo_id TEXT NOT NULL,
      paziente_id TEXT NOT NULL,
      giorno_numero INTEGER NOT NULL,
      slot TEXT CHECK(slot IN ('mattina', 'pomeriggio', 'sera')) NOT NULL,
      data_rilevazione DATE NOT NULL,
      ora_rilevazione TIME NOT NULL,
      braccio TEXT CHECK(braccio IN ('DX', 'SX')) NOT NULL,
      pressione_max INTEGER NOT NULL,
      pressione_min INTEGER NOT NULL,
      bpm INTEGER,
      note TEXT,
      is_critica BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(ciclo_id, data_rilevazione, slot)
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS note_terapia (
      id TEXT PRIMARY KEY,
      paziente_id TEXT NOT NULL,
      medico_id TEXT NOT NULL,
      testo TEXT NOT NULL,
      visibile_paziente BOOLEAN NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id TEXT PRIMARY KEY,
      paziente_id TEXT NOT NULL,
      endpoint TEXT NOT NULL,
      p256dh TEXT NOT NULL,
      auth TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS comunicazioni (
      id TEXT PRIMARY KEY,
      medico_id TEXT NOT NULL,
      titolo TEXT NOT NULL,
      messaggio TEXT NOT NULL,
      inviato_a_tutti BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS comunicazione_destinatari (
      comunicazione_id TEXT NOT NULL,
      paziente_id TEXT NOT NULL,
      letta BOOLEAN DEFAULT 0,
      letta_il DATETIME,
      PRIMARY KEY(comunicazione_id, paziente_id)
    );
  `);
}
