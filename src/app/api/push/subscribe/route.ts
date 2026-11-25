import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/db";
import { seedDb } from "@/db/seed";
import { getSession } from "@/lib/session";
import {
  computeMuteUntil,
  isValidMuteMode,
  resolveMuteState,
} from "@/lib/push-mute";
import { getVapidPublicKey, isWebPushConfigured } from "@/lib/web-push";

export async function GET() {
  await seedDb();
  const session = await getSession();
  if (!session || session.role !== "paziente") {
    return NextResponse.json({ error: "Autenticazione paziente richiesta." }, { status: 401 });
  }

  const [subRes, pazRes] = await Promise.all([
    db.execute({
      sql: "SELECT COUNT(*) as n FROM push_subscriptions WHERE paziente_id = ?",
      args: [session.id],
    }),
    db.execute({
      sql: "SELECT notifiche_mute_mode, notifiche_mute_until FROM pazienti WHERE id = ?",
      args: [session.id],
    }),
  ]);

  const pazRow = pazRes.rows[0];
  const mute = resolveMuteState(
    pazRow?.notifiche_mute_mode ? String(pazRow.notifiche_mute_mode) : null,
    pazRow?.notifiche_mute_until ? String(pazRow.notifiche_mute_until) : null
  );

  return NextResponse.json({
    configured: isWebPushConfigured(),
    vapidPublicKey: getVapidPublicKey(),
    activeDevices: Number(subRes.rows[0]?.n ?? 0),
    mute,
  });
}

export async function PATCH(req: NextRequest) {
  await seedDb();
  const session = await getSession();
  if (!session || session.role !== "paziente") {
    return NextResponse.json({ error: "Autenticazione paziente richiesta." }, { status: 401 });
  }

  let body: { mode?: unknown };
  try {
    body = (await req.json()) as { mode?: unknown };
  } catch {
    return NextResponse.json({ error: "Payload JSON non valido." }, { status: 400 });
  }

  if (!isValidMuteMode(body.mode)) {
    return NextResponse.json(
      { error: "Modalità notifiche non valida." },
      { status: 400 }
    );
  }

  const muteUntil = computeMuteUntil(body.mode);
  await db.execute({
    sql: "UPDATE pazienti SET notifiche_mute_mode = ?, notifiche_mute_until = ? WHERE id = ?",
    args: [body.mode, muteUntil, session.id],
  });

  return NextResponse.json({
    ok: true,
    mute: resolveMuteState(body.mode, muteUntil),
  });
}

export async function POST(req: NextRequest) {
  await seedDb();
  const session = await getSession();
  if (!session || session.role !== "paziente") {
    return NextResponse.json({ error: "Autenticazione paziente richiesta." }, { status: 401 });
  }

  if (!isWebPushConfigured()) {
    return NextResponse.json(
      { error: "Servizio notifiche push non configurato sul server." },
      { status: 503 }
    );
  }

  let body: { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
  try {
    body = (await req.json()) as { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
  } catch {
    return NextResponse.json({ error: "Payload JSON non valido." }, { status: 400 });
  }

  const endpoint = body.endpoint?.trim();
  const p256dh = body.keys?.p256dh?.trim();
  const auth = body.keys?.auth?.trim();

  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json({ error: "Dati di sottoscrizione incompleti." }, { status: 400 });
  }

  try {
    const parsed = new URL(endpoint);
    if (parsed.protocol !== "https:") {
      return NextResponse.json({ error: "Endpoint push non sicuro." }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "URL endpoint non valido." }, { status: 400 });
  }

  const ua = req.headers.get("user-agent")?.slice(0, 240) || null;
  const subId = `ps-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  await db.execute({
    sql: `INSERT INTO push_subscriptions (id, paziente_id, endpoint, p256dh, auth, user_agent, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
          ON CONFLICT(endpoint) DO UPDATE SET
            paziente_id = excluded.paziente_id,
            p256dh = excluded.p256dh,
            auth = excluded.auth,
            user_agent = excluded.user_agent,
            updated_at = CURRENT_TIMESTAMP`,
    args: [subId, session.id, endpoint, p256dh, auth, ua],
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  await seedDb();
  const session = await getSession();
  if (!session || session.role !== "paziente") {
    return NextResponse.json({ error: "Autenticazione paziente richiesta." }, { status: 401 });
  }

  let body: { endpoint?: string; all?: boolean } = {};
  try {
    body = (await req.json()) as { endpoint?: string; all?: boolean };
  } catch {
    // Allow empty body to clean nothing
  }

  if (body.all) {
    await db.execute({
      sql: "DELETE FROM push_subscriptions WHERE paziente_id = ?",
      args: [session.id],
    });
  } else if (body.endpoint) {
    await db.execute({
      sql: "DELETE FROM push_subscriptions WHERE paziente_id = ? AND endpoint = ?",
      args: [session.id, body.endpoint.trim()],
    });
  }

  return NextResponse.json({ ok: true });
}
