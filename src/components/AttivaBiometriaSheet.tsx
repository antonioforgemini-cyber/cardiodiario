"use client";

import React, { useState } from "react";
import { AlertCircle, CheckCircle2, Fingerprint } from "lucide-react";
import { startRegistration, WebAuthnError } from "@simplewebauthn/browser";
import { passkeyOpzioniRegistrazione, passkeyVerificaRegistrazione } from "@/db/passkey-actions";
import { segnaBiometriaAttiva, segnaPromptRifiutato } from "@/lib/biometria-client";
import { AppDialog } from "@/components/ui/AppDialog";

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
      return null;
    }
    if (e instanceof Error && (e.name === "NotAllowedError" || e.name === "AbortError")) {
      return "Operazione annullata.";
    }
    return "Non è stato possibile attivare l'accesso biometrico su questo dispositivo.";
  }
}

interface AttivaBiometriaSheetProps {
  isOpen: boolean;
  onDone: () => void;
}

export const AttivaBiometriaSheet: React.FC<AttivaBiometriaSheetProps> = ({ isOpen, onDone }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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
    <AppDialog
      isOpen={isOpen}
      onClose={handleNonOra}
      labelledBy="attiva-bio-title"
      variant="sheet"
      maxWidthClassName="max-w-md"
    >
      <div className="p-6 pb-8 space-y-5 overflow-y-auto">
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-primary-container/40 text-primary flex items-center justify-center">
            {success ? (
              <CheckCircle2 className="w-9 h-9" aria-hidden="true" />
            ) : (
              <Fingerprint className="w-9 h-9" aria-hidden="true" />
            )}
          </div>
          <h1 id="attiva-bio-title" className="text-xl font-headline font-bold text-on-surface">
            {success ? "Accesso rapido attivato!" : "Entra più velocemente"}
          </h1>
          <p className="text-sm text-on-surface-variant leading-relaxed max-w-xs">
            {success
              ? "Dalla prossima volta potrai entrare con l'impronta o il volto."
              : "Vuoi usare l'impronta digitale o il riconoscimento del volto per entrare la prossima volta, senza digitare il PIN?"}
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="p-3 rounded-xl bg-error-container text-on-error-container text-sm flex items-center gap-2"
          >
            <AlertCircle className="w-5 h-5 text-error shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        {!success && (
          <div className="space-y-2.5">
            <button
              type="button"
              autoFocus
              onClick={handleAttiva}
              disabled={loading}
              className="w-full min-h-[52px] px-4 rounded-xl bg-primary text-on-primary font-bold text-base shadow-sm flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <Fingerprint className="w-5 h-5" aria-hidden="true" />
              <span>{loading ? "Attivazione..." : "Attiva impronta / Face ID"}</span>
            </button>
            <button
              type="button"
              onClick={handleNonOra}
              disabled={loading}
              className="w-full min-h-[48px] px-4 rounded-xl text-sm font-semibold text-secondary hover:bg-surface-container"
            >
              Non ora
            </button>
          </div>
        )}

        <p className="text-[11px] text-center text-outline leading-snug">
          Il tuo dato biometrico resta sul telefono e non viene mai inviato a CardioDiario.
        </p>
      </div>
    </AppDialog>
  );
};
