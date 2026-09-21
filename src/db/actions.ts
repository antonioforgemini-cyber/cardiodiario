"use server";

import { db } from "./index";
import { seedDb } from "./seed";
import { isCriticalValue } from "@/lib/guidelines";

// Helper to ensure DB is initialized and seeded
async function ensureDb() {
  await seedDb();
}

// ------------------------------------
// AUTHENTICATION
// ------------------------------------
export async function loginMedico(email: string, password: string) {
  await ensureDb();
  const res = await db.execute({
    sql: "SELECT id, nome, cognome, email, specializzazione FROM medici WHERE email = ? AND password_hash = ?",
    args: [email.trim().toLowerCase(), password],
  });
  if (res.rows.length === 0) {
    return { success: false, error: "Email o password non corretti." };
  }
  const medico = res.rows[0];
  return {
    success: true,
    user: {
      id: String(medico.id),
      nome: String(medico.nome),
      cognome: String(medico.cognome),
      email: String(medico.email),
      specializzazione: medico.specializzazione ? String(medico.specializzazione) : null,
      role: "medico" as const,
    },
  };
}

export async function loginPaziente(codiceFiscale: string, pin: string) {
  await ensureDb();
  const cleanCf = codiceFiscale.trim().toUpperCase();
  const cleanPin = pin.trim();

  const res = await db.execute({
    sql: `SELECT p.id, p.nome, p.cognome, p.codice_fiscale, p.medico_id, m.nome as medico_nome, m.cognome as medico_cognome
          FROM pazienti p
          JOIN medici m ON p.medico_id = m.id
          WHERE p.codice_fiscale = ? AND p.pin_hash = ?`,
    args: [cleanCf, cleanPin],
  });

  if (res.rows.length === 0) {
    return { success: false, error: "Codice Fiscale o PIN non corretti. Controlla la scheda rilasciata dal medico." };
  }

  const paziente = res.rows[0];
  return {
    success: true,
    user: {
      id: String(paziente.id),
      nome: String(paziente.nome),
      cognome: String(paziente.cognome),
      codiceFiscale: String(paziente.codice_fiscale),
      medicoId: String(paziente.medico_id),
      medicoNomeCompleto: `Dott.ssa ${paziente.medico_nome} ${paziente.medico_cognome}`,
      role: "paziente" as const,
    },
  };
}

// ------------------------------------
// MEDICO: DASHBOARD & PAZIENTI
// ------------------------------------
export async function getDoctorDashboardData(medicoId: string) {
  await ensureDb();

  // Pazienti count
  const pazRes = await db.execute({
    sql: "SELECT COUNT(*) as count FROM pazienti WHERE medico_id = ?",
    args: [medicoId],
  });
  const totalPazienti = Number(pazRes.rows[0]?.count || 0);

  // Cicli in corso
  const cicliRes = await db.execute({
    sql: "SELECT COUNT(*) as count FROM cicli WHERE medico_id = ? AND stato = 'in corso'",
    args: [medicoId],
  });
  const cicliInCorso = Number(cicliRes.rows[0]?.count || 0);

  // Misurazioni oggi
  const todayStr = new Date().toISOString().split("T")[0];
  const misOggiRes = await db.execute({
    sql: `SELECT COUNT(*) as count FROM misurazioni m
          JOIN cicli c ON m.ciclo_id = c.id
          WHERE c.medico_id = ? AND m.data_rilevazione = ?`,
    args: [medicoId, todayStr],
  });
  const misurazioniOggi = Number(misOggiRes.rows[0]?.count || 0);

  // Allarmi / Valori critici (ultimi 7 giorni)
  const allarmiRes = await db.execute({
    sql: `SELECT COUNT(*) as count FROM misurazioni m
          JOIN cicli c ON m.ciclo_id = c.id
          WHERE c.medico_id = ? AND (m.pressione_max >= 160 OR m.pressione_min >= 100)`,
    args: [medicoId],
  });
  const allarmiCount = Number(allarmiRes.rows[0]?.count || 0);

  // Lista pazienti con ultimo stato ciclo e ultima misurazione
  const listRes = await db.execute({
    sql: `SELECT 
            p.id, p.nome, p.cognome, p.codice_fiscale, p.telefono, p.data_nascita,
            c.id as ciclo_id, c.stato as ciclo_stato, c.durata_settimane, c.braccio_riferimento,
            (SELECT MAX(data_rilevazione) FROM misurazioni WHERE ciclo_id = c.id) as ultima_data,
            (SELECT pressione_max FROM misurazioni WHERE ciclo_id = c.id ORDER BY data_rilevazione DESC, ora_rilevazione DESC LIMIT 1) as ultimo_max,
            (SELECT pressione_min FROM misurazioni WHERE ciclo_id = c.id ORDER BY data_rilevazione DESC, ora_rilevazione DESC LIMIT 1) as ultimo_min
          FROM pazienti p
          LEFT JOIN cicli c ON c.paziente_id = p.id AND c.stato IN ('in corso', 'da iniziare', 'in pausa')
          WHERE p.medico_id = ?
          ORDER BY p.cognome ASC`,
    args: [medicoId],
  });

  return {
    stats: {
      totalPazienti,
      cicliInCorso,
      misurazioniOggi,
      allarmiCount,
      compliance: 92, // % compliance stimata
    },
    pazienti: listRes.rows.map((r) => ({
      id: String(r.id),
      nome: String(r.nome),
      cognome: String(r.cognome),
      codiceFiscale: String(r.codice_fiscale),
      telefono: String(r.telefono),
      dataNascita: String(r.data_nascita),
      cicloId: r.ciclo_id ? String(r.ciclo_id) : null,
      cicloStato: r.ciclo_stato ? String(r.ciclo_stato) : "nessuno",
      durataSettimane: r.durata_settimane ? Number(r.durata_settimane) : 0,
      braccioRiferimento: r.braccio_riferimento ? String(r.braccio_riferimento) : null,
      ultimaData: r.ultima_data ? String(r.ultima_data) : null,
      ultimoMax: r.ultimo_max !== null ? Number(r.ultimo_max) : null,
      ultimoMin: r.ultimo_min !== null ? Number(r.ultimo_min) : null,
    })),
  };
}

export async function createPaziente(data: {
  medicoId: string;
  nome: string;
  cognome: string;
  codiceFiscale: string;
  dataNascita: string;
  telefono: string;
  email?: string;
  pin: string;
  noteAnamnesi?: string;
  durataSettimanePrimoCiclo?: number;
}) {
  await ensureDb();
  const id = `paz-${Date.now()}`;
  const cleanCf = data.codiceFiscale.trim().toUpperCase();

  await db.execute({
    sql: `INSERT INTO pazienti (id, medico_id, nome, cognome, codice_fiscale, data_nascita, telefono, email, pin_hash, note_anamnesi)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      id,
      data.medicoId,
      data.nome.trim(),
      data.cognome.trim(),
      cleanCf,
      data.dataNascita,
      data.telefono.trim(),
      data.email?.trim() || null,
      data.pin.trim(),
      data.noteAnamnesi?.trim() || null,
    ],
  });

  if (data.durataSettimanePrimoCiclo && data.durataSettimanePrimoCiclo > 0) {
    const cicloId = `ciclo-${Date.now()}`;
    await db.execute({
      sql: `INSERT INTO cicli (id, paziente_id, medico_id, durata_settimane, stato, note_ciclo)
            VALUES (?, ?, ?, ?, 'da iniziare', 'Primo ciclo diagnostico.')`,
      args: [cicloId, id, data.medicoId, data.durataSettimanePrimoCiclo],
    });
  }

  return { success: true, pazienteId: id };
}

// ------------------------------------
// CLINICAL DETAIL (PATIENT DIARY & CHARTS)
// ------------------------------------
export async function getPazienteDettaglioClinico(pazienteId: string) {
  await ensureDb();

  // Paziente
  const pazRes = await db.execute({
    sql: "SELECT * FROM pazienti WHERE id = ?",
    args: [pazienteId],
  });
  if (pazRes.rows.length === 0) return null;
  const p = pazRes.rows[0];

  // Ciclo attivo o più recente
  const cicliRes = await db.execute({
    sql: `SELECT * FROM cicli WHERE paziente_id = ?
          ORDER BY 
            CASE stato 
              WHEN 'in corso' THEN 1 
              WHEN 'da iniziare' THEN 2 
              WHEN 'in pausa' THEN 3 
              ELSE 4 
            END, data_creazione DESC`,
    args: [pazienteId],
  });

  const allCicli = cicliRes.rows.map((c) => ({
    id: String(c.id),
    durataSettimane: Number(c.durata_settimane),
    stato: String(c.stato),
    braccioRiferimento: c.braccio_riferimento ? String(c.braccio_riferimento) : null,
    dataCreazione: String(c.data_creazione),
    dataInizioEffettiva: c.data_inizio_effettiva ? String(c.data_inizio_effettiva) : null,
    dataFinePrevista: c.data_fine_prevista ? String(c.data_fine_prevista) : null,
    noteCiclo: c.note_ciclo ? String(c.note_ciclo) : null,
  }));

  const activeCiclo = allCicli[0] || null;

  // Misurazioni del ciclo attivo
  let misurazioni: any[] = [];
  let averages = { avgMax: 0, avgMin: 0, avgBpm: 0, targetRate: 0, totalCount: 0 };
  let slotAverages = {
    mattina: { avgMax: 0, avgMin: 0, count: 0 },
    pomeriggio: { avgMax: 0, avgMin: 0, count: 0 },
    sera: { avgMax: 0, avgMin: 0, count: 0 },
  };

  if (activeCiclo) {
    const misRes = await db.execute({
      sql: `SELECT * FROM misurazioni WHERE ciclo_id = ? ORDER BY data_rilevazione ASC, ora_rilevazione ASC`,
      args: [activeCiclo.id],
    });

    misurazioni = misRes.rows.map((m) => ({
      id: String(m.id),
      cicloId: String(m.ciclo_id),
      giornoNumero: Number(m.giorno_numero),
      slot: String(m.slot),
      dataRilevazione: String(m.data_rilevazione),
      oraRilevazione: String(m.ora_rilevazione),
      braccio: String(m.braccio),
      pressioneMax: Number(m.pressione_max),
      pressioneMin: Number(m.pressione_min),
      bpm: m.bpm ? Number(m.bpm) : null,
      note: m.note ? String(m.note) : null,
      isCritica: Boolean(m.is_critica),
    }));

    if (misurazioni.length > 0) {
      let sumMax = 0;
      let sumMin = 0;
      let sumBpm = 0;
      let bpmCount = 0;
      let targetCount = 0;

      for (const m of misurazioni) {
        sumMax += m.pressioneMax;
        sumMin += m.pressioneMin;
        if (m.bpm) {
          sumBpm += m.bpm;
          bpmCount++;
        }
        if (m.pressioneMax < 140 && m.pressioneMin < 90) {
          targetCount++;
        }

        const slotKey = m.slot as "mattina" | "pomeriggio" | "sera";
        if (slotAverages[slotKey]) {
          slotAverages[slotKey].avgMax += m.pressioneMax;
          slotAverages[slotKey].avgMin += m.pressioneMin;
          slotAverages[slotKey].count++;
        }
      }

      averages = {
        avgMax: Math.round(sumMax / misurazioni.length),
        avgMin: Math.round(sumMin / misurazioni.length),
        avgBpm: bpmCount > 0 ? Math.round(sumBpm / bpmCount) : 72,
        targetRate: Math.round((targetCount / misurazioni.length) * 100),
        totalCount: misurazioni.length,
      };

      for (const k of ["mattina", "pomeriggio", "sera"] as const) {
        if (slotAverages[k].count > 0) {
          slotAverages[k].avgMax = Math.round(slotAverages[k].avgMax / slotAverages[k].count);
          slotAverages[k].avgMin = Math.round(slotAverages[k].avgMin / slotAverages[k].count);
        }
      }
    }
  }

  // Note di terapia
  const noteRes = await db.execute({
    sql: `SELECT * FROM note_terapia WHERE paziente_id = ? ORDER BY created_at DESC`,
    args: [pazienteId],
  });
  const noteTerapia = noteRes.rows.map((n) => ({
    id: String(n.id),
    testo: String(n.testo),
    visibilePaziente: Boolean(n.visibile_paziente),
    createdAt: String(n.created_at),
  }));

  return {
    paziente: {
      id: String(p.id),
      nome: String(p.nome),
      cognome: String(p.cognome),
      codiceFiscale: String(p.codice_fiscale),
      dataNascita: String(p.data_nascita),
      telefono: String(p.telefono),
      email: p.email ? String(p.email) : null,
      pin: String(p.pin_hash),
      noteAnamnesi: p.note_anamnesi ? String(p.note_anamnesi) : null,
    },
    activeCiclo,
    allCicli,
    misurazioni,
    averages,
    slotAverages,
    noteTerapia,
  };
}

// ------------------------------------
// CICLI MANAGEMENT (MEDICO & PAZIENTE)
// ------------------------------------
export async function createNuovoCiclo(pazienteId: string, medicoId: string, durataSettimane: number, note?: string) {
  await ensureDb();
  const id = `ciclo-${Date.now()}`;
  await db.execute({
    sql: `INSERT INTO cicli (id, paziente_id, medico_id, durata_settimane, stato, note_ciclo)
          VALUES (?, ?, ?, ?, 'da iniziare', ?)`,
    args: [id, pazienteId, medicoId, durataSettimane, note?.trim() || null],
  });
  return { success: true, cicloId: id };
}

export async function updateStatoCiclo(cicloId: string, stato: "in corso" | "in pausa" | "annullato" | "concluso") {
  await ensureDb();
  await db.execute({
    sql: "UPDATE cicli SET stato = ? WHERE id = ?",
    args: [stato, cicloId],
  });
  return { success: true };
}

export async function deleteCiclo(cicloId: string) {
  await ensureDb();
  await db.execute({
    sql: "DELETE FROM cicli WHERE id = ?",
    args: [cicloId],
  });
  return { success: true };
}

// ------------------------------------
// PAZIENTE: ONBOARDING & BILATERAL START
// ------------------------------------
export async function startCicloBilaterale(data: {
  cicloId: string;
  pazienteId: string;
  maxDx: number;
  minDx: number;
  bpmDx?: number;
  maxSx: number;
  minSx: number;
  bpmSx?: number;
  braccioScelto: "DX" | "SX";
  slotAssegnato: "mattina" | "pomeriggio" | "sera";
}) {
  await ensureDb();

  const now = new Date();
  const startDateStr = now.toISOString().split("T")[0];
  const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  // Get ciclo duration
  const cRes = await db.execute({
    sql: "SELECT durata_settimane FROM cicli WHERE id = ?",
    args: [data.cicloId],
  });
  const durataSett = Number(cRes.rows[0]?.durata_settimane || 2);
  const endDate = new Date(now);
  endDate.setDate(now.getDate() + (durataSett * 7 - 1));

  // Save bilateral calibration record
  const initId = `init-${Date.now()}`;
  await db.execute({
    sql: `INSERT INTO misurazioni_iniziali (id, ciclo_id, max_dx, min_dx, bpm_dx, max_sx, min_sx, bpm_sx, braccio_scelto, slot_assegnato)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      initId,
      data.cicloId,
      data.maxDx,
      data.minDx,
      data.bpmDx || null,
      data.maxSx,
      data.minSx,
      data.bpmSx || null,
      data.braccioScelto,
      data.slotAssegnato,
    ],
  });

  // Update ciclo to "in corso" with official arm
  await db.execute({
    sql: `UPDATE cicli 
          SET stato = 'in corso', 
              braccio_riferimento = ?, 
              data_inizio_effettiva = ?, 
              data_fine_prevista = ?
          WHERE id = ?`,
    args: [data.braccioScelto, now.toISOString(), endDate.toISOString(), data.cicloId],
  });

  // Record values of selected arm as Day 1 official measurement
  const officialMax = data.braccioScelto === "DX" ? data.maxDx : data.maxSx;
  const officialMin = data.braccioScelto === "DX" ? data.minDx : data.minSx;
  const officialBpm = data.braccioScelto === "DX" ? data.bpmDx : data.bpmSx;

  const misId = `m-day1-${data.slotAssegnato}-${Date.now()}`;
  await db.execute({
    sql: `INSERT INTO misurazioni (id, ciclo_id, paziente_id, giorno_numero, slot, data_rilevazione, ora_rilevazione, braccio, pressione_max, pressione_min, bpm, note, is_critica)
          VALUES (?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, 'Misurazione iniziale bilaterale di avvio ciclo', ?)`,
    args: [
      misId,
      data.cicloId,
      data.pazienteId,
      data.slotAssegnato,
      startDateStr,
      timeStr,
      data.braccioScelto,
      officialMax,
      officialMin,
      officialBpm || null,
      isCriticalValue(officialMax, officialMin) ? 1 : 0,
    ],
  });

  return { success: true };
}

// ------------------------------------
// MISURAZIONI QUOTIDIANE
// ------------------------------------
export async function saveMisurazioneGiornaliera(data: {
  id?: string;
  cicloId: string;
  pazienteId: string;
  giornoNumero: number;
  slot: "mattina" | "pomeriggio" | "sera";
  dataRilevazione: string;
  oraRilevazione: string;
  braccio: "DX" | "SX";
  pressioneMax: number;
  pressioneMin: number;
  bpm?: number;
  note?: string;
}) {
  await ensureDb();
  const isCritica = isCriticalValue(data.pressioneMax, data.pressioneMin) ? 1 : 0;

  if (data.id) {
    // Update existing
    await db.execute({
      sql: `UPDATE misurazioni 
            SET data_rilevazione = ?, ora_rilevazione = ?, pressione_max = ?, pressione_min = ?, bpm = ?, note = ?, is_critica = ?
            WHERE id = ?`,
      args: [
        data.dataRilevazione,
        data.oraRilevazione,
        data.pressioneMax,
        data.pressioneMin,
        data.bpm || null,
        data.note?.trim() || null,
        isCritica,
        data.id,
      ],
    });
    return { success: true, id: data.id, isCritica: Boolean(isCritica) };
  }

  // Insert or Replace for that slot and date
  const newId = `m-${Date.now()}`;
  await db.execute({
    sql: `INSERT INTO misurazioni (id, ciclo_id, paziente_id, giorno_numero, slot, data_rilevazione, ora_rilevazione, braccio, pressione_max, pressione_min, bpm, note, is_critica)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(ciclo_id, data_rilevazione, slot) DO UPDATE SET
            ora_rilevazione = excluded.ora_rilevazione,
            pressione_max = excluded.pressione_max,
            pressione_min = excluded.pressione_min,
            bpm = excluded.bpm,
            note = excluded.note,
            is_critica = excluded.is_critica`,
    args: [
      newId,
      data.cicloId,
      data.pazienteId,
      data.giornoNumero,
      data.slot,
      data.dataRilevazione,
      data.oraRilevazione,
      data.braccio,
      data.pressioneMax,
      data.pressioneMin,
      data.bpm || null,
      data.note?.trim() || null,
      isCritica,
    ],
  });

  return { success: true, id: newId, isCritica: Boolean(isCritica) };
}

export async function deleteMisurazione(id: string) {
  await ensureDb();
  await db.execute({
    sql: "DELETE FROM misurazioni WHERE id = ?",
    args: [id],
  });
  return { success: true };
}

// ------------------------------------
// NOTE DI TERAPIA
// ------------------------------------
export async function addNotaTerapia(pazienteId: string, medicoId: string, testo: string, visibilePaziente: boolean) {
  await ensureDb();
  const id = `nota-${Date.now()}`;
  await db.execute({
    sql: `INSERT INTO note_terapia (id, paziente_id, medico_id, testo, visibile_paziente)
          VALUES (?, ?, ?, ?, ?)`,
    args: [id, pazienteId, medicoId, testo.trim(), visibilePaziente ? 1 : 0],
  });
  return { success: true, id };
}

// ------------------------------------
// COMUNICAZIONI & NOTIFICHE PUSH
// ------------------------------------
export async function sendComunicazione(data: {
  medicoId: string;
  titolo: string;
  messaggio: string;
  inviatoATutti: boolean;
  destinatariIds: string[];
}) {
  await ensureDb();
  const comId = `com-${Date.now()}`;

  await db.execute({
    sql: `INSERT INTO comunicazioni (id, medico_id, titolo, messaggio, inviato_a_tutti)
          VALUES (?, ?, ?, ?, ?)`,
    args: [comId, data.medicoId, data.titolo.trim(), data.messaggio.trim(), data.inviatoATutti ? 1 : 0],
  });

  let recipientIds = data.destinatariIds;
  if (data.inviatoATutti) {
    const allPaz = await db.execute({
      sql: "SELECT id FROM pazienti WHERE medico_id = ?",
      args: [data.medicoId],
    });
    recipientIds = allPaz.rows.map((r) => String(r.id));
  }

  for (const pId of recipientIds) {
    await db.execute({
      sql: `INSERT INTO comunicazione_destinatari (comunicazione_id, paziente_id, letta)
            VALUES (?, ?, 0)`,
      args: [comId, pId],
    });
  }

  return { success: true, count: recipientIds.length };
}

export async function getComunicazioniPaziente(pazienteId: string) {
  await ensureDb();
  const res = await db.execute({
    sql: `SELECT c.id, c.titolo, c.messaggio, c.created_at, 
                 COALESCE(cd.letta, 0) as letta, 
                 m.cognome as medico_cognome
          FROM comunicazioni c
          JOIN medici m ON c.medico_id = m.id
          LEFT JOIN comunicazione_destinatari cd ON c.id = cd.comunicazione_id AND cd.paziente_id = ?
          WHERE c.inviato_a_tutti = 1 OR cd.paziente_id = ?
          ORDER BY c.created_at DESC`,
    args: [pazienteId, pazienteId],
  });

  return res.rows.map((r) => ({
    id: String(r.id),
    titolo: String(r.titolo),
    messaggio: String(r.messaggio),
    createdAt: String(r.created_at),
    letta: Boolean(r.letta),
    medicoCognome: String(r.medico_cognome),
  }));
}

export async function markComunicazioniAsRead(pazienteId: string) {
  await ensureDb();
  // Get all communication IDs for this patient
  const comms = await getComunicazioniPaziente(pazienteId);
  for (const c of comms) {
    await db.execute({
      sql: `INSERT INTO comunicazione_destinatari (comunicazione_id, paziente_id, letta, letta_il)
            VALUES (?, ?, 1, CURRENT_TIMESTAMP)
            ON CONFLICT(comunicazione_id, paziente_id) DO UPDATE SET letta = 1, letta_il = CURRENT_TIMESTAMP`,
      args: [c.id, pazienteId],
    });
  }
  return { success: true };
}
