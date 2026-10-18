"use client";

import React, { useState } from "react";
import { createPaziente } from "@/db/actions";
import { StethoscopeLoader } from "@/components/StethoscopeLoader";

export interface NuovoPazienteCreato {
  id: string;
  nome: string;
  cognome: string;
  codiceFiscale: string;
  pin: string;
}

interface NuovoPazienteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (paziente: NuovoPazienteCreato) => void;
  medicoId?: string;
}

export const NuovoPazienteModal: React.FC<NuovoPazienteModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [nome, setNome] = useState("");
  const [cognome, setCognome] = useState("");
  const [cf, setCf] = useState("");
  const [dataNascita, setDataNascita] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState(() => Math.floor(100000 + Math.random() * 900000).toString());
  const [copiedPin, setCopiedPin] = useState(false);
  const [durataSettimane, setDurataSettimane] = useState(2);
  const [noteAnamnesi, setNoteAnamnesi] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const generateNewPin = () => {
    setPin(Math.floor(100000 + Math.random() * 900000).toString());
    setCopiedPin(false);
  };

  const handleCopyPin = async () => {
    try {
      await navigator.clipboard.writeText(pin);
      setCopiedPin(true);
      setTimeout(() => setCopiedPin(false), 2000);
    } catch {}
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome || !cognome || !cf || !telefono || !pin || !dataNascita) {
      setError("Compila tutti i campi obbligatori contrassegnati con *.");
      return;
    }
    if (cf.length < 16) {
      setError("Il Codice Fiscale deve contenere 16 caratteri.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await createPaziente({
        nome,
        cognome,
        codiceFiscale: cf,
        dataNascita,
        telefono,
        email: email || undefined,
        pin,
        noteAnamnesi: noteAnamnesi || undefined,
        durataSettimanePrimoCiclo: durataSettimane,
      });

      if (res.success) {
        onSuccess({
          id: res.pazienteId,
          nome: nome.trim(),
          cognome: cognome.trim(),
          codiceFiscale: cf.trim().toUpperCase(),
          pin: pin.trim(),
        });
      } else {
        setError(res.error || "Errore durante il salvataggio del paziente.");
      }
    } catch {
      setError("Si è verificato un errore nel salvataggio.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-inverse-surface/40 backdrop-blur-sm animate-in fade-in duration-200">
      {loading && <StethoscopeLoader overlay text="Salvataggio paziente in corso..." />}
      <div className="bg-surface-container-lowest w-full max-w-xl rounded-t-3xl sm:rounded-3xl shadow-2xl border-t sm:border border-surface-variant/50 overflow-hidden max-h-[88vh] sm:max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-6 sm:slide-in-from-bottom-0 duration-300">
        {/* Mobile drag handle */}
        <div className="sm:hidden pt-3 pb-1 flex justify-center flex-shrink-0">
          <div className="w-12 h-1.5 bg-outline/25 rounded-full" />
        </div>

        {/* Modal Header */}
        <div className="p-4 sm:p-6 pb-3 sm:pb-4 border-b border-surface-variant/40 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-container/40 text-primary flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-2xl">person_add</span>
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-headline font-bold text-on-surface leading-tight">Censisci Nuovo Paziente</h2>
              <p className="text-xs text-on-surface-variant line-clamp-1 sm:line-clamp-none">Inserisci i dati anagrafici e genera il PIN per l&apos;accesso al diario.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-outline hover:bg-surface-container flex-shrink-0"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-error-container text-on-error-container text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-error text-base">error</span>
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-on-surface">Nome *</label>
              <input
                type="text"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="es. Mario"
                className="w-full h-11 px-3 mt-1 bg-surface-container-low rounded-xl text-sm border border-surface-variant/50 focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-on-surface">Cognome *</label>
              <input
                type="text"
                required
                value={cognome}
                onChange={(e) => setCognome(e.target.value)}
                placeholder="es. Rossi"
                className="w-full h-11 px-3 mt-1 bg-surface-container-low rounded-xl text-sm border border-surface-variant/50 focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-on-surface">Codice Fiscale *</label>
              <input
                type="text"
                required
                maxLength={16}
                value={cf}
                onChange={(e) => setCf(e.target.value.toUpperCase())}
                placeholder="RSSMRA70A01H501U"
                className="w-full h-11 px-3 mt-1 bg-surface-container-low rounded-xl text-sm font-mono uppercase border border-surface-variant/50 focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-on-surface">Data di Nascita *</label>
              <input
                type="date"
                required
                value={dataNascita}
                onChange={(e) => setDataNascita(e.target.value)}
                className="w-full h-11 px-3 mt-1 bg-surface-container-low rounded-xl text-sm border border-surface-variant/50 focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-on-surface">Telefono / Cellulare *</label>
              <input
                type="tel"
                required
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="+39 333 1234567"
                className="w-full h-11 px-3 mt-1 bg-surface-container-low rounded-xl text-sm border border-surface-variant/50 focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-on-surface">Email (Facoltativa)</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="mario.rossi@email.it"
                className="w-full h-11 px-3 mt-1 bg-surface-container-low rounded-xl text-sm border border-surface-variant/50 focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>
          </div>

          {/* Generated PIN Box */}
          <div className="p-4 rounded-2xl bg-secondary-container/50 border border-secondary/20 flex items-center justify-between gap-2">
            <div>
              <span className="text-xs font-bold text-on-secondary-container block">
                PIN di Accesso Generato (6 cifre)
              </span>
              <span className="text-2xl font-mono font-extrabold text-primary tracking-widest">
                {pin}
              </span>
              <p className="text-[11px] text-secondary">Verrà mostrato nella scheda credenziali appena creato il paziente.</p>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                type="button"
                onClick={handleCopyPin}
                title="Copia PIN"
                className="px-3 py-1.5 rounded-xl bg-surface-container-lowest text-xs font-bold text-primary hover:bg-surface-container flex items-center gap-1 shadow-sm"
              >
                <span className="material-symbols-outlined text-sm">
                  {copiedPin ? "check" : "content_copy"}
                </span>
                {copiedPin ? "Copiato" : "Copia PIN"}
              </button>
              <button
                type="button"
                onClick={generateNewPin}
                className="px-3 py-1.5 rounded-xl bg-surface-container-lowest text-xs font-bold text-primary hover:bg-surface-container flex items-center gap-1 shadow-sm"
              >
                <span className="material-symbols-outlined text-sm">refresh</span>
                Rigenera
              </button>
            </div>
          </div>

          {/* First Cycle Duration */}
          <div>
            <label className="text-xs font-bold text-on-surface">Durata Primo Ciclo di Controllo</label>
            <select
              value={durataSettimane}
              onChange={(e) => setDurataSettimane(Number(e.target.value))}
              className="w-full h-11 pl-3.5 pr-9 mt-1 bg-surface-container-low rounded-xl text-sm border border-surface-variant/50 focus:ring-2 focus:ring-primary focus:outline-none cursor-pointer"
            >
              <option value={1}>1 Settimana (7 Giorni)</option>
              <option value={2}>2 Settimane (14 Giorni - Consigliato)</option>
              <option value={3}>3 Settimane (21 Giorni)</option>
              <option value={4}>4 Settimane (28 Giorni / 1 Mese)</option>
            </select>
          </div>

          {/* Anamnesi */}
          <div>
            <label className="text-xs font-bold text-on-surface">Note Cliniche / Terapia Iniziale (Facoltativo)</label>
            <textarea
              rows={2}
              value={noteAnamnesi}
              onChange={(e) => setNoteAnamnesi(e.target.value)}
              placeholder="es. Sospetta ipertensione da monitorare, indicazioni terapeutiche..."
              className="w-full p-3 mt-1 bg-surface-container-low rounded-xl text-sm border border-surface-variant/50 focus:ring-2 focus:ring-primary focus:outline-none"
            />
          </div>

          {/* Submit buttons */}
          <div className="pt-3 border-t border-surface-variant/30 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-secondary hover:bg-surface-container text-center"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-on-primary text-sm font-bold shadow-sm flex items-center justify-center gap-2"
            >
              {loading ? "Salvataggio..." : "Censisci e Genera Scheda"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
