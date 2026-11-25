"use client";

import React, { useEffect, useState } from "react";
import { Download, Share, PlusSquare, Smartphone, X } from "lucide-react";
import { AppDialog } from "@/components/ui/AppDialog";
import { isIosDevice, isRunningStandalone } from "@/lib/push-client";
import {
  consumeDeferredInstallPrompt,
  getInstallStoreSnapshot,
  subscribeInstallStore,
  type InstallStoreSnapshot,
} from "@/lib/pwa-install-store";

interface PwaInstallCardProps {
  compact?: boolean;
}

const DISMISS_KEY = "cd_pwa_banner_dismissed";

export const PwaInstallCard: React.FC<PwaInstallCardProps> = ({ compact = false }) => {
  const [canInstallWebApi, setCanInstallWebApi] = useState(false);
  const [installSnapshot, setInstallSnapshot] = useState<InstallStoreSnapshot>({
    hasPrompt: false,
    installed: false,
  });
  const [isIosSafariGuide, setIsIosSafariGuide] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [iosGuideOpen, setIosGuideOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isRunningStandalone()) return;

    try {
      if (sessionStorage.getItem(DISMISS_KEY) === "1") {
        setDismissed(true);
        return;
      }
    } catch {}

    const navProto =
      typeof Navigator !== "undefined"
        ? (Navigator.prototype as Navigator & { install?: () => Promise<void> })
        : null;
    const supportsWebInstall = Boolean(navProto && typeof navProto.install === "function");
    if (supportsWebInstall) {
      setCanInstallWebApi(true);
    }

    if (isIosDevice()) {
      setIsIosSafariGuide(true);
    }

    setInstallSnapshot(getInstallStoreSnapshot());
    const unsubscribe = subscribeInstallStore(() => {
      const next = getInstallStoreSnapshot();
      setInstallSnapshot(next);
      if (next.installed) {
        setCanInstallWebApi(false);
        setIsIosSafariGuide(false);
        setStatusMessage("Applicazione installata con successo.");
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  if (dismissed) return null;
  if (!canInstallWebApi && !installSnapshot.hasPrompt && !isIosSafariGuide) return null;

  const handleDismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {}
  };

  const handleInstallClick = async () => {
    if (installing) return;

    if (isIosSafariGuide && !canInstallWebApi && !installSnapshot.hasPrompt) {
      setIosGuideOpen(true);
      return;
    }

    setInstalling(true);
    setStatusMessage("");

    try {
      if (canInstallWebApi) {
        const nav = navigator as Navigator & { install?: () => Promise<void> };
        await nav.install?.();
        setStatusMessage("CardioDiario è stato installato o aperto.");
        setCanInstallWebApi(false);
      } else {
        const promptEvent = consumeDeferredInstallPrompt();
        if (promptEvent) {
          await promptEvent.prompt();
          const { outcome } = await promptEvent.userChoice;
          setStatusMessage(
            outcome === "accepted"
              ? "Installazione completata!"
              : "Installazione annullata. Puoi riprovare in seguito."
          );
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        setStatusMessage("Installazione annullata.");
      } else {
        setStatusMessage("Impossibile avviare l'installazione automatica.");
      }
    } finally {
      setInstalling(false);
    }
  };

  return (
    <>
      <section
        aria-label="Installa CardioDiario come app"
        className={`relative bg-primary-container/25 border border-primary/20 rounded-2xl shadow-sm ${
          compact ? "p-3.5" : "p-4"
        }`}
      >
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-primary text-on-primary flex items-center justify-center shrink-0 shadow-sm">
            <Smartphone className="w-5 h-5" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-sm font-headline font-bold text-on-surface leading-snug">
                  Installa CardioDiario sul Telefono
                </h2>
                <p className="text-xs text-on-surface-variant leading-relaxed mt-0.5">
                  Aggiungila alla schermata Home per aprirla a tutto schermo e ricevere i promemoria quotidiani.
                </p>
              </div>
              <button
                type="button"
                onClick={handleDismiss}
                aria-label="Nascondi avviso installazione"
                className="min-w-[36px] min-h-[36px] -mt-1 -mr-1 rounded-full flex items-center justify-center text-secondary hover:bg-surface-container hover:text-on-surface transition-colors shrink-0"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleInstallClick}
                aria-disabled={installing ? "true" : undefined}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-on-primary text-xs font-bold shadow-sm inline-flex items-center gap-2 transition-colors aria-disabled:opacity-60"
              >
                <Download className="w-4 h-4" aria-hidden="true" />
                <span>
                  {installing
                    ? "Installazione..."
                    : isIosSafariGuide && !canInstallWebApi && !installSnapshot.hasPrompt
                    ? "Vedi come installare su iPhone"
                    : "Installa App Ora"}
                </span>
              </button>
              {statusMessage && (
                <p role="status" className="text-xs font-semibold text-primary">
                  {statusMessage}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      <AppDialog
        isOpen={iosGuideOpen}
        onClose={() => setIosGuideOpen(false)}
        labelledBy="ios-install-title"
        variant="sheet"
        maxWidthClassName="max-w-md"
      >
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto">
          <div className="flex items-center justify-between border-b border-surface-variant/40 pb-3">
            <h1 id="ios-install-title" className="text-lg font-headline font-bold text-on-surface">
              Installa su iPhone o iPad
            </h1>
            <button
              type="button"
              onClick={() => setIosGuideOpen(false)}
              aria-label="Chiudi guida"
              className="min-w-[40px] min-h-[40px] rounded-full flex items-center justify-center text-secondary hover:bg-surface-container"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          <p className="text-sm text-on-surface-variant leading-relaxed">
            Su Safari è necessario aggiungere l&apos;app alla schermata Home per poter ricevere anche le notifiche promemoria:
          </p>

          <ol className="space-y-3 text-sm text-on-surface">
            <li className="flex items-start gap-3 p-3 rounded-2xl bg-surface-container-low border border-surface-variant/40">
              <span className="w-7 h-7 rounded-full bg-primary text-on-primary text-xs font-bold flex items-center justify-center shrink-0">
                1
              </span>
              <div className="space-y-0.5">
                <p className="font-bold flex items-center gap-1.5">
                  <span>Tocca il tasto Condividi</span>
                  <Share className="w-4 h-4 text-primary" aria-hidden="true" />
                </p>
                <p className="text-xs text-on-surface-variant">
                  Si trova nella barra in basso (o in alto su iPad) di Safari.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3 p-3 rounded-2xl bg-surface-container-low border border-surface-variant/40">
              <span className="w-7 h-7 rounded-full bg-primary text-on-primary text-xs font-bold flex items-center justify-center shrink-0">
                2
              </span>
              <div className="space-y-0.5">
                <p className="font-bold flex items-center gap-1.5">
                  <span>Scegli &quot;Aggiungi alla schermata Home&quot;</span>
                  <PlusSquare className="w-4 h-4 text-primary" aria-hidden="true" />
                </p>
                <p className="text-xs text-on-surface-variant">
                  Scorri il menu e conferma toccando <strong>Aggiungi</strong> in alto a destra.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3 p-3 rounded-2xl bg-surface-container-low border border-surface-variant/40">
              <span className="w-7 h-7 rounded-full bg-primary text-on-primary text-xs font-bold flex items-center justify-center shrink-0">
                3
              </span>
              <div className="space-y-0.5">
                <p className="font-bold">Apri CardioDiario dall&apos;icona Home</p>
                <p className="text-xs text-on-surface-variant">
                  Da lì potrai attivare i promemoria push delle 11:00, 16:00 e 22:00.
                </p>
              </div>
            </li>
          </ol>

          <button
            type="button"
            onClick={() => setIosGuideOpen(false)}
            className="w-full min-h-[48px] rounded-xl bg-primary text-on-primary text-sm font-bold"
          >
            Ho capito
          </button>
        </div>
      </AppDialog>
    </>
  );
};
