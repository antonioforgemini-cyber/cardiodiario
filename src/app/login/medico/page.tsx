"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { loginMedico } from "@/db/actions";

export default function LoginMedicoPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      if (res.success && res.user) {
        localStorage.setItem("medico_user", JSON.stringify(res.user));
        router.push("/medico/dashboard");
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
      <div className="w-full max-w-md bg-surface-container-lowest p-8 rounded-3xl border border-surface-variant/50 shadow-[0_4px_20px_rgba(46,50,48,0.06)] space-y-6">
        <div className="flex flex-col items-center text-center space-y-2">
          <Logo size={52} showText={true} subtitle="Portale Medico Specialista" />
          <p className="text-sm text-on-surface-variant pt-2">
            Inserisci le tue credenziali mediche per gestire i cicli clinici dei pazienti.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-error-container text-on-error-container text-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-error text-xl">error</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-on-surface uppercase tracking-wider">
              Email Professionale
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome.cognome@cardiodiario.it"
                className="w-full h-12 px-4 bg-surface-container-low rounded-xl text-sm font-medium focus:bg-surface-bright focus:outline-none focus:ring-2 focus:ring-primary border border-surface-variant/40"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-on-surface uppercase tracking-wider">
                Password
              </label>
              <span className="text-xs text-primary hover:underline cursor-pointer">
                Password dimenticata?
              </span>
            </div>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full h-12 px-4 bg-surface-container-low rounded-xl text-sm font-medium focus:bg-surface-bright focus:outline-none focus:ring-2 focus:ring-primary border border-surface-variant/40"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-on-primary font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-4"
          >
            {loading ? (
              <span>Accesso in corso...</span>
            ) : (
              <>
                <span>Accedi come Medico</span>
                <span className="material-symbols-outlined text-lg">arrow_forward</span>
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-2 text-xs text-on-surface-variant border-t border-surface-variant/40">
          <Link href="/login/paziente" className="text-primary hover:underline font-semibold">
            Sei un paziente? Accedi al tuo diario con Codice Fiscale e PIN →
          </Link>
        </div>
      </div>
    </div>
  );
}
