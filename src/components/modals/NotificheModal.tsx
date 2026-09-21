"use client";

import React, { useEffect, useState } from "react";
import { getComunicazioniPaziente } from "@/db/actions";

interface NotificheModalProps {
  isOpen: boolean;
  onClose: () => void;
  pazienteId: string;
}

export const NotificheModal: React.FC<NotificheModalProps> = ({
  isOpen,
  onClose,
  pazienteId,
}) => {
  const [comunicazioni, setComunicazioni] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      getComunicazioniPaziente(pazienteId)
        .then((res) => setComunicazioni(res))
        .finally(() => setLoading(false));
    }
  }, [isOpen, pazienteId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-inverse-surface/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface-container-lowest w-full max-w-md rounded-3xl shadow-2xl border border-surface-variant/50 p-6 space-y-4 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-surface-variant/40 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary-container/40 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-xl">notifications</span>
            </div>
            <div>
              <h2 className="text-lg font-headline font-bold text-on-surface">Centro Notifiche</h2>
              <p className="text-[11px] text-on-surface-variant">Messaggi e promemoria dal tuo medico.</p>
            </div>
          </div>
          <button onClick={onClose} className="text-outline hover:text-on-surface">
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {loading ? (
            <div className="py-8 text-center text-xs text-secondary">Caricamento notifiche...</div>
          ) : comunicazioni.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <span className="material-symbols-outlined text-secondary text-3xl">notifications_paused</span>
              <p className="text-xs text-secondary italic">Nessuna nuova notifica.</p>
            </div>
          ) : (
            comunicazioni.map((c) => (
              <div key={c.id} className="p-4 rounded-2xl bg-surface-container-low border border-surface-variant/40 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-primary">{c.titolo}</span>
                  <span className="text-[10px] text-secondary font-medium">
                    {new Date(c.createdAt).toLocaleDateString("it-IT", { day: "2-digit", month: "short" })}
                  </span>
                </div>
                <p className="text-xs text-on-surface leading-relaxed">{c.messaggio}</p>
                <span className="text-[10px] text-secondary italic block pt-1">
                  Mittente: Dr. {c.medicoCognome}
                </span>
              </div>
            ))
          )}
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full h-11 rounded-xl bg-surface-container text-xs font-bold text-on-surface hover:bg-surface-container-high"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
};
