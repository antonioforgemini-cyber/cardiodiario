"use client";

export type PushSupportState =
  | "unsupported"
  | "ios-needs-install"
  | "default"
  | "granted"
  | "denied";

export function isIosDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

export function isRunningStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const nav = navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    nav.standalone === true
  );
}

export function getPushSupportState(): PushSupportState {
  if (typeof window === "undefined") return "unsupported";

  if (isIosDevice() && !isRunningStandalone()) {
    return "ios-needs-install";
  }

  if (
    !("serviceWorker" in navigator) ||
    !("PushManager" in window) ||
    !("Notification" in window)
  ) {
    return "unsupported";
  }

  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  return "default";
}

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const outputArray = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function getCurrentPushSubscription(): Promise<PushSubscription | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return null;
  try {
    const registration = await navigator.serviceWorker.getRegistration("/");
    if (!registration?.pushManager) return null;
    return await registration.pushManager.getSubscription();
  } catch {
    return null;
  }
}

export async function subscribeCurrentDevice(vapidPublicKey: string): Promise<{
  ok: boolean;
  error?: string;
}> {
  const state = getPushSupportState();
  if (state === "ios-needs-install") {
    return {
      ok: false,
      error: "Su iPhone e iPad aggiungi prima l'app alla schermata Home per attivare le notifiche.",
    };
  }
  if (state === "unsupported") {
    return {
      ok: false,
      error: "Questo browser non supporta le notifiche push.",
    };
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    return {
      ok: false,
      error:
        permission === "denied"
          ? "Permesso notifiche negato nelle impostazioni del browser."
          : "Autorizzazione notifiche non concessa.",
    };
  }

  let registration = await navigator.serviceWorker.getRegistration("/");
  if (!registration) {
    registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
      updateViaCache: "none",
    });
  }
  await navigator.serviceWorker.ready;

  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });
  }

  const json = subscription.toJSON();
  const res = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      endpoint: subscription.endpoint,
      keys: json.keys,
    }),
  });

  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    return { ok: false, error: data.error || "Impossibile salvare la registrazione notifiche." };
  }

  return { ok: true };
}

export async function unsubscribeCurrentDevice(): Promise<boolean> {
  try {
    const sub = await getCurrentPushSubscription();
    if (!sub) return true;
    const endpoint = sub.endpoint;
    await sub.unsubscribe().catch(() => false);
    await fetch("/api/push/subscribe", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint }),
    });
    return true;
  } catch {
    return false;
  }
}
