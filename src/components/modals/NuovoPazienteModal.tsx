"use client";

import React, { useEffect, useState } from "react";
import { AlertCircle, Check, Copy, RefreshCw, UserPlus, X } from "lucide-react";
import { createPaziente } from "@/db/actions";
import { StethoscopeLoader } from "@/components/StethoscopeLoader";
import { AppDialog } from "@/components/ui/AppDialog";

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

function randomPin6(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
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
  const [pin, setPin] = useState(randomPin6);
  const [copiedPin, setCopiedPin] = useState(false);
  const [durataSettimane, setDurataSettimane] = useState(2);
  const [noteAnamnesi, setNoteAnamnesi] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setNome("");
      setCognome("");
      setCf("");
      setDataNascita("");
      setTelefono("");
      setEmail("");
      setPin(randomPin6());
      setCopiedPin(false);
      setDurataSettimane(2);
      setNoteAnamnesi("");
      setError(null);
    }
  }, [isOpen]);

  const generateNewPin = () => {
    setPin(randomPin6());
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
    if (cf.trim().length < 16) {
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
      setError("Si è verificato un errore nel salvataggio (verifica che il Codice Fiscale non sia già censito).");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppDialog
      isOpen={isOpen}
      onClose={loading ? () => {} : onClose}
      labelledBy="nuovo-paziente-title"
      dismissible={!loading}
      variant="sheet"
      maxWidthClassName="max-w-xl"
    >
      {loading && <StethoscopeLoader overlay text="Salvataggio paziente in corso..." />}

      <div className="p-4 sm:p-6 pb-3 sm:pb-4 border-b border-surface-variant/40 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-container/40 text-primary flex items-center justify-center shrink-0">
            <UserPlus className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h1 id="nuovo-paziente-title" className="text-lg sm:text-xl font-headline font-bold text-on-surface leading-tight">
              Censisci Nuovo Paziente
            </h1>
            <p className="text-xs text-on-surface-variant">
              Inserisci i dati anagrafici e genera il PIN per l&apos;accesso al diario.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Chiudi modulo nuovo paziente"
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="paz-nome" className="text-xs font-bold text-on-surface block">
              Nome *
            </label>
            <input
              id="paz-nome"
              name="nome"
              type="text"
              autoComplete="given-name"
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="es. Mario"
              className="w-full min-h-[46px] px-3 mt-1 bg-surface-container-low rounded-xl text-sm border border-surface-variant/50 focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="paz-cognome" className="text-xs font-bold text-on-surface block">
              Cognome *
            </label>
            <input
              id="paz-cognome"
              name="cognome"
              type="text"
              autoComplete="family-name"
              required
              value={cognome}
              onChange={(e) => setCognome(e.target.value)}
              placeholder="es. Rossi"
              className="w-full min-h-[46px] px-3 mt-1 bg-surface-container-low rounded-xl text-sm border border-surface-variant/50 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="paz-cf" className="text-xs font-bold text-on-surface block">
              Codice Fiscale *
            </label>
            <input
              id="paz-cf"
              name="codiceFiscale"
              type="text"
              required
              maxLength={16}
              minLength={16}
              autoCorrect="off"
              autoCapitalize="characters"
              spellCheck={false}
              value={cf}
              onChange={(e) => setCf(e.target.value.toUpperCase())}
              placeholder="RSSMRA70A01H501U"
              className="w-full min-h-[46px] px-3 mt-1 bg-surface-container-low rounded-xl text-sm font-mono uppercase border border-surface-variant/50 focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="paz-nascita" className="text-xs font-bold text-on-surface block">
              Data di Nascita *
            </label>
            <input
              id="paz-nascita"
              name="dataNascita"
              type="date"
              autoComplete="bday"
              required
              value={dataNascita}
              onChange={(e) => setDataNascita(e.target.value)}
              className="w-full min-h-[46px] px-3 mt-1 bg-surface-container-low rounded-xl text-sm border border-surface-variant/50 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="paz-tel" className="text-xs font-bold text-on-surface block">
              Telefono / Cellulare *
            </label>
            <input
              id="paz-tel"
              name="telefono"
              type="tel"
              autoComplete="tel"
              required
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="+39 333 1234567"
              className="w-full min-h-[46px] px-3 mt-1 bg-surface-container-low rounded-xl text-sm border border-surface-variant/50 focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="paz-email" className="text-xs font-bold text-on-surface block">
              Email (Facoltativa)
            </label>
            <input
              id="paz-email"
              name="email"
              type="email"
              autoComplete="email"
              spellCheck={false}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="mario.rossi@email.it"
              className="w-full min-h-[46px] px-3 mt-1 bg-surface-container-low rounded-xl text-sm border border-surface-variant/50 focus:outline-none"
            />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-secondary-container/50 border border-secondary/20 flex items-center justify-between gap-2 flex-wrap">
          <div>
            <span className="text-xs font-bold text-on-secondary-container block">
              PIN di Accesso Generato (6 cifre)
            </span>
            <span className="text-2xl font-mono font-extrabold text-primary tracking-widest">
              {pin}
            </span>
            <p className="text-[11px] text-secondary">
              Verrà mostrato nella scheda credenziali appena creato il paziente.
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleCopyPin}
              className="min-h-[40px] px-3 py-1.5 rounded-xl bg-surface-container-lowest text-xs font-bold text-primary hover:bg-surface-container flex items-center gap-1 shadow-sm"
            >
              {copiedPin ? (
                <Check className="w-4 h-4" aria-hidden="true" />
              ) : (
                <Copy className="w-4 h-4" aria-hidden="true" />
              )}
              <span>{copiedPin ? "Copiato" : "Copia PIN"}</span>
            </button>
            <button
              type="button"
              onClick={generateNewPin}
              className="min-h-[40px] px-3 py-1.5 rounded-xl bg-surface-container-lowest text-xs font-bold text-primary hover:bg-surface-container flex items-center gap-1 shadow-sm"
            >
              <RefreshCw className="w-4 h-4" aria-hidden="true" />
              <span>Rigenera</span>
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="paz-durata" className="text-xs font-bold text-on-surface block">
            Durata Primo Ciclo di Controllo
          </label>
          <select
            id="paz-durata"
            name="durataSettimane"
            value={durataSettimane}
            onChange={(e) => setDurataSettimane(Number(e.target.value))}
            className="w-full min-h-[46px] pl-3.5 pr-9 mt-1 bg-surface-container-low rounded-xl text-sm border border-surface-variant/50 focus:outline-none cursor-pointer"
          >
            <option value={1}>1 Settimana (7 Giorni)</option>
            <option value={2}>2 Settimane (14 Giorni - Consigliato)</option>
            <option value={3}>3 Settimane (21 Giorni)</option>
            <option value={4}>4 Settimane (28 Giorni / 1 Mese)</option>
          </select>
        </div>

        <div>
          <label htmlFor="paz-anamnesi" className="text-xs font-bold text-on-surface block">
            Note Cliniche / Terapia Iniziale (Facoltativo)
          </label>
          <textarea
            id="paz-anamnesi"
            name="noteAnamnesi"
            rows={2}
            value={noteAnamnesi}
            onChange={(e) => setNoteAnamnesi(e.target.value)}
            placeholder="es. Sospetta ipertensione da monitorare, indicazioni terapeutiche..."
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
            {loading ? "Salvataggio..." : "Censisci e Genera Scheda"}
          </button>
        </div>
      </form>
    </AppDialog>
  );
};
