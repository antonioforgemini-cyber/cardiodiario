"use client";

import React from "react";

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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-inverse-surface/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-surface-container-lowest w-full max-w-md rounded-3xl shadow-2xl border-2 border-error p-6 space-y-5">
        {/* Warning Icon & Value */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-full bg-error/15 text-error flex items-center justify-center mx-auto animate-bounce">
            <span className="material-symbols-outlined text-4xl">warning</span>
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-error bg-error-container px-3 py-1 rounded-full inline-block">
            Attenzione Clinica • Valori Fuori Scala
          </span>
          <h2 className="text-2xl font-headline font-bold text-on-surface pt-1">
            Hai registrato: <span className="text-error">{max} / {min} mmHg</span>
          </h2>
          <p className="text-xs text-on-surface-variant">
            I valori pressori inseriti sono sensibilmente superiori alla norma.
          </p>
        </div>

        {/* Guidance Instructions */}
        <div className="p-4 rounded-2xl bg-surface-container-low border border-surface-variant/50 space-y-2 text-xs text-on-surface leading-relaxed">
          <p className="font-bold text-sm text-on-surface">Cosa ti consigliamo di fare ora:</p>
          <ol className="list-decimal list-inside space-y-1.5 text-on-surface-variant">
            <li><strong>Rimani calmo</strong> e siediti comodamente in un ambiente tranquillo.</li>
            <li>Attendi <strong>5-10 minuti a riposo</strong> senza parlare né sforzarti.</li>
            <li><strong>Ripeti la misurazione</strong> per verificare se si è trattato di un picco isolato o di una rilevazione imprecisa.</li>
            <li>Se i valori rimangono stabilmente sopra 180/110 o avverti sintomi (forte cefalea, capogiro, dolore toracico), <strong>contatta il tuo medico curante</strong> o la guardia medica.</li>
          </ol>
        </div>

        <div className="pt-2 space-y-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full h-12 rounded-xl bg-error text-on-error font-bold text-sm shadow-sm flex items-center justify-center gap-2 hover:bg-error/90 active:scale-98 transition-all"
          >
            <span>Ho Capito le Istruzioni</span>
            <span className="material-symbols-outlined text-lg">check</span>
          </button>
        </div>
      </div>
    </div>
  );
};
