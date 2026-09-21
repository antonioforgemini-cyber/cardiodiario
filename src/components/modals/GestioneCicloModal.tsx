"use client";

import React, { useState } from "react";
import { updateStatoCiclo, deleteCiclo } from "@/db/actions";

interface GestioneCicloModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  cicloId: string;
  currentStato: string;
}

export const GestioneCicloModal: React.FC<GestioneCicloModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  cicloId,
  currentStato,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAction = async (action: "pause" | "resume" | "cancel" | "delete") => {
    setLoading(true);
    setError(null);
    try {
      if (action === "pause") {
        await updateStatoCiclo(cicloId, "in pausa");
      } else if (action === "resume") {
        await updateStatoCiclo(cicloId, "in corso");
      } else if (action === "cancel") {
        await updateStatoCiclo(cicloId, "annullato");
      } else if (action === "delete") {
        await deleteCiclo(cicloId);
      }
      onSuccess();
      onClose();
    } catch {
      setError("Si è verificato un errore nell'aggiornamento dello stato.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-inverse-surface/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface-container-lowest w-full max-w-md rounded-3xl shadow-2xl border border-surface-variant/50 overflow-hidden flex flex-col">
        <div className="p-6 pb-4 border-b border-surface-variant/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary-container text-tertiary flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">settings</span>
            </div>
            <div>
              <h2 className="text-xl font-headline font-bold text-on-surface">Gestione Ciclo di Controllo</h2>
              <p className="text-xs text-on-surface-variant">Stato attuale: <strong className="uppercase">{currentStato}</strong></p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-outline hover:bg-surface-container"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-error-container text-on-error-container text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-error text-base">error</span>
              <span>{error}</span>
            </div>
          )}

          <p className="text-sm text-on-surface-variant leading-relaxed">
            Seleziona l&apos;operazione clinica desiderata sul ciclo di monitoraggio:
          </p>

          <div className="space-y-2.5">
            {currentStato === "in corso" && (
              <button
                type="button"
                disabled={loading}
                onClick={() => handleAction("pause")}
                className="w-full p-4 rounded-2xl bg-surface-container-low hover:bg-surface-container border border-surface-variant/40 text-left flex items-center justify-between transition-all"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-tertiary text-2xl">pause_circle</span>
                  <div>
                    <span className="text-sm font-bold text-on-surface block">Metti in Pausa il Ciclo</span>
                    <span className="text-xs text-secondary">Sospende temporaneamente le notifiche per il paziente.</span>
                  </div>
                </div>
              </button>
            )}

            {currentStato === "in pausa" && (
              <button
                type="button"
                disabled={loading}
                onClick={() => handleAction("resume")}
                className="w-full p-4 rounded-2xl bg-primary-container/20 hover:bg-primary-container/40 border border-primary/30 text-left flex items-center justify-between transition-all"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary text-2xl">play_circle</span>
                  <div>
                    <span className="text-sm font-bold text-primary block">Riattiva Ciclo</span>
                    <span className="text-xs text-on-surface-variant">Ripristina lo stato &quot;In Corso&quot; e i promemoria quotidiani.</span>
                  </div>
                </div>
              </button>
            )}

            {currentStato !== "annullato" && currentStato !== "concluso" && (
              <button
                type="button"
                disabled={loading}
                onClick={() => handleAction("cancel")}
                className="w-full p-4 rounded-2xl bg-surface-container-low hover:bg-error-container/20 border border-surface-variant/40 hover:border-error/30 text-left flex items-center justify-between transition-all"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-error text-2xl">cancel</span>
                  <div>
                    <span className="text-sm font-bold text-on-surface block">Annulla Ciclo</span>
                    <span className="text-xs text-secondary">Interrompe anticipatamente il monitoraggio conservando i dati.</span>
                  </div>
                </div>
              </button>
            )}

            <button
              type="button"
              disabled={loading}
              onClick={() => {
                if (confirm("Sei sicuro di voler eliminare definitivamente questo ciclo? Tutte le misurazioni associate andranno perse.")) {
                  handleAction("delete");
                }
              }}
              className="w-full p-4 rounded-2xl bg-error-container/10 hover:bg-error-container/30 border border-error/20 text-left flex items-center justify-between transition-all"
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-error text-2xl">delete_forever</span>
                <div>
                  <span className="text-sm font-bold text-error block">Elimina Definitivamente</span>
                  <span className="text-xs text-error/80">Rimuove il ciclo e le misurazioni dal database.</span>
                </div>
              </div>
            </button>
          </div>
        </div>

        <div className="p-4 bg-surface-container border-t border-surface-variant/40 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-secondary hover:bg-surface-container-high"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
};
