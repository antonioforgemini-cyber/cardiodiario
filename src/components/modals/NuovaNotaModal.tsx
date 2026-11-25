"use client";

import React, { useEffect, useState } from "react";
import { AlertCircle, ClipboardList, Eye, Lock, X } from "lucide-react";
import { addNotaTerapia } from "@/db/actions";
import { StethoscopeLoader } from "@/components/StethoscopeLoader";
import { AppDialog } from "@/components/ui/AppDialog";

interface NuovaNotaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  pazienteId: string;
  medicoId: string;
}

export const NuovaNotaModal: React.FC<NuovaNotaModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  pazienteId,
  medicoId,
}) => {
  const [testo, setTesto] = useState("");
  const [visibilePaziente, setVisibilePaziente] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTesto("");
      setVisibilePaziente(true);
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testo.trim()) {
      setError("Inserisci il testo della nota clinica.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await addNotaTerapia(pazienteId, medicoId, testo, visibilePaziente);
      if (res.success) {
        onSuccess();
        onClose();
      }
    } catch {
      setError("Errore nel salvataggio della nota.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppDialog
      isOpen={isOpen}
      onClose={loading ? () => {} : onClose}
      labelledBy="nuova-nota-title"
      dismissible={!loading}
      variant="sheet"
      maxWidthClassName="max-w-lg"
    >
      {loading && <StethoscopeLoader overlay text="Salvataggio nota clinica..." />}

      <div className="p-4 sm:p-6 pb-3 sm:pb-4 border-b border-surface-variant/40 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-container/40 text-primary flex items-center justify-center shrink-0">
            <ClipboardList className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h1 id="nuova-nota-title" className="text-lg sm:text-xl font-headline font-bold text-on-surface leading-tight">
              Nuova Nota Clinica
            </h1>
            <p className="text-xs text-on-surface-variant">
              Aggiungi indicazioni sul trattamento o annotazioni private.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Chiudi modulo nota clinica"
          className="min-w-[40px] min-h-[40px] rounded-full flex items-center justify-center text-secondary hover:bg-surface-container"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
        {error && (
          <div
            role="alert"
            className="p-3 rounded-xl bg-error-container text-on-error-container text-xs flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 text-error shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        <fieldset className="space-y-2">
          <legend className="text-xs font-bold text-on-surface uppercase tracking-wider block">
            Tipologia di Nota
          </legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
            <button
              type="button"
              aria-pressed={visibilePaziente}
              onClick={() => setVisibilePaziente(true)}
              className={`p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-colors ${
                visibilePaziente
                  ? "bg-primary-container/30 border-primary shadow-sm"
                  : "bg-surface-container-low border-surface-variant/40 opacity-75"
              }`}
            >
              <Eye className="w-5 h-5 text-primary mt-0.5 shrink-0" aria-hidden="true" />
              <div>
                <span className="text-xs font-bold text-on-surface block">Nota per il Paziente</span>
                <span className="text-[11px] text-on-surface-variant leading-tight block mt-0.5">
                  Visibile al paziente nell&apos;app come promemoria terapia.
                </span>
              </div>
            </button>

            <button
              type="button"
              aria-pressed={!visibilePaziente}
              onClick={() => setVisibilePaziente(false)}
              className={`p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-colors ${
                !visibilePaziente
                  ? "bg-secondary-container border-tertiary shadow-sm"
                  : "bg-surface-container-low border-surface-variant/40 opacity-75"
              }`}
            >
              <Lock className="w-5 h-5 text-tertiary mt-0.5 shrink-0" aria-hidden="true" />
              <div>
                <span className="text-xs font-bold text-on-surface block">Nota Privata Medico</span>
                <span className="text-[11px] text-on-surface-variant leading-tight block mt-0.5">
                  Riservata esclusivamente all&apos;equipe medica.
                </span>
              </div>
            </button>
          </div>
        </fieldset>

        <div className="space-y-1">
          <label htmlFor="nota-testo" className="text-xs font-bold text-on-surface uppercase tracking-wider block">
            Testo della Nota *
          </label>
          <textarea
            id="nota-testo"
            name="testo"
            required
            rows={4}
            value={testo}
            onChange={(e) => setTesto(e.target.value)}
            placeholder={
              visibilePaziente
                ? "es. Assumere 1 compressa di Ramipril 5mg ogni mattina dopo colazione..."
                : "es. Valutare ecocardiogramma e aggiunta di beta-bloccante se i valori rimangono stabili..."
            }
            className="w-full p-3 bg-surface-container-low rounded-xl text-sm border border-surface-variant/50 focus:outline-none"
          />
        </div>

        <div className="pt-3 border-t border-surface-variant/30 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-4 py-2 rounded-xl text-sm font-semibold text-secondary hover:bg-surface-container text-center"
          >
            Annulla
          </button>
          <button
            type="submit"
            disabled={loading}
            className="min-h-[44px] px-6 py-2 rounded-xl bg-primary hover:bg-primary/90 text-on-primary text-sm font-bold shadow-sm flex items-center justify-center gap-2"
          >
            {loading ? "Salvataggio..." : "Salva Nota Clinica"}
          </button>
        </div>
      </form>
    </AppDialog>
  );
};
