"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle2, Fingerprint, Settings, Smartphone, X } from "lucide-react";
import { AppDialog } from "@/components/ui/AppDialog";
import { PushPermissionCard } from "@/components/pwa/PushPermissionCard";
import { PwaInstallCard } from "@/components/pwa/PwaInstallCard";
import { isRunningStandalone } from "@/lib/push-client";
import type { NotificationMuteState } from "@/lib/push-mute";

interface ImpostazioniAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenBiometria: () => void;
  onMuteChange?: (mute: NotificationMuteState) => void;
}

export const ImpostazioniAppModal: React.FC<ImpostazioniAppModalProps> = ({
  isOpen,
  onClose,
  onOpenBiometria,
  onMuteChange,
}) => {
  const [standalone, setStandalone] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setStandalone(isRunningStandalone());
  }, [isOpen]);

  return (
    <AppDialog
      isOpen={isOpen}
      onClose={onClose}
      labelledBy="impostazioni-app-title"
      variant="sheet"
      maxWidthClassName="max-w-md"
    >
      <div className="p-5 sm:p-6 space-y-5 flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between border-b border-surface-variant/40 pb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary-container/40 text-primary flex items-center justify-center shrink-0">
              <Settings className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h1
                id="impostazioni-app-title"
                className="text-lg font-headline font-bold text-on-surface"
              >
                Impostazioni App
              </h1>
              <p className="text-xs text-on-surface-variant">
                Notifiche, modalità silenziosa e accesso rapido.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Chiudi impostazioni dell'app"
            className="min-w-[40px] min-h-[40px] rounded-full flex items-center justify-center text-secondary hover:bg-surface-container hover:text-on-surface transition-colors"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pr-0.5">
          <section aria-labelledby="settings-push-heading" className="space-y-2">
            <h2
              id="settings-push-heading"
              className="text-xs font-bold text-secondary uppercase tracking-wider px-1"
            >
              Notifiche e Promemoria
            </h2>
            <PushPermissionCard variant="settings" onMuteChange={onMuteChange} />
          </section>

          <section aria-labelledby="settings-bio-heading" className="space-y-2">
            <h2
              id="settings-bio-heading"
              className="text-xs font-bold text-secondary uppercase tracking-wider px-1"
            >
              Sicurezza &amp; Accesso
            </h2>
            <div className="p-4 rounded-2xl bg-surface-container-low border border-surface-variant/60 flex items-center justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-primary-container/30 text-primary flex items-center justify-center shrink-0">
                  <Fingerprint className="w-5 h-5" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-headline font-bold text-on-surface">
                    Face ID / Impronta
                  </p>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    Gestisci i dispositivi abilitati all&apos;accesso biometrico rapido.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenBiometria();
                }}
                className="min-h-[42px] px-3.5 py-2 rounded-xl bg-surface-container-lowest hover:bg-surface-container border border-surface-variant/60 text-xs font-bold text-primary shrink-0 transition-colors"
              >
                Gestisci
              </button>
            </div>
          </section>

          <section aria-labelledby="settings-pwa-heading" className="space-y-2">
            <h2
              id="settings-pwa-heading"
              className="text-xs font-bold text-secondary uppercase tracking-wider px-1"
            >
              App sul Dispositivo
            </h2>
            {standalone ? (
              <div className="p-3.5 rounded-2xl bg-primary-container/20 border border-primary/25 flex items-center gap-3 text-xs text-on-surface">
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0" aria-hidden="true" />
                <div>
                  <span className="font-bold block">App installata sulla schermata Home</span>
                  <span className="text-on-surface-variant">
                    Stai usando CardioDiario come app dedicata a tutto schermo.
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <PwaInstallCard compact />
                <div className="p-3.5 rounded-2xl bg-surface-container-low border border-surface-variant/50 flex items-start gap-2.5 text-xs text-on-surface-variant">
                  <Smartphone className="w-4 h-4 text-secondary shrink-0 mt-0.5" aria-hidden="true" />
                  <span>
                    Puoi installare CardioDiario dal menu del browser (&quot;Installa app&quot; o &quot;Aggiungi a schermata Home&quot;) se il pulsante automatico non compare.
                  </span>
                </div>
              </div>
            )}
          </section>
        </div>

        <div className="pt-1 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full min-h-[44px] rounded-xl bg-surface-container text-xs sm:text-sm font-bold text-on-surface hover:bg-surface-container-high transition-colors"
          >
            Chiudi
          </button>
        </div>
      </div>
    </AppDialog>
  );
};
