"use client";

import React from "react";
import { StethoscopeLoader } from "@/components/StethoscopeLoader";

interface ConfermaEliminazioneModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  loading?: boolean;
}

export const ConfermaEliminazioneModal: React.FC<ConfermaEliminazioneModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Elimina Definitivamente",
  loading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-inverse-surface/50 backdrop-blur-xs animate-in fade-in duration-200">
      {loading && <StethoscopeLoader overlay text="Eliminazione in corso..." />}

      <div className="bg-surface-container-lowest w-full max-w-md rounded-3xl shadow-2xl border border-surface-variant/50 p-6 space-y-5">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-error-container/50 text-error flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-2xl">delete_forever</span>
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-headline font-bold text-on-surface leading-tight">
              {title}
            </h3>
            <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-3 border-t border-surface-variant/40">
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-xs sm:text-sm font-semibold text-on-surface transition-colors disabled:opacity-50"
          >
            Annulla
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className="px-5 py-2.5 rounded-xl bg-error hover:bg-error/90 text-on-error text-xs sm:text-sm font-bold shadow-sm flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-base">delete</span>
            <span>{confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
