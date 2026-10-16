/**
 * Utility lato browser per l'accesso biometrico.
 * I flag in localStorage sono SOLO preferenze di interfaccia (mai usati per l'autenticazione).
 */

const KEY_ATTIVA = "cd_bio_attiva";
const KEY_RIFIUTATA = "cd_bio_rifiutata_il";
const GIORNI_PROMPT = 30;

/** Browser integrati nelle app (WhatsApp, Facebook, Instagram, Gmail...) dove WebAuthn spesso non funziona. */
export function isInAppBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  return /FBAN|FBAV|Instagram|WhatsApp|Line\/|GSA\/|Messenger|wv\)/i.test(ua);
}

export function segnaBiometriaAttiva() {
  try {
    localStorage.setItem(KEY_ATTIVA, "1");
    localStorage.removeItem(KEY_RIFIUTATA);
  } catch {}
}

export function biometriaGiaAttiva(): boolean {
  try {
    return localStorage.getItem(KEY_ATTIVA) === "1";
  } catch {
    return false;
  }
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
  } catch {}
}
