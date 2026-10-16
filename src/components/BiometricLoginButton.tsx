"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  browserSupportsWebAuthn,
  startAuthentication,
  WebAuthnError,
} from "@simplewebauthn/browser";
import { passkeyOpzioniAccesso, passkeyVerificaAccesso } from "@/db/passkey-actions";
import { isInAppBrowser, segnaBiometriaAttiva } from "@/lib/biometria-client";

interface BiometricLoginButtonProps {
  /** Ruolo atteso dalla pagina: usato solo per il redirect di default */
  ruolo: "paziente" | "medico";
  onError?: (msg: string | null) => void;
  className?: string;
}

export const BiometricLoginButton: React.FC<BiometricLoginButtonProps> = ({ ruolo, onError, className }) => {
  const router = useRouter();
  const [supported, setSupported] = useState(false);
  const [inApp, setInApp] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setSupported(browserSupportsWebAuthn());
    setInApp(isInAppBrowser());
  }, []);

  if (!supported) return null;

  const handleClick = async () => {
    onError?.(null);
    if (inApp) {
      onError?.(
        "Stai usando il browser interno di un'app (es. WhatsApp). Per usare impronta o Face ID apri il link in Safari o Chrome."
      );
    }
    setLoading(true);
    try {
      const optionsJSON = await passkeyOpzioniAccesso();
      const risposta = await startAuthentication({ optionsJSON });
      const res = await passkeyVerificaAccesso(risposta);
      if (res.success) {
        segnaBiometriaAttiva();
        router.push(res.role === "medico" ? "/medico/dashboard" : "/paziente/cicli");
        return;
      }
      onError?.(res.error);
    } catch (e) {
      onError?.(messaggioErrore(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={
        className ??
        "w-full h-14 rounded-xl bg-primary text-on-primary font-bold text-base shadow-sm flex items-center justify-center gap-2.5 active:scale-98 transition-all disabled:opacity-60"
      }
      aria-label={ruolo === "medico" ? "Accedi con biometria" : "Accedi con impronta o Face ID"}
    >
      <span className="material-symbols-outlined text-2xl">fingerprint</span>
      <span>{loading ? "Verifica in corso..." : "Accedi con impronta o Face ID"}</span>
    </button>
  );
};

function messaggioErrore(e: unknown): string | null {
  if (e instanceof WebAuthnError) {
    if (e.code === "ERROR_CEREMONY_ABORTED") return null;
  }
  if (e instanceof Error) {
    // L'utente ha annullato o non ci sono passkey su questo dispositivo
    if (e.name === "NotAllowedError" || e.name === "AbortError") {
      return "Accesso biometrico annullato o non ancora attivo su questo telefono. Entra con Codice Fiscale e PIN.";
    }
    if (e.name === "SecurityError") {
      return "Accesso biometrico non disponibile su questo indirizzo. Apri l'app dal sito ufficiale.";
    }
  }
  return "Accesso biometrico non riuscito. Entra con Codice Fiscale e PIN.";
}
