"use client";

import React, { useState } from "react";
import { startRegistration, WebAuthnError } from "@simplewebauthn/browser";
import { passkeyOpzioniRegistrazione, passkeyVerificaRegistrazione } from "@/db/passkey-actions";
import { segnaBiometriaAttiva, segnaPromptRifiutato } from "@/lib/biometria-client";

/** Registra una passkey sul dispositivo corrente. Restituisce un messaggio d'errore o null. */
export async function attivaBiometriaSuQuestoDispositivo(): Promise<string | null> {
  try {
    const optionsJSON = await passkeyOpzioniRegistrazione();
    const risposta = await startRegistration({ optionsJSON });
    const res = await passkeyVerificaRegistrazione(risposta);
    if (!res.success) return res.error;
    segnaBiometriaAttiva(res.credentialId || risposta.id);
    return null;
  } catch (e) {
    if (e instanceof WebAuthnError && e.code === "ERROR_AUTHENTICATOR_PREVIOUSLY_REGISTERED") {
      segnaBiometriaAttiva();
      return null; // già attiva su questo dispositivo
    }
    if (e instanceof Error && (e.name === "NotAllowedError" || e.name === "AbortError")) {
      return "Operazione annullata.";
    }
    return "Non è stato possibile attivare l'accesso biometrico su questo dispositivo.";
  }
}

interface AttivaBiometriaSheetProps {
  isOpen: boolean;
  /** Chiamato a fine flusso (attivata, rifiutata o errore) */
  onDone: () => void;
}

/** Bottom sheet mostrato dopo il login con PIN/password per proporre l'accesso biometrico. */
export const AttivaBiometriaSheet: React.FC<AttivaBiometriaSheetProps> = ({ isOpen, onDone }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleAttiva = async () => {
    setLoading(true);
    setError(null);
    const err = await attivaBiometriaSuQuestoDispositivo();
    setLoading(false);
    if (err) {
      setError(err);
      return;
    }
    setSuccess(true);
    setTimeout(onDone, 1200);
  };

  const handleNonOra = () => {
    segnaPromptRifiutato();
    onDone();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-inverse-surface/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface-container-lowest w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 pb-8 space-y-5 animate-in slide-in-from-bottom-6 duration-300">
        <div className="sm:hidden flex justify-center -mt-2">
          <div className="w-12 h-1.5 bg-outline/25 rounded-full" />
        </div>

        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-primary-container/40 text-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              {success ? "check_circle" : "fingerprint"}
            </span>
          </div>
          <h2 className="text-xl font-headline font-bold text-on-surface">
            {success ? "Accesso rapido attivato!" : "Entra più velocemente"}
          </h2>
          <p className="text-sm text-on-surface-variant leading-relaxed max-w-xs">
            {success
              ? "Dalla prossima volta potrai entrare con l'impronta o il volto."
              : "Vuoi usare l'impronta digitale o il riconoscimento del volto per entrare la prossima volta, senza digitare il PIN?"}
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-error-container text-on-error-container text-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-error text-xl">error</span>
            <span>{error}</span>
          </div>
        )}

        {!success && (
          <div className="space-y-2.5">
            <button
              type="button"
              onClick={handleAttiva}
              disabled={loading}
              className="w-full h-14 rounded-xl bg-primary text-on-primary font-bold text-base shadow-sm flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <span className="material-symbols-outlined text-xl">fingerprint</span>
              {loading ? "Attivazione..." : "Attiva impronta / Face ID"}
            </button>
            <button
              type="button"
              onClick={handleNonOra}
              disabled={loading}
              className="w-full h-12 rounded-xl text-sm font-semibold text-secondary hover:bg-surface-container"
            >
              Non ora
            </button>
          </div>
        )}

        <p className="text-[11px] text-center text-outline leading-snug">
          Il tuo dato biometrico resta sul telefono e non viene mai inviato a CardioDiario.
        </p>
      </div>
    </div>
  );
};
