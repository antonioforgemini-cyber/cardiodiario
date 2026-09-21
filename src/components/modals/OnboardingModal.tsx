"use client";

import React, { useState } from "react";

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartCalibration: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  onStartCalibration,
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const steps = [
    {
      icon: "favorite",
      tag: "Benvenuto nel Diario",
      title: "Il tuo compagno per la salute del cuore",
      desc: "Questo diario pressorio ti aiuterà ad annotare le tue misurazioni quotidiane in modo semplice e veloce, connettendoti direttamente con il tuo medico curante.",
    },
    {
      icon: "airline_seat_recline_normal",
      tag: "Come Misurare",
      title: "Consigli per una misurazione accurata",
      desc: "Rimani seduto e rilassato per 5 minuti prima di iniziare. Appoggia il braccio su un tavolo all'altezza del cuore. Non parlare e non fumare nei minuti precedenti.",
    },
    {
      icon: "compare_arrows",
      tag: "La Prima Misurazione",
      title: "La regola iniziale del doppio braccio",
      desc: "Oggi effettuerai una misurazione su entrambe le braccia (Destro e Sinistro). Il sistema individuerà quale ha la pressione maggiore e quello diventerà il tuo braccio di riferimento per tutto il ciclo.",
    },
    {
      icon: "schedule",
      tag: "I 3 Momenti del Giorno",
      title: "Mattina, Pomeriggio e Sera",
      desc: "Ogni giorno compilerai 3 schede con cutoff indicativi alle 11:00, 16:00 e 22:00. Se tardi nessun problema: potrai compilare la scheda in qualunque momento!",
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      onStartCalibration();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const current = steps[currentStep];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-inverse-surface/50 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-surface-container-lowest w-full max-w-md rounded-3xl shadow-2xl border border-surface-variant/50 p-6 flex flex-col justify-between min-h-[460px]">
        {/* Skip button */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary-container/30 px-3 py-1 rounded-full">
            {current.tag}
          </span>
          <button
            onClick={onClose}
            className="text-xs text-secondary hover:text-on-surface font-semibold"
          >
            Salta guida
          </button>
        </div>

        {/* Step Content */}
        <div className="my-auto py-6 flex flex-col items-center text-center space-y-4">
          <div className="w-20 h-20 rounded-3xl bg-primary-container/40 text-primary flex items-center justify-center shadow-sm">
            <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              {current.icon}
            </span>
          </div>

          <h2 className="text-2xl font-headline font-bold text-on-surface tracking-tight leading-snug max-w-xs">
            {current.title}
          </h2>

          <p className="text-sm font-body text-on-surface-variant leading-relaxed max-w-sm">
            {current.desc}
          </p>
        </div>

        {/* Controls & Pagination */}
        <div className="space-y-4 pt-2">
          {/* Dots */}
          <div className="flex items-center justify-center gap-2">
            {steps.map((_, idx) => (
              <span
                key={idx}
                className={`h-2 rounded-full transition-all duration-300 ${
                  idx === currentStep ? "w-6 bg-primary" : "w-2 bg-surface-variant"
                }`}
              />
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {currentStep > 0 && (
              <button
                type="button"
                onClick={handleBack}
                className="h-12 px-5 rounded-xl bg-surface-container hover:bg-surface-container-high text-xs font-bold text-on-surface transition-all"
              >
                Indietro
              </button>
            )}
            <button
              type="button"
              onClick={handleNext}
              className="flex-1 h-12 rounded-xl bg-primary hover:bg-primary/90 text-on-primary text-sm font-bold shadow-sm flex items-center justify-center gap-2 active:scale-98 transition-all"
            >
              <span>{currentStep === steps.length - 1 ? "Inizia la prima misurazione" : "Avanti"}</span>
              <span className="material-symbols-outlined text-lg">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
