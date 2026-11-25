"use client";

import React, { useEffect, useState } from "react";
import { AlertCircle, FilePlus2, ShieldCheck, X } from "lucide-react";
import { createNuovoCiclo } from "@/db/actions";
import { StethoscopeLoader } from "@/components/StethoscopeLoader";
import { AppDialog } from "@/components/ui/AppDialog";

interface NuovoCicloModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  pazienteId: string;
  medicoId: string;
  paziente?: {
    nome: string;
    cognome: string;
    codiceFiscale: string;
    dataNascita?: string;
    telefono?: string;
  };
}

export const NuovoCicloModal: React.FC<NuovoCicloModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  pazienteId,
  medicoId,
  paziente,
}) => {
  const [durataSettimane, setDurataSettimane] = useState(2);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setDurataSettimane(2);
      setNote("");
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await createNuovoCiclo(pazienteId, medicoId, durataSettimane, note);
      if (res.success) {
        setNote("");
        onSuccess();
        onClose();
      }
    } catch {
      setError("Errore nella creazione del diario.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppDialog
      isOpen={isOpen}
      onClose={loading ? () => {} : onClose}
      labelledBy="nuovo-ciclo-title"
      dismissible={!loading}
      variant="sheet"
      maxWidthClassName="max-w-lg"
    >
      {loading && <StethoscopeLoader overlay text="Creazione nuovo diario in corso..." />}

      <div className="p-4 sm:p-6 pb-3 sm:pb-4 border-b border-surface-variant/40 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-container/40 text-primary flex items-center justify-center shrink-0">
            <FilePlus2 className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h1 id="nuovo-ciclo-title" className="text-lg sm:text-xl font-headline font-bold text-on-surface leading-tight">
              Inserisci Nuovo Diario
            </h1>
            <p className="text-xs text-on-surface-variant">
              Avvia un nuovo diario pressorio per l&apos;utente selezionato.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Chiudi modulo nuovo diario"
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

        {paziente && (
          <div className="p-4 rounded-2xl bg-surface-container-low border border-surface-variant/50 space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-[11px] font-bold text-primary uppercase tracking-wider">
                Dati Paziente Precompilati
              </span>
              <span className="text-[11px] font-semibold text-secondary flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
                <span>PIN di accesso già attivo</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[11px] font-bold text-secondary block">Nome e Cognome</span>
                <p className="mt-0.5 px-3 py-2 bg-surface-container rounded-xl font-bold text-on-surface border border-surface-variant/40">
                  {paziente.nome} {paziente.cognome}
                </p>
              </div>
              <div>
                <span className="text-[11px] font-bold text-secondary block">Codice Fiscale</span>
                <p className="mt-0.5 px-3 py-2 bg-surface-container rounded-xl font-mono font-bold text-on-surface border border-surface-variant/40">
                  {paziente.codiceFiscale}
                </p>
              </div>
              {paziente.dataNascita && (
                <div>
                  <span className="text-[11px] font-bold text-secondary block">Data di Nascita</span>
                  <p className="mt-0.5 px-3 py-2 bg-surface-container rounded-xl font-semibold text-on-surface border border-surface-variant/40">
                    {paziente.dataNascita}
                  </p>
                </div>
              )}
              {paziente.telefono && (
                <div>
                  <span className="text-[11px] font-bold text-secondary block">Telefono</span>
                  <p className="mt-0.5 px-3 py-2 bg-surface-container rounded-xl font-semibold text-on-surface border border-surface-variant/40">
                    {paziente.telefono}
                  </p>
                </div>
              )}
            </div>

            <p className="text-[11px] text-on-surface-variant leading-snug">
              Non è necessario generare un nuovo PIN: il paziente accederà al nuovo diario con le proprie credenziali o passkey già in uso.
            </p>
          </div>
        )}

        <div className="p-3 rounded-2xl bg-secondary-container/40 text-xs text-on-secondary-container leading-relaxed">
          <p className="font-semibold">Nota di avvio:</p>
          <p>
            Il diario rimarrà nello stato <strong>&quot;Da Iniziare&quot;</strong> finché il paziente non registrerà la sua prima misurazione. Da quel giorno inizierà il computo effettivo.
          </p>
        </div>

        <div>
          <label htmlFor="ciclo-durata" className="text-xs font-bold text-on-surface uppercase tracking-wider block">
            Durata del Diario *
          </label>
          <select
            id="ciclo-durata"
            name="durataSettimane"
            value={durataSettimane}
            onChange={(e) => setDurataSettimane(Number(e.target.value))}
            className="w-full min-h-[46px] pl-3.5 pr-9 mt-1 bg-surface-container-low rounded-xl text-sm border border-surface-variant/50 focus:outline-none cursor-pointer"
          >
            <option value={1}>1 Settimana (7 Giorni)</option>
            <option value={2}>2 Settimane (14 Giorni - Standard)</option>
            <option value={3}>3 Settimane (21 Giorni)</option>
            <option value={4}>4 Settimane (28 Giorni / 1 Mese)</option>
          </select>
        </div>

        <div>
          <label htmlFor="ciclo-note" className="text-xs font-bold text-on-surface uppercase tracking-wider block">
            Indicazioni Mediche sul Diario (Facoltativo)
          </label>
          <textarea
            id="ciclo-note"
            name="note"
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="es. Verificare la risposta pressoria alla nuova posologia..."
            className="w-full p-3 mt-1 bg-surface-container-low rounded-xl text-sm border border-surface-variant/50 focus:outline-none"
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
            {loading ? "Salvataggio..." : "Crea Nuovo Diario"}
          </button>
        </div>
      </form>
    </AppDialog>
  );
};
