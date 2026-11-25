import crypto from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/db";
import { seedDb } from "@/db/seed";
import { getRomeDateAndHour } from "@/lib/dateUtils";
import { isWebPushConfigured, sendPushToPazienti } from "@/lib/web-push";

type SlotType = "mattina" | "pomeriggio" | "sera";

const HOUR_TO_SLOT: Record<number, SlotType> = {
  11: "mattina",
  16: "pomeriggio",
  22: "sera",
};

const SLOT_LABELS: Record<SlotType, string> = {
  mattina: "Mattina (entro le 11:00)",
  pomeriggio: "Pomeriggio (entro le 16:00)",
  sera: "Sera (entro le 22:00)",
};

function isAuthorizedCron(req: NextRequest): { ok: boolean; status: number; reason?: string } {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return { ok: false, status: 503, reason: "CRON_SECRET non configurato" };
  }
  const authHeader = req.headers.get("authorization") || "";
  const expected = `Bearer ${secret}`;
  const a = Buffer.from(authHeader);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return { ok: false, status: 401, reason: "Unauthorized" };
  }
  return { ok: true, status: 200 };
}

export async function GET(req: NextRequest) {
  const auth = isAuthorizedCron(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.reason }, { status: auth.status });
  }

  await seedDb();

  const { date: todayRome, hour: romeHour } = getRomeDateAndHour();
  const explicitSlot = req.nextUrl.searchParams.get("slot")?.trim().toLowerCase();

  let slot: SlotType | undefined;
  if (explicitSlot === "mattina" || explicitSlot === "pomeriggio" || explicitSlot === "sera") {
    slot = explicitSlot;
  } else {
    slot = HOUR_TO_SLOT[romeHour];
  }

  if (!slot) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: "outside-window",
      todayRome,
      romeHour,
    });
  }

  if (!isWebPushConfigured()) {
    return NextResponse.json({
      ok: false,
      skipped: true,
      reason: "vapid-not-configured",
      slot,
      todayRome,
    });
  }

  // Trova i cicli "in corso" attivi oggi che non hanno ancora misurazione per questo slot
  // e non hanno già ricevuto questo promemoria oggi, con almeno una push subscription attiva.
  const candidatesRes = await db.execute({
    sql: `SELECT c.id as ciclo_id, c.paziente_id, c.braccio_riferimento, p.nome as paziente_nome
          FROM cicli c
          JOIN pazienti p ON p.id = c.paziente_id
          WHERE c.stato = 'in corso'
            AND (c.data_inizio_effettiva IS NULL OR date(c.data_inizio_effettiva) <= ?)
            AND (c.data_fine_prevista IS NULL OR date(c.data_fine_prevista) >= ?)
            AND EXISTS (
              SELECT 1 FROM push_subscriptions ps WHERE ps.paziente_id = c.paziente_id
            )
            AND NOT EXISTS (
              SELECT 1 FROM misurazioni m
              WHERE m.ciclo_id = c.id AND m.data_rilevazione = ? AND m.slot = ?
            )
            AND NOT EXISTS (
              SELECT 1 FROM promemoria_inviati pr
              WHERE pr.ciclo_id = c.id AND pr.data_rif = ? AND pr.slot = ?
            )`,
    args: [todayRome, todayRome, todayRome, slot, todayRome, slot],
  });

  let pushedCycles = 0;
  let totalPushSent = 0;
  let pruned = 0;
  let mutedSkipped = 0;

  for (const row of candidatesRes.rows) {
    const cicloId = String(row.ciclo_id);
    const pazienteId = String(row.paziente_id);
    const braccio = row.braccio_riferimento ? `Braccio ${String(row.braccio_riferimento)}` : "tuo braccio di riferimento";
    const nome = String(row.paziente_nome || "");

    const summary = await sendPushToPazienti([pazienteId], {
      title: `Promemoria Pressione — ${SLOT_LABELS[slot]}`,
      body: `${nome ? `Ciao ${nome}, ` : ""}non hai ancora registrato la misurazione della ${slot}. Effettuala sul ${braccio}.`,
      url: `/paziente/diario/${cicloId}`,
      tag: `promemoria-${todayRome}-${slot}`,
    });

    totalPushSent += summary.sent;
    pruned += summary.pruned;
    mutedSkipped += summary.mutedSkipped;

    if (summary.sent > 0) {
      pushedCycles++;
      await db.execute({
        sql: `INSERT OR IGNORE INTO promemoria_inviati (ciclo_id, data_rif, slot)
              VALUES (?, ?, ?)`,
        args: [cicloId, todayRome, slot],
      });
    }
  }

  return NextResponse.json({
    ok: true,
    slot,
    todayRome,
    romeHour,
    candidates: candidatesRes.rows.length,
    pushedCycles,
    totalPushSent,
    pruned,
    mutedSkipped,
  });
}
