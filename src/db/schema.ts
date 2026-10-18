import { db } from "./index";

export async function initDb() {
  await Promise.all([
    db.execute(`
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
    `),
    db.execute(`
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
    `),
    db.execute(`
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
    `),
    db.execute(`
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
    `),
    db.execute(`
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
    `),
    db.execute(`
      CREATE TABLE IF NOT EXISTS note_terapia (
        id TEXT PRIMARY KEY,
        paziente_id TEXT NOT NULL,
        medico_id TEXT NOT NULL,
        testo TEXT NOT NULL,
        visibile_paziente BOOLEAN NOT NULL DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `),
    db.execute(`
      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id TEXT PRIMARY KEY,
        paziente_id TEXT NOT NULL,
        endpoint TEXT NOT NULL,
        p256dh TEXT NOT NULL,
        auth TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `),
    db.execute(`
      CREATE TABLE IF NOT EXISTS comunicazioni (
        id TEXT PRIMARY KEY,
        medico_id TEXT NOT NULL,
        titolo TEXT NOT NULL,
        messaggio TEXT NOT NULL,
        inviato_a_tutti BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `),
    db.execute(`
      CREATE TABLE IF NOT EXISTS comunicazione_destinatari (
        comunicazione_id TEXT NOT NULL,
        paziente_id TEXT NOT NULL,
        letta BOOLEAN DEFAULT 0,
        letta_il DATETIME,
        PRIMARY KEY(comunicazione_id, paziente_id)
      );
    `),
    db.execute(`
      CREATE TABLE IF NOT EXISTS login_tentativi (
        chiave TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `),
    db.execute(`
      CREATE TABLE IF NOT EXISTS webauthn_credenziali (
        id TEXT PRIMARY KEY,
        ruolo TEXT CHECK(ruolo IN ('paziente', 'medico')) NOT NULL,
        utente_id TEXT NOT NULL,
        public_key TEXT NOT NULL,
        counter INTEGER NOT NULL DEFAULT 0,
        transports TEXT,
        nome_dispositivo TEXT,
        backed_up BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_used_at DATETIME
      );
    `),
  ]);

  // Indici additivi per velocizzare la navigazione e le query sui diari
  await Promise.all([
    db.execute(`CREATE INDEX IF NOT EXISTS idx_login_tentativi ON login_tentativi(chiave, created_at);`),
    db.execute(`CREATE INDEX IF NOT EXISTS idx_webauthn_utente ON webauthn_credenziali(ruolo, utente_id);`),
    db.execute(`CREATE INDEX IF NOT EXISTS idx_pazienti_medico ON pazienti(medico_id);`),
    db.execute(`CREATE INDEX IF NOT EXISTS idx_cicli_paziente ON cicli(paziente_id);`),
    db.execute(`CREATE INDEX IF NOT EXISTS idx_cicli_medico ON cicli(medico_id, stato);`),
    db.execute(`CREATE INDEX IF NOT EXISTS idx_misurazioni_ciclo ON misurazioni(ciclo_id, data_rilevazione);`),
    db.execute(`CREATE INDEX IF NOT EXISTS idx_note_paziente ON note_terapia(paziente_id);`),
  ]);

  // ------------------------------------
  // MIGRAZIONI COLONNE (idempotenti e parallele per tabella)
  // ------------------------------------
  await Promise.all([
    ensureColumns("pazienti", [
      { column: "sessione_versione", definition: "INTEGER NOT NULL DEFAULT 0" },
      { column: "disclaimer_accettato", definition: "INTEGER NOT NULL DEFAULT 0" },
      { column: "disclaimer_accettato_il", definition: "DATETIME" },
    ]),
    ensureColumns("medici", [
      { column: "sessione_versione", definition: "INTEGER NOT NULL DEFAULT 0" },
    ]),
  ]);
}

async function ensureColumns(
  table: string,
  columns: Array<{ column: string; definition: string }>
) {
  const info = await db.execute(`PRAGMA table_info(${table})`);
  const existing = new Set(info.rows.map((r) => String(r.name)));
  for (const { column, definition } of columns) {
    if (!existing.has(column)) {
      await db.execute(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    }
  }
}
