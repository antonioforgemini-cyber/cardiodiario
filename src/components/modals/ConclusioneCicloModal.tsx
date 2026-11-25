"use client";

import React, { useEffect } from "react";
import confetti from "canvas-confetti";
import { Award, FileText, Phone } from "lucide-react";
import { AppDialog } from "@/components/ui/AppDialog";

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
    if (!isOpen || typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    confetti({
      particleCount: 70,
      spread: 65,
      origin: { y: 0.6 },
      colors: ["#4a7c59", "#c4a66a", "#78a886"],
    });
  }, [isOpen]);

  return (
    <AppDialog
      isOpen={isOpen}
      onClose={onClose}
      labelledBy="conclusione-ciclo-title"
      variant="center"
      maxWidthClassName="max-w-md"
    >
      <div className="p-6 text-center space-y-5 overflow-y-auto">
        <div className="w-20 h-20 rounded-full bg-primary-container/40 text-primary flex items-center justify-center mx-auto shadow-sm">
          <Award className="w-10 h-10" aria-hidden="true" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary-container/30 px-3 py-1 rounded-full inline-block">
            Traguardo Raggiunto!
          </span>
          <h1 id="conclusione-ciclo-title" className="text-2xl font-headline font-bold text-on-surface">
            Complimenti, {pazienteNome}!
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed max-w-sm mx-auto">
            Hai completato con costanza il tuo ciclo di misurazioni pressorie. Il tuo diario è ora completo e a disposizione del tuo medico per valutare la tua salute e l&apos;efficacia della terapia.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-secondary-container/40 border border-secondary/20 text-xs text-on-secondary-container text-left space-y-1">
          <p className="font-bold text-on-surface flex items-center gap-1.5">
            <Phone className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
            <span>Passi successivi:</span>
          </p>
          <p>
            Contatta il tuo studio medico per comunicare la fine del ciclo o per fissare la visita di controllo.
          </p>
        </div>

        <div className="space-y-2.5 pt-2">
          <button
            type="button"
            autoFocus
            onClick={onDownloadPdf}
            className="w-full min-h-[48px] px-4 rounded-xl bg-primary hover:bg-primary/90 text-on-primary text-xs sm:text-sm font-bold shadow-sm flex items-center justify-center gap-2 transition-colors"
          >
            <FileText className="w-4 h-4" aria-hidden="true" />
            <span>Scarica Report Clinico Completo (PDF)</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full min-h-[44px] px-4 rounded-xl bg-surface-container hover:bg-surface-container-high text-xs sm:text-sm font-bold text-on-surface transition-colors"
          >
            Torna al Diario
          </button>
        </div>
      </div>
    </AppDialog>
  );
};
