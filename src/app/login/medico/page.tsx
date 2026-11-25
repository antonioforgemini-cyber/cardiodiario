"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle, ArrowRight, KeyRound, X } from "lucide-react";
import { platformAuthenticatorIsAvailable } from "@simplewebauthn/browser";
import { Logo } from "@/components/Logo";
import { StethoscopeLoader } from "@/components/StethoscopeLoader";
import { loginMedico } from "@/db/actions";
import { BiometricLoginButton } from "@/components/BiometricLoginButton";
import { AttivaBiometriaSheet } from "@/components/AttivaBiometriaSheet";
import { PasswordField } from "@/components/ui/PasswordField";
import { AppDialog } from "@/components/ui/AppDialog";
import { biometriaGiaAttiva, promptRifiutatoDiRecente } from "@/lib/biometria-client";

export default function LoginMedicoPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEnrollSheet, setShowEnrollSheet] = useState(false);
  const [showForgotDialog, setShowForgotDialog] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Inserisci email e password.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await loginMedico(email, password);
      if (res.success) {
        try {
          localStorage.removeItem("medico_user");
        } catch {}
        const canPrompt =
          !biometriaGiaAttiva() &&
          !promptRifiutatoDiRecente() &&
          (await platformAuthenticatorIsAvailable().catch(() => false));
        if (canPrompt) {
          setShowEnrollSheet(true);
        } else {
          router.push("/medico/dashboard");
        }
      } else {
        setError(res.error || "Credenziali non valide.");
      }
    } catch {
      setError("Errore di connessione. Riprova tra qualche istante.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-6">
      {loading && <StethoscopeLoader overlay text="Accesso medico in corso..." />}
      <main className="w-full max-w-md bg-surface-container-lowest p-7 sm:p-8 rounded-3xl border border-surface-variant/50 shadow-terra space-y-6">
        <div className="flex flex-col items-center text-center space-y-2">
          <Logo size={52} showText={true} subtitle="Portale Medico Specialista" />
          <h1 className="text-xl font-headline font-bold text-on-surface pt-2">
            Accesso Area Specialista
          </h1>
          <p className="text-sm text-on-surface-variant">
            Inserisci le tue credenziali mediche per gestire i cicli clinici dei pazienti.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="p-3.5 rounded-xl bg-error-container text-on-error-container text-sm flex items-center gap-2"
          >
            <AlertCircle className="w-5 h-5 text-error shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        <BiometricLoginButton
          ruolo="medico"
          onError={setError}
          className="w-full min-h-[48px] px-4 rounded-xl bg-secondary-container hover:bg-secondary-container/80 text-on-secondary-container font-bold text-sm shadow-sm border border-primary/25 flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
        />

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="medico-email"
              className="text-xs font-bold text-on-surface uppercase tracking-wider block"
            >
              Email Professionale
            </label>
            <input
              id="medico-email"
              name="email"
              type="email"
              autoComplete="username"
              spellCheck={false}
              enterKeyHint="next"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nome.cognome@cardiodiario.it"
              className="w-full min-h-[48px] px-4 bg-surface-container-low rounded-xl text-sm font-medium focus:bg-surface-bright focus:outline-none border border-surface-variant/60 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <PasswordField
              id="medico-password"
              name="password"
              label="Password"
              value={password}
              onChange={setPassword}
              autoComplete="current-password"
              enterKeyHint="done"
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowForgotDialog(true)}
                className="text-xs text-primary hover:underline font-semibold py-1"
              >
                Password dimenticata?
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full min-h-[48px] px-4 rounded-xl bg-primary hover:bg-primary/90 text-on-primary font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50 mt-2"
          >
            {loading ? (
              <span>Accesso in corso...</span>
            ) : (
              <>
                <span>Accedi come Medico</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-3 text-xs text-on-surface-variant border-t border-surface-variant/40">
          <Link href="/login/paziente" className="text-primary hover:underline font-semibold inline-block py-1">
            Sei un paziente? Accedi al tuo diario con Codice Fiscale e PIN →
          </Link>
        </div>
      </main>

      <AttivaBiometriaSheet
        isOpen={showEnrollSheet}
        onDone={() => {
          setShowEnrollSheet(false);
          router.push("/medico/dashboard");
        }}
      />

      <AppDialog
        isOpen={showForgotDialog}
        onClose={() => setShowForgotDialog(false)}
        labelledBy="forgot-pwd-title"
        variant="center"
        maxWidthClassName="max-w-md"
      >
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-surface-variant/40 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary-container/40 text-primary flex items-center justify-center">
                <KeyRound className="w-5 h-5" aria-hidden="true" />
              </div>
              <h2 id="forgot-pwd-title" className="text-lg font-headline font-bold text-on-surface">
                Recupero Password Medico
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setShowForgotDialog(false)}
              aria-label="Chiudi"
              className="min-w-[36px] min-h-[36px] rounded-full flex items-center justify-center text-secondary hover:bg-surface-container"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            Per motivi di sicurezza clinica, il portale non invia link di reset via email non cifrata.
            Se hai attivato <strong>Face ID o Impronta</strong> su questo dispositivo puoi accedere subito con il tasto biometrico e poi aggiornare la password dalla sezione <strong>Gestione Studio</strong>.
          </p>
          <p className="text-xs text-secondary leading-relaxed">
            In alternativa, contatta l&apos;amministratore del database studio per reimpostare la password dell&apos;account.
          </p>
          <button
            type="button"
            autoFocus
            onClick={() => setShowForgotDialog(false)}
            className="w-full min-h-[44px] rounded-xl bg-primary text-on-primary text-sm font-bold"
          >
            Ho capito
          </button>
        </div>
      </AppDialog>
    </div>
  );
}
