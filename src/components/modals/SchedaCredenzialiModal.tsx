"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Logo } from "@/components/Logo";
import { StethoscopeLoader } from "@/components/StethoscopeLoader";
import { rigeneraPinPaziente } from "@/db/actions";

interface SchedaCredenzialiModalProps {
  isOpen: boolean;
  onClose: () => void;
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
  paziente,
}) => {
  const [mounted, setMounted] = useState(false);
  const [currentPin, setCurrentPin] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [copiedPin, setCopiedPin] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      const initial = paziente.pin && /^\d{6}$/.test(paziente.pin.trim()) ? paziente.pin.trim() : null;
      setCurrentPin(initial);
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
    const text = `CardioDiario - Credenziali di accesso per ${paziente.nome} ${paziente.cognome}\nCodice Fiscale: ${paziente.codiceFiscale}\nPIN personale: ${currentPin}\nAccedi da: https://cardiodiario.vercel.app/login/paziente`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    } catch {}
  };

  const handleRigeneraPin = async () => {
    if (!paziente.id) return;
    if (
      !confirm(
        `Rigenerare il PIN di ${paziente.nome} ${paziente.cognome}? Il vecchio PIN non funzionerà più e le sessioni attive del paziente verranno chiuse.`
      )
    ) {
      return;
    }
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

  if (!isOpen || !mounted) return null;

  const content = (
    <div
      id="credenziali-modal-portal"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-inverse-surface/40 backdrop-blur-sm animate-in fade-in duration-200"
    >
      {regenerating && <StethoscopeLoader overlay text="Rigenerazione PIN in corso..." />}
      <div className="bg-surface-container-lowest w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl border-t sm:border border-surface-variant/50 overflow-hidden max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-6 sm:slide-in-from-bottom-0 duration-300">
        {/* Mobile drag handle */}
        <div className="sm:hidden pt-3 pb-1 flex justify-center flex-shrink-0 no-print">
          <div className="w-12 h-1.5 bg-outline/25 rounded-full" />
        </div>

        {/* Printable Area */}
        <div id="printable-card" className="printable-credenziali-card p-4 sm:p-8 space-y-4 sm:space-y-6 bg-white text-on-surface overflow-y-auto flex-1">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b pb-4 border-surface-variant/40">
            <Logo size={40} showText={true} subtitle="Diario Pressorio Personale" />
            <div className="text-left sm:text-right text-xs text-secondary">
              <p className="font-bold text-on-surface">Dott.ssa Ivana Pariggiano</p>
              <p>Specialista in Cardiologia</p>
            </div>
          </div>

          <div className="text-center space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary-container/30 px-3 py-1 rounded-full inline-block">
              Scheda di Accesso Personale
            </span>
            <h2 className="text-xl sm:text-2xl font-headline font-bold text-on-surface pt-1">
              {paziente.nome} {paziente.cognome}
            </h2>
            <p className="text-xs text-on-surface-variant">
              Conserva questo documento per accedere al tuo diario pressorio digitale.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-error-container text-on-error-container text-xs flex items-center gap-2 no-print">
              <span className="material-symbols-outlined text-error text-base">error</span>
              <span>{error}</span>
            </div>
          )}

          {/* Credentials Box */}
          <div className="p-4 sm:p-6 rounded-2xl bg-surface-container-low border border-surface-variant/60 space-y-4">
            <div className="flex items-center justify-between border-b border-surface-variant/40 pb-3">
              <span className="text-xs font-bold text-secondary uppercase">Codice Fiscale</span>
              <span className="text-sm sm:text-base font-mono font-bold text-on-surface break-all">{paziente.codiceFiscale}</span>
            </div>

            <div className="flex items-center justify-between pt-1 gap-2 flex-wrap">
              <div>
                <span className="text-xs font-bold text-secondary uppercase block">PIN Personale (6 cifre)</span>
                <span className="text-xs text-on-surface-variant">
                  {currentPin ? "Condividi o stampa prima di chiudere" : "Cifrato per sicurezza"}
                </span>
              </div>

              {currentPin ? (
                <div className="flex items-center gap-2">
                  <span className="text-2xl sm:text-3xl font-mono font-extrabold text-primary tracking-widest bg-white px-3 sm:px-4 py-1.5 rounded-xl border border-primary/30 shadow-sm flex-shrink-0">
                    {currentPin}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyPin}
                    title="Copia PIN"
                    aria-label="Copia PIN"
                    className="no-print h-11 px-3 rounded-xl bg-primary-container/40 hover:bg-primary-container/70 text-primary text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">
                      {copiedPin ? "check" : "content_copy"}
                    </span>
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
                      onClick={handleRigeneraPin}
                      disabled={regenerating}
                      className="px-3.5 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold flex items-center gap-1.5 shadow-sm hover:bg-primary/90 disabled:opacity-60"
                    >
                      <span className="material-symbols-outlined text-base">refresh</span>
                      <span>{regenerating ? "Rigenerazione..." : "Rigenera PIN"}</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {currentPin && paziente.id && (
              <div className="pt-2 border-t border-surface-variant/40 flex items-center justify-between gap-2 no-print">
                <button
                  type="button"
                  onClick={handleCopyCredenziali}
                  className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-base">
                    {copiedAll ? "check" : "share"}
                  </span>
                  <span>{copiedAll ? "Testo copiato negli appunti!" : "Copia messaggio completo da inviare"}</span>
                </button>
                <button
                  type="button"
                  onClick={handleRigeneraPin}
                  disabled={regenerating}
                  className="text-xs font-semibold text-secondary hover:text-on-surface flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">refresh</span>
                  <span>Rigenera</span>
                </button>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="space-y-2 text-xs text-on-surface-variant">
            <p className="font-bold text-on-surface text-sm">Come iniziare il monitoraggio:</p>
            <ol className="list-decimal list-inside space-y-1.5 pl-1">
              <li>Collegati al sito dal tuo smartphone o computer.</li>
              <li>Inserisci il tuo <strong>Codice Fiscale</strong> e il <strong>PIN a 6 cifre</strong> sopra indicati (dopo il primo accesso potrai attivare l&apos;impronta o Face ID).</li>
              <li>Segui la breve guida iniziale ed effettua la prima misurazione a entrambe le braccia.</li>
            </ol>
          </div>
        </div>

        {/* Modal Controls (Not Printed) */}
        <div className="p-3 sm:p-4 bg-surface-container flex items-center justify-between border-t border-surface-variant/40 no-print flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-secondary hover:bg-surface-container-high"
          >
            Chiudi
          </button>
          <div className="flex items-center gap-2">
            {currentPin && (
              <button
                type="button"
                onClick={handlePrint}
                className="px-4 sm:px-5 py-2 rounded-xl bg-primary text-on-primary text-sm font-bold flex items-center gap-2 shadow-sm hover:bg-primary/90"
              >
                <span className="material-symbols-outlined text-base">print</span>
                Stampa Scheda
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
};
