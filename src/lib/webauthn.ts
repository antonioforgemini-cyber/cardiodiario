import "server-only";
import { cookies, headers } from "next/headers";
import { signShortLived, verifyShortLived } from "./session-token";

const CHALLENGE_COOKIE = "cd_wa_chal";
const CHALLENGE_MAX_AGE = 5 * 60; // 5 minuti

export const RP_NAME = process.env.WEBAUTHN_RP_NAME || "CardioDiario";

/**
 * RP ID e origin. Se non impostati via env vengono ricavati dalla richiesta:
 * così funzionano sia https://cardiodiario.vercel.app sia http://localhost:3000.
 * (Una passkey è legata all'RP ID: quelle create su un dominio non valgono su un altro.)
 */
export async function getRelyingParty(): Promise<{ rpID: string; origin: string }> {
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host") || "localhost:3000";
  const proto = h.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
  const rpID = process.env.WEBAUTHN_RP_ID || host.split(":")[0];
  const origin = process.env.WEBAUTHN_ORIGIN || `${proto}://${host}`;
  return { rpID, origin };
}

type ChallengePurpose = "registrazione" | "accesso";

export async function salvaChallenge(challenge: string, purpose: ChallengePurpose): Promise<void> {
  const token = await signShortLived({ c: challenge, p: purpose }, CHALLENGE_MAX_AGE);
  (await cookies()).set(CHALLENGE_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: CHALLENGE_MAX_AGE,
  });
}

/** Legge e consuma (cancella) la challenge: ogni challenge è utilizzabile una sola volta. */
export async function consumaChallenge(purpose: ChallengePurpose): Promise<string | null> {
  const store = await cookies();
  const token = store.get(CHALLENGE_COOKIE)?.value;
  store.delete(CHALLENGE_COOKIE);
  const data = await verifyShortLived<{ c: string; p: string }>(token);
  if (!data || data.p !== purpose) return null;
  return data.c;
}

/** Nome leggibile del dispositivo ricavato dallo user agent (es. "iPhone · Safari"). */
export async function nomeDispositivoDaUserAgent(): Promise<string> {
  const ua = (await headers()).get("user-agent") || "";
  let device = "Dispositivo";
  if (/iPhone/i.test(ua)) device = "iPhone";
  else if (/iPad/i.test(ua)) device = "iPad";
  else if (/Android/i.test(ua)) device = "Android";
  else if (/Macintosh|Mac OS X/i.test(ua)) device = "Mac";
  else if (/Windows/i.test(ua)) device = "Windows";

  let browser = "";
  if (/EdgA?\//i.test(ua)) browser = "Edge";
  else if (/SamsungBrowser/i.test(ua)) browser = "Samsung Internet";
  else if (/CriOS|Chrome\//i.test(ua)) browser = "Chrome";
  else if (/FxiOS|Firefox\//i.test(ua)) browser = "Firefox";
  else if (/Safari\//i.test(ua)) browser = "Safari";

  return browser ? `${device} · ${browser}` : device;
}
