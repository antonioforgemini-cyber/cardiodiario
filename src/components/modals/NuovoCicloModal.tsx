"use client";

import React, { useState } from "react";
import { createNuovoCiclo } from "@/db/actions";

interface NuovoCicloModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  pazienteId: string;
  medicoId: string;
}

export const NuovoCicloModal: React.FC<NuovoCicloModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  pazienteId,
  medicoId,
}) => {
  const [durataSettimane, setDurataSettimane] = useState(2);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await createNuovoCiclo(pazienteId, medicoId, durataSettimane, note);
      if (res.success) {
        onSuccess();
        onClose();
      }
    } catch {
      setError("Errore nella creazione del ciclo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-inverse-surface/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface-container-lowest w-full max-w-md rounded-3xl shadow-2xl border border-surface-variant/50 overflow-hidden flex flex-col">
        <div className="p-6 pb-4 border-b border-surface-variant/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-container/40 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">update</span>
            </div>
            <div>
              <h2 className="text-xl font-headline font-bold text-on-surface">Nuovo Ciclo di Controllo</h2>
              <p className="text-xs text-on-surface-variant">Stabilisci la durata del nuovo diario pressorio.</p>
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

          <div className="p-3 rounded-2xl bg-secondary-container/40 text-xs text-on-secondary-container leading-relaxed">
            <p className="font-semibold">Nota di avvio:</p>
            Il ciclo rimarrà nello stato <strong>&quot;Da Iniziare&quot;</strong> finché il paziente non registrerà la sua prima misurazione. Da quel giorno inizierà il computo effettivo.
          </div>

          <div>
            <label className="text-xs font-bold text-on-surface uppercase tracking-wider block">
              Durata del Ciclo *
            </label>
            <select
              value={durataSettimane}
              onChange={(e) => setDurataSettimane(Number(e.target.value))}
              className="w-full h-11 pl-3.5 pr-9 mt-1 bg-surface-container-low rounded-xl text-sm border border-surface-variant/50 focus:ring-2 focus:ring-primary focus:outline-none cursor-pointer"
            >
              <option value={1}>1 Settimana (7 Giorni)</option>
              <option value={2}>2 Settimane (14 Giorni - Standard)</option>
              <option value={3}>3 Settimane (21 Giorni)</option>
              <option value={4}>4 Settimane (28 Giorni / 1 Mese)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-on-surface uppercase tracking-wider block">
              Indicazioni Mediche sul Ciclo (Facoltativo)
            </label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="es. Verificare la risposta pressoria alla nuova posologia..."
              className="w-full p-3 mt-1 bg-surface-container-low rounded-xl text-sm border border-surface-variant/50 focus:ring-2 focus:ring-primary focus:outline-none"
            />
          </div>

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
              {loading ? "Creazione..." : "Crea Ciclo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
