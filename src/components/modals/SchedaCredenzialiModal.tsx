"use client";

import React from "react";
import { Logo } from "@/components/Logo";

interface SchedaCredenzialiModalProps {
  isOpen: boolean;
  onClose: () => void;
  paziente: {
    nome: string;
    cognome: string;
    codiceFiscale: string;
    pin: string;
  };
}

export const SchedaCredenzialiModal: React.FC<SchedaCredenzialiModalProps> = ({
  isOpen,
  onClose,
  paziente,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-inverse-surface/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface-container-lowest w-full max-w-lg rounded-3xl shadow-2xl border border-surface-variant/50 overflow-hidden flex flex-col">
        {/* Printable Area */}
        <div id="printable-card" className="p-8 space-y-6 bg-white text-on-surface">
          {/* Header */}
          <div className="flex items-center justify-between border-b pb-4 border-surface-variant/40">
            <Logo size={44} showText={true} subtitle="Studio Medico Specialistico" />
            <div className="text-right text-xs text-secondary">
              <p className="font-bold text-on-surface">Dott. Valerio Marchi</p>
              <p>Specialista in Cardiologia</p>
            </div>
          </div>

          <div className="text-center space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary-container/30 px-3 py-1 rounded-full inline-block">
              Scheda di Accesso Personale
            </span>
            <h2 className="text-2xl font-headline font-bold text-on-surface pt-1">
              {paziente.nome} {paziente.cognome}
            </h2>
            <p className="text-xs text-on-surface-variant">
              Conserva questo documento per accedere al tuo diario pressorio digitale.
            </p>
          </div>

          {/* Credentials Box */}
          <div className="p-6 rounded-2xl bg-surface-container-low border border-surface-variant/60 space-y-4">
            <div className="flex items-center justify-between border-b border-surface-variant/40 pb-3">
              <span className="text-xs font-bold text-secondary uppercase">Codice Fiscale</span>
              <span className="text-base font-mono font-bold text-on-surface">{paziente.codiceFiscale}</span>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div>
                <span className="text-xs font-bold text-secondary uppercase block">PIN Personale (6 cifre)</span>
                <span className="text-xs text-on-surface-variant">Da digitare ad ogni accesso</span>
              </div>
              <span className="text-3xl font-mono font-extrabold text-primary tracking-widest bg-white px-4 py-1.5 rounded-xl border border-primary/30 shadow-sm">
                {paziente.pin}
              </span>
            </div>
          </div>

          {/* Instructions */}
          <div className="space-y-2 text-xs text-on-surface-variant">
            <p className="font-bold text-on-surface text-sm">Come iniziare il monitoraggio:</p>
            <ol className="list-decimal list-inside space-y-1.5 pl-1">
              <li>Collegati al sito dal tuo smartphone o computer.</li>
              <li>Inserisci il tuo <strong>Codice Fiscale</strong> e il <strong>PIN a 6 cifre</strong> sopra indicati.</li>
              <li>Segui la breve guida iniziale ed effettua la prima misurazione a entrambe le braccia.</li>
            </ol>
          </div>
        </div>

        {/* Modal Controls (Not Printed) */}
        <div className="p-4 bg-surface-container flex items-center justify-between border-t border-surface-variant/40">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-secondary hover:bg-surface-container-high"
          >
            Chiudi
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-5 py-2 rounded-xl bg-primary text-on-primary text-sm font-bold flex items-center gap-2 shadow-sm hover:bg-primary/90"
            >
              <span className="material-symbols-outlined text-base">print</span>
              Stampa Scheda
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
