"use client";

import React, { useEffect, useState } from "react";
import { AlertCircle, Ban, PauseCircle, PlayCircle, Settings, Trash2, X } from "lucide-react";
import { updateStatoCiclo, deleteCiclo } from "@/db/actions";
import { StethoscopeLoader } from "@/components/StethoscopeLoader";
import { AppDialog } from "@/components/ui/AppDialog";

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
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setConfirmDelete(false);
    }
  }, [isOpen]);

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
    <AppDialog
      isOpen={isOpen}
      onClose={loading ? () => {} : onClose}
      labelledBy="gestione-ciclo-title"
      dismissible={!loading}
      variant="sheet"
      maxWidthClassName="max-w-md"
    >
      {loading && <StethoscopeLoader overlay text="Aggiornamento diario in corso..." />}

      <div className="p-4 sm:p-6 pb-3 sm:pb-4 border-b border-surface-variant/40 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-secondary-container text-tertiary flex items-center justify-center shrink-0">
            <Settings className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h1 id="gestione-ciclo-title" className="text-lg sm:text-xl font-headline font-bold text-on-surface leading-tight">
              Gestione Ciclo
            </h1>
            <p className="text-xs text-on-surface-variant">
              Stato attuale: <strong className="uppercase">{currentStato}</strong>
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Chiudi gestione ciclo"
          className="min-w-[40px] min-h-[40px] rounded-full flex items-center justify-center text-secondary hover:bg-surface-container"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>

      <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
        {error && (
          <div
            role="alert"
            className="p-3 rounded-xl bg-error-container text-on-error-container text-xs flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 text-error shrink-0" aria-hidden="true" />
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
              className="w-full p-4 rounded-2xl bg-surface-container-low hover:bg-surface-container border border-surface-variant/40 text-left flex items-center gap-3 transition-colors"
            >
              <PauseCircle className="w-6 h-6 text-tertiary shrink-0" aria-hidden="true" />
              <div>
                <span className="text-sm font-bold text-on-surface block">Metti in Pausa il Ciclo</span>
                <span className="text-xs text-secondary">Sospende temporaneamente le notifiche per il paziente.</span>
              </div>
            </button>
          )}

          {currentStato === "in pausa" && (
            <button
              type="button"
              disabled={loading}
              onClick={() => handleAction("resume")}
              className="w-full p-4 rounded-2xl bg-primary-container/20 hover:bg-primary-container/40 border border-primary/30 text-left flex items-center gap-3 transition-colors"
            >
              <PlayCircle className="w-6 h-6 text-primary shrink-0" aria-hidden="true" />
              <div>
                <span className="text-sm font-bold text-primary block">Riattiva Ciclo</span>
                <span className="text-xs text-on-surface-variant">Ripristina lo stato &quot;In Corso&quot; e i promemoria quotidiani.</span>
              </div>
            </button>
          )}

          {currentStato !== "annullato" && currentStato !== "concluso" && (
            <button
              type="button"
              disabled={loading}
              onClick={() => handleAction("cancel")}
              className="w-full p-4 rounded-2xl bg-surface-container-low hover:bg-error-container/20 border border-surface-variant/40 hover:border-error/30 text-left flex items-center gap-3 transition-colors"
            >
              <Ban className="w-6 h-6 text-error shrink-0" aria-hidden="true" />
              <div>
                <span className="text-sm font-bold text-on-surface block">Annulla Ciclo</span>
                <span className="text-xs text-secondary">Interrompe anticipatamente il monitoraggio conservando i dati.</span>
              </div>
            </button>
          )}

          {confirmDelete ? (
            <div className="p-4 rounded-2xl bg-error-container/35 border border-error/40 space-y-3">
              <p className="text-xs font-bold text-error leading-relaxed">
                Confermi l&apos;eliminazione definitiva di questo ciclo e di tutte le sue misurazioni?
              </p>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="min-h-[40px] px-3.5 rounded-xl bg-surface-container text-xs font-semibold text-on-surface"
                >
                  Annulla
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleAction("delete")}
                  className="min-h-[40px] px-4 rounded-xl bg-error text-on-error text-xs font-bold"
                >
                  Sì, elimina definitivamente
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              disabled={loading}
              onClick={() => setConfirmDelete(true)}
              className="w-full p-4 rounded-2xl bg-error-container/10 hover:bg-error-container/30 border border-error/20 text-left flex items-center gap-3 transition-colors"
            >
              <Trash2 className="w-6 h-6 text-error shrink-0" aria-hidden="true" />
              <div>
                <span className="text-sm font-bold text-error block">Elimina Definitivamente</span>
                <span className="text-xs text-error/80">Rimuove il ciclo e le misurazioni dal database.</span>
              </div>
            </button>
          )}
        </div>
      </div>

      <div className="p-3 sm:p-4 bg-surface-container border-t border-surface-variant/40 flex justify-end shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="min-h-[42px] px-4 py-2 rounded-xl text-sm font-semibold text-secondary hover:bg-surface-container-high"
        >
          Chiudi
        </button>
      </div>
    </AppDialog>
  );
};
