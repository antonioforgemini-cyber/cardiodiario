"use server";

import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";
import type { RegistrationResponseJSON, AuthenticationResponseJSON } from "@simplewebauthn/server";
import { isoBase64URL } from "@simplewebauthn/server/helpers";
import { db } from "./index";
import { seedDb } from "./seed";
import { createSession } from "@/lib/session";
import { requireSession, requireMedico, assertPazienteDelMedico } from "@/lib/auth-guards";
import {
  RP_NAME,
  getRelyingParty,
  salvaChallenge,
  consumaChallenge,
  nomeDispositivoDaUserAgent,
} from "@/lib/webauthn";

type Ruolo = "paziente" | "medico";

async function listaCredenziali(ruolo: Ruolo, utenteId: string) {
  const res = await db.execute({
    sql: `SELECT id, transports, nome_dispositivo, backed_up, created_at, last_used_at
          FROM webauthn_credenziali WHERE ruolo = ? AND utente_id = ?
          ORDER BY created_at DESC`,
    args: [ruolo, utenteId],
  });
  return res.rows.map((r) => ({
    id: String(r.id),
    transports: r.transports ? (JSON.parse(String(r.transports)) as string[]) : undefined,
    nomeDispositivo: r.nome_dispositivo ? String(r.nome_dispositivo) : "Dispositivo",
    sincronizzata: Boolean(r.backed_up),
    createdAt: String(r.created_at),
    lastUsedAt: r.last_used_at ? String(r.last_used_at) : null,
  }));
}

async function nomeUtente(ruolo: Ruolo, utenteId: string) {
  const table = ruolo === "medico" ? "medici" : "pazienti";
  const res = await db.execute({ sql: `SELECT nome, cognome FROM ${table} WHERE id = ?`, args: [utenteId] });
  const r = res.rows[0];
  const nome = r ? `${r.nome} ${r.cognome}` : "Utente";
  return ruolo === "medico" ? `Dott.ssa ${nome}` : nome;
}

// ------------------------------------
// REGISTRAZIONE (utente già autenticato)
// ------------------------------------
export async function passkeyOpzioniRegistrazione() {
  const s = await requireSession();
  const { rpID } = await getRelyingParty();
  const esistenti = await listaCredenziali(s.role, s.id);
  const nome = await nomeUtente(s.role, s.id);

  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID,
    userName: nome,
    userDisplayName: nome,
    userID: new TextEncoder().encode(`${s.role}:${s.id}`),
    attestationType: "none",
    excludeCredentials: esistenti.map((c) => ({ id: c.id, transports: c.transports as never })),
    authenticatorSelection: {
      residentKey: "required", // consente l'accesso senza digitare il Codice Fiscale
      userVerification: "required", // impone biometria (o PIN del dispositivo)
      authenticatorAttachment: "platform", // Face ID / Touch ID / impronta del telefono
    },
  });

  await salvaChallenge(options.challenge, "registrazione");
  return options;
}

export async function passkeyVerificaRegistrazione(risposta: RegistrationResponseJSON) {
  const s = await requireSession();
  const expectedChallenge = await consumaChallenge("registrazione");
  if (!expectedChallenge) {
    return { success: false as const, error: "Richiesta scaduta. Riprova." };
  }
  const { rpID, origin } = await getRelyingParty();

  let verification;
  try {
    verification = await verifyRegistrationResponse({
      response: risposta,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: true,
    });
  } catch (e) {
    console.error("[passkey] verifica registrazione fallita", e);
    return { success: false as const, error: "Impossibile attivare l'accesso biometrico su questo dispositivo." };
  }

  if (!verification.verified) {
    return { success: false as const, error: "Verifica non riuscita. Riprova." };
  }

  const { credential, credentialBackedUp } = verification.registrationInfo;
  await db.execute({
    sql: `INSERT INTO webauthn_credenziali (id, ruolo, utente_id, public_key, counter, transports, nome_dispositivo, backed_up)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO NOTHING`,
    args: [
      credential.id,
      s.role,
      s.id,
      isoBase64URL.fromBuffer(credential.publicKey),
      credential.counter,
      JSON.stringify(credential.transports ?? risposta.response.transports ?? []),
      await nomeDispositivoDaUserAgent(),
      credentialBackedUp ? 1 : 0,
    ],
  });

  return { success: true as const };
}

// ------------------------------------
// ACCESSO (nessuna sessione richiesta)
// ------------------------------------
export async function passkeyOpzioniAccesso() {
  await seedDb();
  const { rpID } = await getRelyingParty();
  const options = await generateAuthenticationOptions({
    rpID,
    userVerification: "required",
    // allowCredentials vuoto = passkey "scopribili": il telefono propone l'account da solo
  });
  await salvaChallenge(options.challenge, "accesso");
  return options;
}

export async function passkeyVerificaAccesso(risposta: AuthenticationResponseJSON) {
  await seedDb();
  const expectedChallenge = await consumaChallenge("accesso");
  if (!expectedChallenge) {
    return { success: false as const, error: "Richiesta scaduta. Riprova." };
  }

  const res = await db.execute({
    sql: "SELECT id, ruolo, utente_id, public_key, counter, transports FROM webauthn_credenziali WHERE id = ?",
    args: [risposta.id],
  });
  const row = res.rows[0];
  if (!row) {
    return {
      success: false as const,
      sconosciuta: true,
      error: "Accesso biometrico non più attivo per questo account. Entra con il PIN e riattivalo.",
    };
  }

  const { rpID, origin } = await getRelyingParty();
  let verification;
  try {
    verification = await verifyAuthenticationResponse({
      response: risposta,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: true,
      credential: {
        id: String(row.id),
        publicKey: isoBase64URL.toBuffer(String(row.public_key)),
        counter: Number(row.counter),
        transports: row.transports ? JSON.parse(String(row.transports)) : undefined,
      },
    });
  } catch (e) {
    console.error("[passkey] verifica accesso fallita", e);
    return { success: false as const, error: "Verifica biometrica non riuscita. Riprova o entra con il PIN." };
  }

  if (!verification.verified) {
    return { success: false as const, error: "Verifica biometrica non riuscita. Riprova o entra con il PIN." };
  }

  await db.execute({
    sql: "UPDATE webauthn_credenziali SET counter = ?, last_used_at = CURRENT_TIMESTAMP WHERE id = ?",
    args: [verification.authenticationInfo.newCounter, String(row.id)],
  });

  const ruolo = String(row.ruolo) as Ruolo;
  try {
    await createSession(ruolo, String(row.utente_id));
  } catch {
    return { success: false as const, error: "Account non più attivo. Contatta lo studio medico." };
  }

  return { success: true as const, role: ruolo };
}

// ------------------------------------
// GESTIONE DISPOSITIVI
// ------------------------------------
export async function listaMiePasskey() {
  const s = await requireSession();
  return listaCredenziali(s.role, s.id);
}

export async function eliminaMiaPasskey(credentialId: string) {
  const s = await requireSession();
  await db.execute({
    sql: "DELETE FROM webauthn_credenziali WHERE id = ? AND ruolo = ? AND utente_id = ?",
    args: [credentialId, s.role, s.id],
  });
  return { success: true };
}

/** Medico: numero di dispositivi con accesso biometrico attivo per un paziente. */
export async function contaPasskeyPaziente(pazienteId: string) {
  const s = await requireMedico();
  await assertPazienteDelMedico(pazienteId, s.id);
  const res = await db.execute({
    sql: "SELECT COUNT(*) as n FROM webauthn_credenziali WHERE ruolo = 'paziente' AND utente_id = ?",
    args: [pazienteId],
  });
  return Number(res.rows[0]?.n ?? 0);
}

/** Medico: rimuove tutti gli accessi biometrici del paziente (es. telefono perso o cambiato). */
export async function resetPasskeyPaziente(pazienteId: string) {
  const s = await requireMedico();
  await assertPazienteDelMedico(pazienteId, s.id);
  await db.execute({
    sql: "DELETE FROM webauthn_credenziali WHERE ruolo = 'paziente' AND utente_id = ?",
    args: [pazienteId],
  });
  return { success: true };
}
