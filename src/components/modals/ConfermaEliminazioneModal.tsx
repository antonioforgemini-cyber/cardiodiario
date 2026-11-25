"use client";

import React from "react";
import { Trash2 } from "lucide-react";
import { StethoscopeLoader } from "@/components/StethoscopeLoader";
import { AppDialog } from "@/components/ui/AppDialog";

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
  return (
    <AppDialog
      isOpen={isOpen}
      onClose={loading ? () => {} : onClose}
      labelledBy="confirm-delete-title"
      dismissible={!loading}
      variant="center"
      maxWidthClassName="max-w-md"
    >
      {loading && <StethoscopeLoader overlay text="Operazione in corso..." />}
      <div className="p-6 space-y-5">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-error-container/50 text-error flex items-center justify-center shrink-0">
            <Trash2 className="w-5 h-5" aria-hidden="true" />
          </div>
          <div className="space-y-1">
            <h1 id="confirm-delete-title" className="text-lg font-headline font-bold text-on-surface leading-tight">
              {title}
            </h1>
            <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-3 border-t border-surface-variant/40">
          <button
            type="button"
            autoFocus
            disabled={loading}
            onClick={onClose}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-xs sm:text-sm font-semibold text-on-surface transition-colors disabled:opacity-50"
          >
            Annulla
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className="min-h-[44px] px-5 py-2 rounded-xl bg-error hover:bg-error/90 text-on-error text-xs sm:text-sm font-bold shadow-sm flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" aria-hidden="true" />
            <span>{confirmLabel}</span>
          </button>
        </div>
      </div>
    </AppDialog>
  );
};
