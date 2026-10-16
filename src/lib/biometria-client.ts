/**
 * Utility lato browser per l'accesso biometrico.
 * I flag in localStorage e cookie sono SOLO preferenze di interfaccia
 * (per mostrare il pulsante solo sui dispositivi dove la passkey è stata attivata);
 * non vengono mai usati per autenticare l'utente.
 */

const KEY_ATTIVA = "cd_bio_attiva";
const KEY_CRED_ID = "cd_bio_cred_id";
const KEY_RIFIUTATA = "cd_bio_rifiutata_il";
const GIORNI_PROMPT = 30;
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 anno

/** Browser integrati nelle app (WhatsApp, Facebook, Instagram, Gmail...) dove WebAuthn spesso non funziona. */
export function isInAppBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  return /FBAN|FBAV|Instagram|WhatsApp|Line\/|GSA\/|Messenger|wv\)/i.test(ua);
}

function setCookie(name: string, value: string, maxAge: number) {
  if (typeof document === "undefined") return;
  const secure = typeof location !== "undefined" && location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export function segnaBiometriaAttiva(credentialId?: string) {
  try {
    localStorage.setItem(KEY_ATTIVA, "1");
    localStorage.removeItem(KEY_RIFIUTATA);
    if (credentialId) {
      localStorage.setItem(KEY_CRED_ID, credentialId);
    }
  } catch {}
  setCookie(KEY_ATTIVA, "1", COOKIE_MAX_AGE);
  if (credentialId) {
    setCookie(KEY_CRED_ID, credentialId, COOKIE_MAX_AGE);
  }
}

export function biometriaGiaAttiva(): boolean {
  try {
    if (localStorage.getItem(KEY_ATTIVA) === "1") return true;
  } catch {}
  return getCookie(KEY_ATTIVA) === "1";
}

export function getCredentialIdLocale(): string | undefined {
  try {
    const fromLs = localStorage.getItem(KEY_CRED_ID);
    if (fromLs) return fromLs;
  } catch {}
  return getCookie(KEY_CRED_ID) || undefined;
}

export function segnaPromptRifiutato() {
  try {
    localStorage.setItem(KEY_RIFIUTATA, String(Date.now()));
  } catch {}
}

export function promptRifiutatoDiRecente(): boolean {
  try {
    const ts = Number(localStorage.getItem(KEY_RIFIUTATA) || 0);
    return ts > 0 && Date.now() - ts < GIORNI_PROMPT * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

export function dimenticaBiometria() {
  try {
    localStorage.removeItem(KEY_ATTIVA);
    localStorage.removeItem(KEY_CRED_ID);
  } catch {}
  setCookie(KEY_ATTIVA, "", 0);
  setCookie(KEY_CRED_ID, "", 0);
}
