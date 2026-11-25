"use client";

import React, { useEffect, useState } from "react";
import { Activity, ArrowLeftRight, ArrowRight, Clock, Heart } from "lucide-react";
import { AppDialog } from "@/components/ui/AppDialog";
import { PushPermissionCard } from "@/components/pwa/PushPermissionCard";

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

  useEffect(() => {
    if (isOpen) setCurrentStep(0);
  }, [isOpen]);

  const steps = [
    {
      Icon: Heart,
      tag: "Benvenuto nel Diario",
      title: "Il tuo compagno per la salute del cuore",
      desc: "Questo diario pressorio ti aiuterà ad annotare le tue misurazioni quotidiane in modo semplice e veloce, connettendoti direttamente con il tuo medico curante.",
    },
    {
      Icon: Activity,
      tag: "Come Misurare",
      title: "Consigli per una misurazione accurata",
      desc: "Rimani seduto e rilassato per 5 minuti prima di iniziare. Appoggia il braccio su un tavolo all'altezza del cuore. Non parlare e non fumare nei minuti precedenti.",
    },
    {
      Icon: ArrowLeftRight,
      tag: "La Prima Misurazione",
      title: "La regola iniziale del doppio braccio",
      desc: "Oggi effettuerai una misurazione su entrambe le braccia (Destro e Sinistro). Il sistema individuerà quale ha la pressione maggiore e quello diventerà il tuo braccio di riferimento per tutto il ciclo.",
    },
    {
      Icon: Clock,
      tag: "I 3 Momenti del Giorno",
      title: "Mattina, Pomeriggio e Sera",
      desc: "Ogni giorno compilerai 3 schede con promemoria alle 11:00, 16:00 e 22:00. Se tardi nessun problema: potrai compilare la scheda in qualunque momento.",
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
  const StepIcon = current.Icon;

  return (
    <AppDialog
      isOpen={isOpen}
      onClose={onClose}
      labelledBy="onboarding-title"
      variant="center"
      maxWidthClassName="max-w-md"
    >
      <div className="p-6 flex flex-col justify-between min-h-[460px] max-h-[90vh] overflow-y-auto gap-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary-container/30 px-3 py-1 rounded-full">
            {current.tag}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[36px] px-2 text-xs text-secondary hover:text-on-surface font-semibold rounded-lg"
          >
            Salta guida
          </button>
        </div>

        <div className="my-auto py-2 flex flex-col items-center text-center space-y-4">
          <div className="w-20 h-20 rounded-3xl bg-primary-container/40 text-primary flex items-center justify-center shadow-sm">
            <StepIcon className="w-10 h-10" aria-hidden="true" />
          </div>

          <h1
            id="onboarding-title"
            className="text-2xl font-headline font-bold text-on-surface tracking-tight leading-snug max-w-xs"
          >
            {current.title}
          </h1>

          <p className="text-sm font-body text-on-surface-variant leading-relaxed max-w-sm">
            {current.desc}
          </p>

          {currentStep === steps.length - 1 && (
            <div className="w-full pt-1">
              <PushPermissionCard variant="inline" />
            </div>
          )}
        </div>

        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-center gap-2" aria-label={`Passo ${currentStep + 1} di ${steps.length}`}>
            {steps.map((_, idx) => (
              <span
                key={idx}
                className={`h-2 rounded-full transition-all duration-300 ${
                  idx === currentStep ? "w-6 bg-primary" : "w-2 bg-surface-variant"
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-3">
            {currentStep > 0 && (
              <button
                type="button"
                onClick={handleBack}
                className="min-h-[48px] px-5 rounded-xl bg-surface-container hover:bg-surface-container-high text-xs font-bold text-on-surface transition-colors"
              >
                Indietro
              </button>
            )}
            <button
              type="button"
              autoFocus
              onClick={handleNext}
              className="flex-1 min-h-[48px] px-4 rounded-xl bg-primary hover:bg-primary/90 text-on-primary text-sm font-bold shadow-sm flex items-center justify-center gap-2 transition-colors"
            >
              <span>{currentStep === steps.length - 1 ? "Inizia la prima misurazione" : "Avanti"}</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </AppDialog>
  );
};
