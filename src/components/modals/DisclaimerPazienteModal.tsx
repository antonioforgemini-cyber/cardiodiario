"use client";

import React, { useState } from "react";
import { accettaDisclaimerPaziente, logout } from "@/db/actions";
import { StethoscopeLoader } from "@/components/StethoscopeLoader";

interface DisclaimerPazienteModalProps {
  isOpen: boolean;
  onAcceptSuccess: () => void;
  onDeclineLogout: () => void;
}

export const DisclaimerPazienteModal: React.FC<DisclaimerPazienteModalProps> = ({
  isOpen,
  onAcceptSuccess,
  onDeclineLogout,
}) => {
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("Salvataggio preferenza...");
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAccept = async () => {
    setLoadingText("Salvataggio conferma in corso...");
    setLoading(true);
    setError(null);
    try {
      const res = await accettaDisclaimerPaziente();
      if (res.success) {
        onAcceptSuccess();
      }
    } catch {
      setError("Si è verificato un errore durante il salvataggio. Riprova.");
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = async () => {
    setLoadingText("Uscita in corso...");
    setLoading(true);
    try {
      try {
        localStorage.removeItem("paziente_user");
      } catch {}
      await logout();
      onDeclineLogout();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-inverse-surface/60 backdrop-blur-md animate-in fade-in duration-200">
      {loading && <StethoscopeLoader overlay text={loadingText} />}

      <div className="bg-surface-container-lowest w-full max-w-md rounded-3xl shadow-2xl border border-surface-variant/50 p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center gap-3 border-b border-surface-variant/40 pb-4">
          <div className="w-11 h-11 rounded-2xl bg-primary-container/40 text-primary flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-2xl">privacy_tip</span>
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-primary block">
              Informativa di Utilizzo
            </span>
            <h2 className="text-lg font-headline font-bold text-on-surface leading-tight">
              Benvenuto in CardioDiario
            </h2>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-error-container text-on-error-container text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-error text-base">error</span>
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-3 text-xs sm:text-sm text-on-surface-variant leading-relaxed bg-surface-container-low p-4 rounded-2xl border border-surface-variant/40">
          <p>
            Questa è un&apos;applicazione ad <strong className="text-on-surface">uso personale</strong> che permette di tenere un diario condiviso con il proprio medico e <strong className="text-on-surface">non è legata a nessun istituto sanitario o a nessun ministero</strong>.
          </p>
          <p>
            Il paziente può <strong className="text-on-surface">in ogni momento chiedere al medico la cancellazione</strong> di tutti i dati personali e dei diari salvati nella stessa.
          </p>
          <p className="pt-1 text-on-surface font-medium">
            Se sei d&apos;accordo con l&apos;utilizzo dell&apos;applicazione puoi proseguire premendo il tasto <strong>&quot;Accetta e continua&quot;</strong>, altrimenti premendo il pulsante <strong>&quot;Non sono d&apos;accordo&quot;</strong> si uscirà nuovamente nella pagina di login.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-2">
          <button
            type="button"
            disabled={loading}
            onClick={handleDecline}
            className="flex-1 h-12 px-4 rounded-xl bg-surface-container hover:bg-error-container/30 text-secondary hover:text-error text-xs sm:text-sm font-bold transition-colors disabled:opacity-50"
          >
            Non sono d&apos;accordo
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={handleAccept}
            className="flex-1 h-12 px-5 rounded-xl bg-primary hover:bg-primary/90 text-on-primary text-xs sm:text-sm font-bold shadow-sm flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
          >
            <span>Accetta e continua</span>
            <span className="material-symbols-outlined text-base">check</span>
          </button>
        </div>
      </div>
    </div>
  );
};
