"use client";

import React, { useState } from "react";
import { addNotaTerapia } from "@/db/actions";

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

  if (!isOpen) return null;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-inverse-surface/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface-container-lowest w-full max-w-lg rounded-3xl shadow-2xl border border-surface-variant/50 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-surface-variant/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-container/40 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">clinical_notes</span>
            </div>
            <div>
              <h2 className="text-xl font-headline font-bold text-on-surface">Nuova Nota Clinica / Terapeutica</h2>
              <p className="text-xs text-on-surface-variant">Aggiungi indicazioni sul trattamento o annotazioni private.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-outline hover:bg-surface-container"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-error-container text-on-error-container text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-error text-base">error</span>
              <span>{error}</span>
            </div>
          )}

          {/* Visibility Switch */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-on-surface uppercase tracking-wider block">
              Tipologia di Nota
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setVisibilePaziente(true)}
                className={`p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                  visibilePaziente
                    ? "bg-primary-container/30 border-primary shadow-sm"
                    : "bg-surface-container-low border-surface-variant/40 opacity-70"
                }`}
              >
                <span className="material-symbols-outlined text-primary text-xl mt-0.5">
                  visibility
                </span>
                <div>
                  <span className="text-xs font-bold text-on-surface block">
                    Nota per il Paziente
                  </span>
                  <span className="text-[11px] text-on-surface-variant leading-tight block mt-0.5">
                    Visibile al paziente nell&apos;app come promemoria terapia.
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setVisibilePaziente(false)}
                className={`p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                  !visibilePaziente
                    ? "bg-secondary-container border-tertiary shadow-sm"
                    : "bg-surface-container-low border-surface-variant/40 opacity-70"
                }`}
              >
                <span className="material-symbols-outlined text-tertiary text-xl mt-0.5">
                  lock
                </span>
                <div>
                  <span className="text-xs font-bold text-on-surface block">
                    Nota Privata Medico
                  </span>
                  <span className="text-[11px] text-on-surface-variant leading-tight block mt-0.5">
                    Riservata esclusivamente all&apos;equipe medica.
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Testo */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-on-surface uppercase tracking-wider">
              Testo della Nota *
            </label>
            <textarea
              required
              rows={4}
              value={testo}
              onChange={(e) => setTesto(e.target.value)}
              placeholder={
                visibilePaziente
                  ? "es. Assumere 1 compressa di Ramipril 5mg ogni mattina dopo colazione..."
                  : "es. Valutare ecocardiogramma e aggiunta di beta-bloccante se i valori rimangono stabili..."
              }
              className="w-full p-3 bg-surface-container-low rounded-xl text-sm border border-surface-variant/50 focus:ring-2 focus:ring-primary focus:outline-none"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-secondary hover:bg-surface-container"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-on-primary text-sm font-bold shadow-sm flex items-center gap-2"
            >
              {loading ? "Salvataggio..." : "Salva Nota Clinica"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
