"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { loginPaziente } from "@/db/actions";

export default function LoginPazientePage() {
  const router = useRouter();
  const [cf, setCf] = useState("BNCGPP58A01H501U"); // Pre-filled test patient Giuseppe Bianchi
  const [pin, setPin] = useState("123456"); // Pre-filled test PIN
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPwaBanner, setShowPwaBanner] = useState(true);

  const handleKeypadPress = (digit: string) => {
    if (pin.length < 6) {
      setPin((prev) => prev + digit);
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cf || cf.length < 16) {
      setError("Inserisci il Codice Fiscale completo (16 caratteri).");
      return;
    }
    if (pin.length !== 6) {
      setError("Inserisci tutte le 6 cifre del tuo PIN personale.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await loginPaziente(cf, pin);
      if (res.success && res.user) {
        localStorage.setItem("paziente_user", JSON.stringify(res.user));
        router.push("/paziente/cicli");
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
      <main className="flex-1 flex flex-col relative w-full max-w-md mx-auto px-5 py-6 space-y-6">
        {/* Header */}
        <header className="flex flex-col items-center text-center space-y-3">
          <Logo size={64} showText={false} />
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container text-xs font-semibold tracking-wide">
              <span className="material-symbols-outlined text-sm text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                favorite
              </span>
              CardioDiario Paziente
            </span>
            <h1 className="text-2xl font-headline font-semibold text-on-surface tracking-tight pt-1">
              Bentornato nel tuo Diario
            </h1>
            <p className="text-sm font-body text-on-surface-variant max-w-xs mx-auto leading-relaxed">
              Il tuo diario pressorio digitale connesso con lo studio del <strong className="text-on-surface">Dott. Valerio Marchi</strong>.
            </p>
          </div>
        </header>

        {/* PWA Banner */}
        {showPwaBanner && (
          <section className="relative overflow-hidden bg-primary-container/25 rounded-2xl p-4 shadow-sm transition-all duration-300">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center flex-shrink-0 text-on-primary shadow-sm">
                <span className="material-symbols-outlined text-2xl">add_to_home_screen</span>
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-headline font-semibold text-on-surface">
                    Installa l&apos;App sul Telefono
                  </h2>
                  <button
                    onClick={() => setShowPwaBanner(false)}
                    aria-label="Chiudi"
                    className="text-outline hover:text-on-surface p-0.5 rounded-full"
                  >
                    <span className="material-symbols-outlined text-lg leading-none">close</span>
                  </button>
                </div>
                <p className="text-xs font-body text-on-surface-variant leading-normal">
                  Aggiungi CardioDiario alla schermata Home per ricevere i promemoria quotidiani e misurare la pressione con facilità.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-xl bg-error-container text-on-error-container text-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-error text-xl">error</span>
            <span>{error}</span>
          </div>
        )}

        {/* Main Access Form */}
        <form onSubmit={handleSubmit} className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm space-y-5 border border-surface-variant/40">
          {/* Input 1: Codice Fiscale */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-on-surface flex items-center gap-1.5" htmlFor="codice-fiscale">
                <span className="material-symbols-outlined text-primary text-lg">badge</span>
                Codice Fiscale
              </label>
              <span className="text-xs text-on-surface-variant">Es. Tessera Sanitaria</span>
            </div>
            <div className="relative">
              <input
                id="codice-fiscale"
                type="text"
                maxLength={16}
                value={cf}
                onChange={(e) => setCf(e.target.value.toUpperCase())}
                placeholder="BNC GPP 58A01 H501U"
                className="w-full h-14 px-4 text-base font-mono font-bold tracking-wider text-on-surface bg-surface-container-low rounded-xl focus:bg-surface-bright focus:outline-none focus:ring-2 focus:ring-primary uppercase placeholder:text-outline placeholder:font-normal placeholder:tracking-normal transition-all"
              />
            </div>
            <p className="text-xs text-on-surface-variant px-1">
              Lettere e numeri della tua tessera sanitaria (16 caratteri).
            </p>
          </div>

          {/* Input 2: 6-Digit PIN Senior Accessible */}
          <div className="space-y-2.5 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-on-surface flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary text-lg">lock</span>
                PIN Personale (6 cifre)
              </label>
              <span className="text-xs font-semibold text-tertiary">
                {pin.length} di 6 cifre
              </span>
            </div>

            {/* 6 Big Tactile PIN Slots */}
            <div className="grid grid-cols-6 gap-2 w-full py-1">
              {[0, 1, 2, 3, 4, 5].map((idx) => {
                const filled = idx < pin.length;
                return (
                  <div
                    key={idx}
                    className={`h-14 rounded-xl flex items-center justify-center text-xl font-bold transition-all border ${
                      filled
                        ? "bg-primary-container/20 border-primary text-primary"
                        : "bg-surface-container-low border-transparent text-on-surface-variant"
                    }`}
                  >
                    {filled ? (
                      <span className="w-3.5 h-3.5 rounded-full bg-primary inline-block"></span>
                    ) : (
                      <span className="text-outline-variant font-mono">•</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Senior Accessible Numeric Keypad */}
          <div className="pt-2">
            <div className="grid grid-cols-3 gap-2">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleKeypadPress(num)}
                  className="h-12 rounded-xl bg-surface-container hover:bg-surface-container-high active:scale-95 text-lg font-bold text-on-surface flex items-center justify-center shadow-sm transition-all"
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPin("")}
                className="h-12 rounded-xl bg-surface-container/60 hover:bg-surface-container active:scale-95 text-xs font-semibold text-on-surface-variant flex items-center justify-center transition-all"
              >
                Cancella
              </button>
              <button
                type="button"
                onClick={() => handleKeypadPress("0")}
                className="h-12 rounded-xl bg-surface-container hover:bg-surface-container-high active:scale-95 text-lg font-bold text-on-surface flex items-center justify-center shadow-sm transition-all"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleBackspace}
                className="h-12 rounded-xl bg-surface-container/60 hover:bg-surface-container active:scale-95 text-on-surface flex items-center justify-center transition-all"
              >
                <span className="material-symbols-outlined text-xl">backspace</span>
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || pin.length !== 6}
            className="w-full h-14 rounded-xl bg-primary hover:bg-primary/90 text-on-primary font-bold text-base shadow-sm flex items-center justify-center gap-2 active:scale-98 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span>Accesso in corso...</span>
            ) : (
              <>
                <span>Entra nel tuo Diario</span>
                <span className="material-symbols-outlined text-xl">login</span>
              </>
            )}
          </button>
        </form>

        {/* Footer Support */}
        <div className="text-center space-y-2 text-xs text-on-surface-variant pt-2">
          <p>
            Hai perso il tuo PIN? Contatta il tuo studio medico per ricevere una nuova scheda di accesso.
          </p>
          <div>
            <Link href="/login/medico" className="text-primary hover:underline font-semibold">
              Sei un medico? Accedi all&apos;Area Specialista →
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
