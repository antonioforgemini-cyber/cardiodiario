import "server-only";
import webpush from "web-push";
import { db } from "@/db";
import { resolveMuteState } from "@/lib/push-mute";

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  badgeCount?: number;
  silent?: boolean;
}

export interface SendPushSummary {
  configured: boolean;
  totalSubscriptions: number;
  sent: number;
  failed: number;
  pruned: number;
  mutedSkipped: number;
}

let vapidInitialized = false;

export function getVapidPublicKey(): string | null {
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
  return pub && pub.length > 10 ? pub : null;
}

export function isWebPushConfigured(): boolean {
  const pub = getVapidPublicKey();
  const priv = process.env.VAPID_PRIVATE_KEY?.trim();
  return Boolean(pub && priv && priv.length > 10);
}

function ensureVapidDetails(): boolean {
  if (!isWebPushConfigured()) return false;
  if (!vapidInitialized) {
    const subject = process.env.VAPID_SUBJECT?.trim() || "mailto:noreply@cardiodiario.app";
    webpush.setVapidDetails(
      subject,
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!.trim(),
      process.env.VAPID_PRIVATE_KEY!.trim()
    );
    vapidInitialized = true;
  }
  return true;
}

/**
 * Invia una Web Push crittografata VAPID a tutti i dispositivi registrati per gli ID paziente forniti.
 * Rimuove automaticamente dal DB gli endpoint non più validi (HTTP 404 / 410).
 */
export async function sendPushToPazienti(
  pazienteIds: string[],
  payload: PushPayload,
  options?: { bypassMute?: boolean }
): Promise<SendPushSummary> {
  if (!ensureVapidDetails() || pazienteIds.length === 0) {
    return {
      configured: isWebPushConfigured(),
      totalSubscriptions: 0,
      sent: 0,
      failed: 0,
      pruned: 0,
      mutedSkipped: 0,
    };
  }

  const uniqueIds = Array.from(new Set(pazienteIds.filter(Boolean)));
  const rows: Array<{ id: string; endpoint: string; p256dh: string; auth: string }> = [];
  let totalRawSubscriptions = 0;
  let mutedSkipped = 0;

  // Query in chunks to stay well under SQLite variable limits
  const chunkSize = 80;
  for (let i = 0; i < uniqueIds.length; i += chunkSize) {
    const chunk = uniqueIds.slice(i, i + chunkSize);
    const placeholders = chunk.map(() => "?").join(", ");
    const res = await db.execute({
      sql: `SELECT ps.id, ps.endpoint, ps.p256dh, ps.auth,
                   p.notifiche_mute_mode, p.notifiche_mute_until
            FROM push_subscriptions ps
            LEFT JOIN pazienti p ON p.id = ps.paziente_id
            WHERE ps.paziente_id IN (${placeholders})`,
      args: chunk,
    });
    for (const r of res.rows) {
      totalRawSubscriptions++;
      const mute = resolveMuteState(
        r.notifiche_mute_mode ? String(r.notifiche_mute_mode) : null,
        r.notifiche_mute_until ? String(r.notifiche_mute_until) : null
      );
      if (!options?.bypassMute && mute.isMuted) {
        mutedSkipped++;
        continue;
      }
      rows.push({
        id: String(r.id),
        endpoint: String(r.endpoint),
        p256dh: String(r.p256dh),
        auth: String(r.auth),
      });
    }
  }

  if (rows.length === 0) {
    return {
      configured: true,
      totalSubscriptions: totalRawSubscriptions,
      sent: 0,
      failed: 0,
      pruned: 0,
      mutedSkipped,
    };
  }

  const bodyJson = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url || "/paziente/cicli",
    tag: payload.tag || "cardiodiario",
    badgeCount: payload.badgeCount,
    silent: Boolean(payload.silent),
  });

  let sent = 0;
  let failed = 0;
  const expiredIds: string[] = [];

  const results = await Promise.allSettled(
    rows.map((sub) =>
      webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        bodyJson,
        { TTL: 3600 }
      )
    )
  );

  results.forEach((result, idx) => {
    if (result.status === "fulfilled") {
      sent++;
    } else {
      failed++;
      const err = result.reason as { statusCode?: number };
      if (err?.statusCode === 404 || err?.statusCode === 410) {
        expiredIds.push(rows[idx].id);
      }
    }
  });

  if (expiredIds.length > 0) {
    const placeholders = expiredIds.map(() => "?").join(", ");
    await db.execute({
      sql: `DELETE FROM push_subscriptions WHERE id IN (${placeholders})`,
      args: expiredIds,
    });
  }

  return {
    configured: true,
    totalSubscriptions: totalRawSubscriptions,
    sent,
    failed,
    pruned: expiredIds.length,
    mutedSkipped,
  };
}
