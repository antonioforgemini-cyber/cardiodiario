"use client";

import React from "react";

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
  if (!isOpen) return null;

  const publicNotes = note.filter((n) => n.visibilePaziente);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-inverse-surface/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface-container-lowest w-full max-w-md rounded-3xl shadow-2xl border border-surface-variant/50 p-6 space-y-4 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-surface-variant/40 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary-container/40 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-xl">prescriptions</span>
            </div>
            <div>
              <h2 className="text-lg font-headline font-bold text-on-surface">Note Terapeutiche del Medico</h2>
              <p className="text-[11px] text-on-surface-variant">Indicazioni e consigli clinici prescritti.</p>
            </div>
          </div>
          <button onClick={onClose} className="text-outline hover:text-on-surface">
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {publicNotes.length === 0 ? (
            <p className="text-xs text-secondary italic text-center py-6">
              Nessuna nota terapeutica inviata dal medico al momento.
            </p>
          ) : (
            publicNotes.map((n) => (
              <div key={n.id} className="p-4 rounded-2xl bg-surface-container-low border border-surface-variant/40 space-y-1.5">
                <span className="text-[10px] text-secondary font-semibold block">
                  {new Date(n.createdAt).toLocaleDateString("it-IT", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
                <p className="text-xs font-medium text-on-surface leading-relaxed">{n.testo}</p>
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
