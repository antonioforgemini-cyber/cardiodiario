"use client";

import React, { useEffect, useState } from "react";
import { Bell, BellOff, X } from "lucide-react";
import { getComunicazioniPaziente, markComunicazioniAsRead } from "@/db/actions";
import { StethoscopeLoader } from "@/components/StethoscopeLoader";
import { AppDialog } from "@/components/ui/AppDialog";
import { PushPermissionCard } from "@/components/pwa/PushPermissionCard";
import type { NotificationMuteState } from "@/lib/push-mute";

interface ComunicazioneItem {
  id: string;
  titolo: string;
  messaggio: string;
  createdAt: string;
  letta: boolean;
  medicoCognome: string;
}

interface NotificheModalProps {
  isOpen: boolean;
  onClose: () => void;
  pazienteId: string;
  onRead?: () => void;
  onMuteChange?: (mute: NotificationMuteState) => void;
}

export const NotificheModal: React.FC<NotificheModalProps> = ({
  isOpen,
  onClose,
  pazienteId,
  onRead,
  onMuteChange,
}) => {
  const [comunicazioni, setComunicazioni] = useState<ComunicazioneItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    setLoading(true);
    (async () => {
      try {
        const res = await getComunicazioniPaziente(pazienteId);
        if (!active) return;
        setComunicazioni(res);
        await markComunicazioniAsRead(pazienteId);
        const nav = navigator as Navigator & { clearAppBadge?: () => Promise<void> };
        nav.clearAppBadge?.().catch(() => {});
        onRead?.();
      } catch (e) {
        console.error(e);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [isOpen, pazienteId, onRead]);

  return (
    <AppDialog
      isOpen={isOpen}
      onClose={onClose}
      labelledBy="notifiche-modal-title"
      variant="sheet"
      maxWidthClassName="max-w-md"
    >
      <div className="p-5 sm:p-6 space-y-4 flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between border-b border-surface-variant/40 pb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary-container/40 text-primary flex items-center justify-center shrink-0">
              <Bell className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h1 id="notifiche-modal-title" className="text-lg font-headline font-bold text-on-surface">
                Centro Notifiche
              </h1>
              <p className="text-xs text-on-surface-variant">
                Messaggi e promemoria dal tuo medico.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Chiudi centro notifiche"
            className="min-w-[40px] min-h-[40px] rounded-full flex items-center justify-center text-secondary hover:bg-surface-container hover:text-on-surface"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="shrink-0">
          <PushPermissionCard variant="compact" onMuteChange={onMuteChange} />
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {loading ? (
            <div className="py-6 flex justify-center">
              <StethoscopeLoader size="md" text="Caricamento notifiche..." />
            </div>
          ) : comunicazioni.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <BellOff className="w-8 h-8 text-secondary mx-auto" aria-hidden="true" />
              <p className="text-xs sm:text-sm text-secondary italic">Nessuna comunicazione dal medico al momento.</p>
            </div>
          ) : (
            comunicazioni.map((c) => (
              <div
                key={c.id}
                className="p-4 rounded-2xl bg-surface-container-low border border-surface-variant/40 space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs sm:text-sm font-bold text-primary">{c.titolo}</span>
                  <span className="text-[11px] text-secondary font-medium shrink-0">
                    {new Date(c.createdAt).toLocaleDateString("it-IT", {
                      day: "2-digit",
                      month: "short",
                    })}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-on-surface leading-relaxed">{c.messaggio}</p>
                <span className="text-[11px] text-secondary italic block pt-1">
                  Mittente: Dr. {c.medicoCognome}
                </span>
              </div>
            ))
          )}
        </div>

        <div className="pt-2 shrink-0">
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
