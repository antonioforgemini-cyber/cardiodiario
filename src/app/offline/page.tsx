"use client";

import React from "react";
import { RefreshCw, WifiOff } from "lucide-react";
import { Logo } from "@/components/Logo";

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col items-center justify-center p-6">
      <main className="w-full max-w-md bg-surface-container-lowest rounded-3xl border border-surface-variant/60 shadow-terra p-8 text-center space-y-6">
        <div className="flex justify-center">
          <Logo size={48} showText={true} subtitle="Diario Pressorio" />
        </div>

        <div className="w-16 h-16 rounded-2xl bg-secondary-container text-tertiary flex items-center justify-center mx-auto">
          <WifiOff className="w-8 h-8" aria-hidden="true" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-headline font-bold text-on-surface">
            Connessione non disponibile
          </h1>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            Al momento il dispositivo non risulta connesso a Internet. Per consultare il diario o inviare nuove misurazioni al tuo medico è necessaria una connessione attiva.
          </p>
        </div>

        <button
          type="button"
          onClick={() => window.location.reload()}
          className="w-full min-h-[48px] px-5 py-3 rounded-xl bg-primary hover:bg-primary/90 text-on-primary text-sm font-bold shadow-sm flex items-center justify-center gap-2 transition-colors"
        >
          <RefreshCw className="w-4 h-4" aria-hidden="true" />
          <span>Riprova connessione</span>
        </button>
      </main>
    </div>
  );
}
