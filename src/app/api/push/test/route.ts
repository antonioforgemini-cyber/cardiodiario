import { NextResponse } from "next/server";
import { db } from "@/db";
import { seedDb } from "@/db/seed";
import { formatMuteUntilItalian, resolveMuteState } from "@/lib/push-mute";
import { getSession } from "@/lib/session";
import { isWebPushConfigured, sendPushToPazienti } from "@/lib/web-push";

export async function POST() {
  await seedDb();
  const session = await getSession();
  if (!session || session.role !== "paziente") {
    return NextResponse.json({ error: "Autenticazione paziente richiesta." }, { status: 401 });
  }

  const pazRes = await db.execute({
    sql: "SELECT notifiche_mute_mode, notifiche_mute_until FROM pazienti WHERE id = ?",
    args: [session.id],
  });
  const pazRow = pazRes.rows[0];
  const mute = resolveMuteState(
    pazRow?.notifiche_mute_mode ? String(pazRow.notifiche_mute_mode) : null,
    pazRow?.notifiche_mute_until ? String(pazRow.notifiche_mute_until) : null
  );

  if (mute.isMuted) {
    return NextResponse.json({
      ok: false,
      muted: true,
      mute,
      error:
        mute.mode === "forever"
          ? "Le notifiche sono silenziate per sempre. Seleziona 'Suoneria attiva' per inviare una notifica di prova."
          : `Le notifiche sono silenziate fino a ${formatMuteUntilItalian(
              mute.muteUntil!
            )}. Seleziona 'Suoneria attiva' per inviare una prova.`,
    });
  }

  if (!isWebPushConfigured()) {
    return NextResponse.json(
      { error: "Chiavi VAPID non configurate sul server." },
      { status: 503 }
    );
  }

  const summary = await sendPushToPazienti([session.id], {
    title: "CardioDiario — Notifiche Attive",
    body: "Perfetto! Riceverai qui i promemoria delle 11:00, 16:00 e 22:00 e gli avvisi del medico.",
    url: "/paziente/cicli",
    tag: "cardiodiario-test",
  });

  return NextResponse.json({ ok: summary.sent > 0, ...summary });
}
