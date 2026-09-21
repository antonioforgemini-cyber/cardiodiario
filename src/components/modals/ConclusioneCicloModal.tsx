"use client";

import React, { useEffect } from "react";
import confetti from "canvas-confetti";

interface ConclusioneCicloModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDownloadPdf: () => void;
  pazienteNome: string;
}

export const ConclusioneCicloModal: React.FC<ConclusioneCicloModalProps> = ({
  isOpen,
  onClose,
  onDownloadPdf,
  pazienteNome,
}) => {
  useEffect(() => {
    if (isOpen) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#4a7c59", "#c4a66a", "#78a886"],
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-inverse-surface/50 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-surface-container-lowest w-full max-w-md rounded-3xl shadow-2xl border border-surface-variant/50 p-6 text-center space-y-5">
        {/* Trophy / Check badge */}
        <div className="w-20 h-20 rounded-full bg-primary-container/40 text-primary flex items-center justify-center mx-auto shadow-sm">
          <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
            verified
          </span>
        </div>

        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary-container/30 px-3 py-1 rounded-full inline-block">
            Traguardo Raggiunto!
          </span>
          <h2 className="text-2xl font-headline font-bold text-on-surface">
            Complimenti, {pazienteNome}!
          </h2>
          <p className="text-xs text-on-surface-variant leading-relaxed max-w-sm mx-auto">
            Hai completato con costanza il tuo ciclo di misurazioni pressorie. Il tuo diario è ora completo e a disposizione del tuo medico per valutare la tua salute e l&apos;efficacia della terapia.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-secondary-container/40 border border-secondary/20 text-xs text-on-secondary-container text-left space-y-1">
          <p className="font-bold text-on-surface flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm text-primary">call</span>
            Passi successivi:
          </p>
          <p>
            Contatta il tuo studio medico per comunicare la fine del ciclo o per fissare la visita di controllo.
          </p>
        </div>

        <div className="space-y-2.5 pt-2">
          <button
            type="button"
            onClick={onDownloadPdf}
            className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-on-primary text-xs font-bold shadow-sm flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-base">picture_as_pdf</span>
            <span>Scarica Report Clinico Completo (PDF)</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full h-11 rounded-xl bg-surface-container hover:bg-surface-container-high text-xs font-bold text-on-surface"
          >
            Torna al Diario
          </button>
        </div>
      </div>
    </div>
  );
};
