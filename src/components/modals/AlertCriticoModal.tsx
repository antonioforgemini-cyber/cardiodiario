"use client";

import React from "react";
import { AlertTriangle, Check } from "lucide-react";
import { AppDialog } from "@/components/ui/AppDialog";

interface AlertCriticoModalProps {
  isOpen: boolean;
  onClose: () => void;
  max: number;
  min: number;
}

export const AlertCriticoModal: React.FC<AlertCriticoModalProps> = ({
  isOpen,
  onClose,
  max,
  min,
}) => {
  return (
    <AppDialog
      isOpen={isOpen}
      onClose={onClose}
      labelledBy="alert-critico-title"
      dismissible={false}
      variant="center"
      maxWidthClassName="max-w-md"
      panelClassName="border-2 border-error"
    >
      <div className="p-6 space-y-5 overflow-y-auto">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-full bg-error/15 text-error flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8" aria-hidden="true" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-error bg-error-container px-3 py-1 rounded-full inline-block">
            Attenzione Clinica • Valori Fuori Scala
          </span>
          <h1 id="alert-critico-title" className="text-2xl font-headline font-bold text-on-surface pt-1">
            Hai registrato: <span className="text-error">{max} / {min} mmHg</span>
          </h1>
          <p className="text-xs text-on-surface-variant">
            I valori pressori inseriti sono sensibilmente superiori alla norma.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-surface-container-low border border-surface-variant/50 space-y-2 text-xs text-on-surface leading-relaxed">
          <p className="font-bold text-sm text-on-surface">Cosa ti consigliamo di fare ora:</p>
          <ol className="list-decimal list-inside space-y-1.5 text-on-surface-variant">
            <li><strong>Rimani calmo</strong> e siediti comodamente in un ambiente tranquillo.</li>
            <li>Attendi <strong>5-10 minuti a riposo</strong> senza parlare né sforzarti.</li>
            <li><strong>Ripeti la misurazione</strong> per verificare se si è trattato di un picco isolato o di una rilevazione imprecisa.</li>
            <li>Se i valori rimangono stabilmente sopra 180/110 o avverti sintomi (forte cefalea, capogiro, dolore toracico), <strong>contatta il tuo medico curante</strong> o la guardia medica.</li>
          </ol>
        </div>

        <div className="pt-2">
          <button
            type="button"
            autoFocus
            onClick={onClose}
            className="w-full min-h-[48px] px-4 rounded-xl bg-error text-on-error font-bold text-sm shadow-sm flex items-center justify-center gap-2 hover:bg-error/90 transition-colors"
          >
            <span>Ho Capito le Istruzioni</span>
            <Check className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </AppDialog>
  );
};
