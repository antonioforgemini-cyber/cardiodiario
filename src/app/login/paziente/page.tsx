"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle, Delete, Heart, IdCard, Lock, LogIn } from "lucide-react";
import { platformAuthenticatorIsAvailable } from "@simplewebauthn/browser";
import { Logo } from "@/components/Logo";
import { StethoscopeLoader } from "@/components/StethoscopeLoader";
import { loginPaziente } from "@/db/actions";
import { BiometricLoginButton } from "@/components/BiometricLoginButton";
import { AttivaBiometriaSheet } from "@/components/AttivaBiometriaSheet";
import { PwaInstallCard } from "@/components/pwa/PwaInstallCard";
import { biometriaGiaAttiva, promptRifiutatoDiRecente } from "@/lib/biometria-client";

export default function LoginPazientePage() {
  const router = useRouter();
  const cfInputRef = useRef<HTMLInputElement>(null);
  const [cf, setCf] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEnrollSheet, setShowEnrollSheet] = useState(false);

  const handleKeypadPress = (digit: string) => {
    setError(null);
    if (pin.length < 6) {
      setPin((prev) => prev + digit);
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  // Physical keyboard entry for PIN when focus is outside inputs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (activeEl?.tagName === "INPUT" || activeEl?.tagName === "TEXTAREA") {
        return;
      }
      if (/^[0-9]$/.test(e.key)) {
        setPin((prev) => (prev.length < 6 ? prev + e.key : prev));
      } else if (e.key === "Backspace") {
        setPin((prev) => prev.slice(0, -1));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cf || cf.trim().length < 16) {
      setError("Inserisci il Codice Fiscale completo (16 caratteri).");
      cfInputRef.current?.focus();
      return;
    }
    if (pin.length !== 6) {
      setError("Inserisci tutte le 6 cifre del tuo PIN personale tramite il tastierino.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await loginPaziente(cf, pin);
      if (res.success) {
        try {
          localStorage.removeItem("paziente_user");
        } catch {}
        const canPrompt =
          !biometriaGiaAttiva() &&
          !promptRifiutatoDiRecente() &&
          (await platformAuthenticatorIsAvailable().catch(() => false));
        if (canPrompt) {
          setShowEnrollSheet(true);
        } else {
          router.push("/paziente/cicli");
        }
      } else {
        setError(res.error || "Credenziali non valide. Verifica la scheda del medico.");
      }
    } catch {
      setError("Errore di connessione. Riprova tra qualche istante.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface font-body text-on-surface antialiased pt-safe pb-safe flex flex-col min-h-screen">
      {loading && <StethoscopeLoader overlay text="Accesso al diario in corso..." />}
      <main className="flex-1 flex flex-col relative w-full max-w-md mx-auto px-5 py-6 space-y-6">
        <header className="flex flex-col items-center text-center space-y-3">
          <Logo size={64} showText={false} />
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container text-xs font-semibold tracking-wide">
              <Heart className="w-3.5 h-3.5 text-primary fill-primary" aria-hidden="true" />
              <span>CardioDiario Paziente</span>
            </span>
            <h1 className="text-2xl font-headline font-semibold text-on-surface tracking-tight pt-1">
              Bentornato nel tuo Diario
            </h1>
            <p className="text-sm font-body text-on-surface-variant max-w-xs mx-auto leading-relaxed">
              Il tuo diario pressorio digitale connesso con la{" "}
              <strong className="text-on-surface">Dott.ssa Ivana Pariggiano</strong>.
            </p>
          </div>
        </header>

        <PwaInstallCard />

        {error && (
          <div
            role="alert"
            className="p-4 rounded-xl bg-error-container text-on-error-container text-sm flex items-center gap-2.5"
          >
            <AlertCircle className="w-5 h-5 text-error shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        <BiometricLoginButton
          ruolo="paziente"
          onError={setError}
          className="w-full min-h-[56px] px-4 rounded-2xl bg-secondary-container hover:bg-secondary-container/80 text-on-secondary-container font-bold text-base shadow-sm border border-primary/25 flex items-center justify-center gap-2.5 transition-colors disabled:opacity-60"
        />

        <form
          onSubmit={handleSubmit}
          aria-label="Accesso paziente con Codice Fiscale e PIN"
          className="bg-surface-container-lowest rounded-2xl p-5 shadow-terra space-y-5 border border-surface-variant/40"
        >
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <label
                className="text-sm font-semibold text-on-surface flex items-center gap-1.5"
                htmlFor="codice-fiscale"
              >
                <IdCard className="w-4 h-4 text-primary" aria-hidden="true" />
                <span>Codice Fiscale</span>
              </label>
              <span className="text-xs text-on-surface-variant">Tessera Sanitaria</span>
            </div>
            <p id="cf-hint" className="text-xs text-on-surface-variant">
              16 lettere e numeri della tua tessera sanitaria.
            </p>
            <input
              ref={cfInputRef}
              id="codice-fiscale"
              name="codiceFiscale"
              type="text"
              maxLength={16}
              required
              autoComplete="username"
              autoCorrect="off"
              autoCapitalize="characters"
              spellCheck={false}
              enterKeyHint="next"
              aria-describedby="cf-hint"
              value={cf}
              onChange={(e) => {
                setError(null);
                setCf(e.target.value.toUpperCase());
              }}
              placeholder="ES. RSSMRA80A01H501U"
              className="w-full min-h-[56px] px-4 text-base font-mono font-bold tracking-wider text-on-surface bg-surface-container-low rounded-xl focus:bg-surface-bright focus:outline-none border border-surface-variant/50 uppercase placeholder:text-outline placeholder:font-normal placeholder:tracking-normal transition-colors"
            />
          </div>

          <div className="space-y-2.5 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-on-surface flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-primary" aria-hidden="true" />
                <span>PIN Personale (6 cifre)</span>
              </span>
              <span aria-live="polite" className="text-xs font-semibold text-tertiary">
                {pin.length} di 6 cifre
              </span>
            </div>

            <div className="grid grid-cols-6 gap-2 w-full py-1" aria-hidden="true">
              {[0, 1, 2, 3, 4, 5].map((idx) => {
                const filled = idx < pin.length;
                return (
                  <div
                    key={idx}
                    className={`h-14 rounded-xl flex items-center justify-center text-xl font-bold transition-all border ${
                      filled
                        ? "bg-primary-container/20 border-primary text-primary"
                        : "bg-surface-container-low border-surface-variant/40 text-on-surface-variant"
                    }`}
                  >
                    {filled ? (
                      <span className="w-3.5 h-3.5 rounded-full bg-primary inline-block" />
                    ) : (
                      <span className="text-outline-variant font-mono">•</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-1" role="group" aria-label="Tastierino numerico PIN">
            <div className="grid grid-cols-3 gap-2">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleKeypadPress(num)}
                  className="min-h-[52px] rounded-xl bg-surface-container hover:bg-surface-container-high active:scale-[0.97] text-lg font-bold text-on-surface flex items-center justify-center shadow-sm transition-all"
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPin("")}
                className="min-h-[52px] rounded-xl bg-surface-container/60 hover:bg-surface-container active:scale-[0.97] text-xs font-semibold text-on-surface-variant flex items-center justify-center transition-all"
              >
                Cancella
              </button>
              <button
                type="button"
                onClick={() => handleKeypadPress("0")}
                className="min-h-[52px] rounded-xl bg-surface-container hover:bg-surface-container-high active:scale-[0.97] text-lg font-bold text-on-surface flex items-center justify-center shadow-sm transition-all"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleBackspace}
                aria-label="Rimuovi ultima cifra del PIN"
                className="min-h-[52px] rounded-xl bg-surface-container/60 hover:bg-surface-container active:scale-[0.97] text-on-surface flex items-center justify-center transition-all"
              >
                <Delete className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full min-h-[56px] px-4 rounded-xl bg-primary hover:bg-primary/90 text-on-primary font-bold text-base shadow-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <span>Accesso in corso...</span>
            ) : (
              <>
                <span>Entra nel tuo Diario</span>
                <LogIn className="w-5 h-5" aria-hidden="true" />
              </>
            )}
          </button>
        </form>

        <footer className="text-center space-y-2 text-xs text-on-surface-variant pt-2">
          <p>
            Hai perso il tuo PIN? Contatta il tuo studio medico per ricevere una nuova scheda di accesso.
          </p>
          <div>
            <Link href="/login/medico" className="text-primary hover:underline font-semibold inline-block py-1">
              Sei un medico? Accedi all&apos;Area Specialista →
            </Link>
          </div>
        </footer>
      </main>

      <AttivaBiometriaSheet
        isOpen={showEnrollSheet}
        onDone={() => {
          setShowEnrollSheet(false);
          router.push("/paziente/cicli");
        }}
      />
    </div>
  );
}
