"use client";

import React, { useEffect, useState } from "react";
import { AlertCircle, Check, Copy, Printer, RefreshCw, Share2 } from "lucide-react";
import { Logo } from "@/components/Logo";
import { StethoscopeLoader } from "@/components/StethoscopeLoader";
import { rigeneraPinPaziente } from "@/db/actions";
import { AppDialog } from "@/components/ui/AppDialog";

interface SchedaCredenzialiModalProps {
  isOpen: boolean;
  onClose: () => void;
  medicoNome?: string;
  paziente: {
    id?: string;
    nome: string;
    cognome: string;
    codiceFiscale: string;
    pin?: string;
  };
}

export const SchedaCredenzialiModal: React.FC<SchedaCredenzialiModalProps> = ({
  isOpen,
  onClose,
  medicoNome = "Dott.ssa Ivana Pariggiano",
  paziente,
}) => {
  const [currentPin, setCurrentPin] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [confirmRegen, setConfirmRegen] = useState(false);
  const [copiedPin, setCopiedPin] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const initial =
        paziente.pin && /^\d{6}$/.test(paziente.pin.trim()) ? paziente.pin.trim() : null;
      setCurrentPin(initial);
      setConfirmRegen(false);
      setCopiedPin(false);
      setCopiedAll(false);
      setError(null);
    }
  }, [isOpen, paziente.pin, paziente.id]);

  const handlePrint = () => {
    document.body.classList.add("printing-credenziali");
    window.print();
  };

  const handleCopyPin = async () => {
    if (!currentPin) return;
    try {
      await navigator.clipboard.writeText(currentPin);
      setCopiedPin(true);
      setTimeout(() => setCopiedPin(false), 2000);
    } catch {}
  };

  const handleCopyCredenziali = async () => {
    if (!currentPin) return;
    const baseUrl =
      typeof window !== "undefined" ? window.location.origin : "https://cardiodiario.vercel.app";
    const text = `CardioDiario - Credenziali di accesso per ${paziente.nome} ${paziente.cognome}\nCodice Fiscale: ${paziente.codiceFiscale}\nPIN personale: ${currentPin}\nAccedi da: ${baseUrl}/login/paziente`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    } catch {}
  };

  const handleRigeneraPinConfirmed = async () => {
    if (!paziente.id) return;
    setConfirmRegen(false);
    setRegenerating(true);
    setError(null);
    try {
      const res = await rigeneraPinPaziente(paziente.id);
      if (res.success) {
        setCurrentPin(res.pin);
      }
    } catch {
      setError("Impossibile rigenerare il PIN. Riprova.");
    } finally {
      setRegenerating(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    const beforePrint = () => {
      document.body.classList.add("printing-credenziali");
    };
    const afterPrint = () => {
      document.body.classList.remove("printing-credenziali");
    };

    window.addEventListener("beforeprint", beforePrint);
    window.addEventListener("afterprint", afterPrint);

    return () => {
      window.removeEventListener("beforeprint", beforePrint);
      window.removeEventListener("afterprint", afterPrint);
      document.body.classList.remove("printing-credenziali");
    };
  }, [isOpen]);

  return (
    <AppDialog
      isOpen={isOpen}
      onClose={regenerating ? () => {} : onClose}
      labelledBy="credenziali-modal-title"
      dismissible={!regenerating}
      variant="sheet"
      maxWidthClassName="max-w-lg"
      portalId="credenziali-modal-portal"
    >
      {regenerating && <StethoscopeLoader overlay text="Rigenerazione PIN in corso..." />}

      <div id="printable-card" className="printable-credenziali-card p-4 sm:p-8 space-y-4 sm:space-y-6 bg-white text-on-surface overflow-y-auto flex-1">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b pb-4 border-surface-variant/40">
          <Logo size={40} showText={true} subtitle="Diario Pressorio Personale" />
          <div className="text-left sm:text-right text-xs text-secondary">
            <p className="font-bold text-on-surface">{medicoNome}</p>
            <p>Specialista in Cardiologia</p>
          </div>
        </div>

        <div className="text-center space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary-container/30 px-3 py-1 rounded-full inline-block">
            Scheda di Accesso Personale
          </span>
          <h1 id="credenziali-modal-title" className="text-xl sm:text-2xl font-headline font-bold text-on-surface pt-1">
            {paziente.nome} {paziente.cognome}
          </h1>
          <p className="text-xs text-on-surface-variant">
            Conserva questo documento per accedere al tuo diario pressorio digitale.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="p-3 rounded-xl bg-error-container text-on-error-container text-xs flex items-center gap-2 no-print"
          >
            <AlertCircle className="w-4 h-4 text-error shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        <div className="p-4 sm:p-6 rounded-2xl bg-surface-container-low border border-surface-variant/60 space-y-4">
          <div className="flex items-center justify-between border-b border-surface-variant/40 pb-3 gap-2">
            <span className="text-xs font-bold text-secondary uppercase">Codice Fiscale</span>
            <span className="text-sm sm:text-base font-mono font-bold text-on-surface break-all">
              {paziente.codiceFiscale}
            </span>
          </div>

          <div className="flex items-center justify-between pt-1 gap-2 flex-wrap">
            <div>
              <span className="text-xs font-bold text-secondary uppercase block">
                PIN Personale (6 cifre)
              </span>
              <span className="text-xs text-on-surface-variant">
                {currentPin ? "Condividi o stampa prima di chiudere" : "Cifrato per sicurezza"}
              </span>
            </div>

            {currentPin ? (
              <div className="flex items-center gap-2">
                <span className="text-2xl sm:text-3xl font-mono font-extrabold text-primary tracking-widest bg-white px-3 sm:px-4 py-1.5 rounded-xl border border-primary/30 shadow-sm shrink-0">
                  {currentPin}
                </span>
                <button
                  type="button"
                  onClick={handleCopyPin}
                  aria-label="Copia PIN"
                  className="no-print min-h-[44px] px-3 rounded-xl bg-primary-container/40 hover:bg-primary-container/70 text-primary text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  {copiedPin ? (
                    <Check className="w-4 h-4" aria-hidden="true" />
                  ) : (
                    <Copy className="w-4 h-4" aria-hidden="true" />
                  )}
                  <span>{copiedPin ? "Copiato" : "Copia PIN"}</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 no-print">
                <span className="text-sm font-mono font-bold text-outline px-3 py-1.5 rounded-xl bg-surface-container">
                  ••••••
                </span>
                {paziente.id && (
                  <button
                    type="button"
                    onClick={() => setConfirmRegen(true)}
                    disabled={regenerating}
                    className="min-h-[42px] px-3.5 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold flex items-center gap-1.5 shadow-sm hover:bg-primary/90 disabled:opacity-60"
                  >
                    <RefreshCw className="w-4 h-4" aria-hidden="true" />
                    <span>{regenerating ? "Rigenerazione..." : "Rigenera PIN"}</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {confirmRegen && (
            <div className="p-3 rounded-xl bg-secondary-container/70 border border-tertiary/30 space-y-2.5 no-print">
              <p className="text-xs font-semibold text-on-surface leading-relaxed">
                Rigenerando il PIN di {paziente.nome} {paziente.cognome}, il vecchio PIN smetterà di funzionare e le sessioni attive verranno chiuse.
              </p>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmRegen(false)}
                  className="min-h-[38px] px-3 rounded-lg bg-surface-container text-xs font-semibold text-on-surface"
                >
                  Annulla
                </button>
                <button
                  type="button"
                  onClick={handleRigeneraPinConfirmed}
                  className="min-h-[38px] px-3.5 rounded-lg bg-primary text-on-primary text-xs font-bold"
                >
                  Conferma rigenerazione
                </button>
              </div>
            </div>
          )}

          {currentPin && paziente.id && !confirmRegen && (
            <div className="pt-2 border-t border-surface-variant/40 flex items-center justify-between gap-2 flex-wrap no-print">
              <button
                type="button"
                onClick={handleCopyCredenziali}
                className="min-h-[36px] text-xs font-semibold text-primary hover:underline flex items-center gap-1.5"
              >
                {copiedAll ? (
                  <Check className="w-4 h-4" aria-hidden="true" />
                ) : (
                  <Share2 className="w-4 h-4" aria-hidden="true" />
                )}
                <span>{copiedAll ? "Testo copiato negli appunti!" : "Copia messaggio completo da inviare"}</span>
              </button>
              <button
                type="button"
                onClick={() => setConfirmRegen(true)}
                disabled={regenerating}
                className="min-h-[36px] text-xs font-semibold text-secondary hover:text-on-surface flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Rigenera</span>
              </button>
            </div>
          )}
        </div>

        <div className="space-y-2 text-xs text-on-surface-variant">
          <p className="font-bold text-on-surface text-sm">Come iniziare il monitoraggio:</p>
          <ol className="list-decimal list-inside space-y-1.5 pl-1">
            <li>Collegati al sito dal tuo smartphone o computer.</li>
            <li>
              Inserisci il tuo <strong>Codice Fiscale</strong> e il <strong>PIN a 6 cifre</strong> sopra indicati (dopo il primo accesso potrai attivare l&apos;impronta o Face ID).
            </li>
            <li>Segui la breve guida iniziale ed effettua la prima misurazione a entrambe le braccia.</li>
          </ol>
        </div>
      </div>

      <div className="p-3 sm:p-4 bg-surface-container flex items-center justify-between border-t border-surface-variant/40 no-print shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="min-h-[44px] px-4 py-2 rounded-xl text-sm font-semibold text-secondary hover:bg-surface-container-high"
        >
          Chiudi
        </button>
        {currentPin && (
          <button
            type="button"
            onClick={handlePrint}
            className="min-h-[44px] px-4 sm:px-5 py-2 rounded-xl bg-primary text-on-primary text-sm font-bold flex items-center gap-2 shadow-sm hover:bg-primary/90"
          >
            <Printer className="w-4 h-4" aria-hidden="true" />
            <span>Stampa Scheda</span>
          </button>
        )}
      </div>
    </AppDialog>
  );
};
