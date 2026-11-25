"use client";

import React from "react";
import { ClipboardList, X } from "lucide-react";
import { AppDialog } from "@/components/ui/AppDialog";

interface NoteTerapiaModalProps {
  isOpen: boolean;
  onClose: () => void;
  note: Array<{ id: string; testo: string; createdAt: string; visibilePaziente: boolean }>;
}

export const NoteTerapiaModal: React.FC<NoteTerapiaModalProps> = ({
  isOpen,
  onClose,
  note,
}) => {
  const publicNotes = note.filter((n) => n.visibilePaziente);

  return (
    <AppDialog
      isOpen={isOpen}
      onClose={onClose}
      labelledBy="note-terapia-title"
      variant="sheet"
      maxWidthClassName="max-w-md"
    >
      <div className="p-6 space-y-4 flex flex-col max-h-[82vh]">
        <div className="flex items-center justify-between border-b border-surface-variant/40 pb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary-container/40 text-primary flex items-center justify-center shrink-0">
              <ClipboardList className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h1 id="note-terapia-title" className="text-lg font-headline font-bold text-on-surface">
                Note Terapeutiche del Medico
              </h1>
              <p className="text-xs text-on-surface-variant">
                Indicazioni e consigli clinici prescritti.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Chiudi note terapeutiche"
            className="min-w-[40px] min-h-[40px] rounded-full flex items-center justify-center text-secondary hover:bg-surface-container hover:text-on-surface"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {publicNotes.length === 0 ? (
            <p className="text-xs sm:text-sm text-secondary italic text-center py-6">
              Nessuna nota terapeutica inviata dal medico al momento.
            </p>
          ) : (
            publicNotes.map((n) => (
              <div
                key={n.id}
                className="p-4 rounded-2xl bg-surface-container-low border border-surface-variant/40 space-y-1.5"
              >
                <span className="text-[11px] text-secondary font-semibold block">
                  {new Date(n.createdAt).toLocaleDateString("it-IT", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
                <p className="text-xs sm:text-sm font-medium text-on-surface leading-relaxed">
                  {n.testo}
                </p>
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
