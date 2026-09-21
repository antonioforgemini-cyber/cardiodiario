"use client";

import React, { useState } from "react";
import { sendComunicazione } from "@/db/actions";

interface PatientOption {
  id: string;
  nome: string;
  cognome: string;
}

interface InvioComunicazioneModalProps {
  isOpen: boolean;
  onClose: () => void;
  pazienti: PatientOption[];
  medicoId: string;
  initialSelectedId?: string;
}

export const InvioComunicazioneModal: React.FC<InvioComunicazioneModalProps> = ({
  isOpen,
  onClose,
  pazienti,
  medicoId,
  initialSelectedId,
}) => {
  const [inviatoATutti, setInviatoATutti] = useState(!initialSelectedId);
  const [selectedIds, setSelectedIds] = useState<string[]>(
    initialSelectedId ? [initialSelectedId] : []
  );
  const [titolo, setTitolo] = useState("");
  const [messaggio, setMessaggio] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleSelectPatient = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (checked: boolean) => {
    setInviatoATutti(checked);
    if (checked) {
      setSelectedIds([]);
    }
  };

  const filteredPazienti = pazienti.filter((p) =>
    `${p.nome} ${p.cognome}`.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titolo.trim() || !messaggio.trim()) {
      setError("Inserisci sia il titolo che il testo del messaggio.");
      return;
    }
    if (!inviatoATutti && selectedIds.length === 0) {
      setError("Seleziona almeno un destinatario o attiva l'opzione 'Tutti i Pazienti'.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await sendComunicazione({
        medicoId,
        titolo,
        messaggio,
        inviatoATutti,
        destinatariIds: selectedIds,
      });

      if (res.success) {
        setSuccessMsg(`Notifica inviata con successo a ${res.count} pazienti!`);
        setTimeout(() => {
          setSuccessMsg(null);
          onClose();
        }, 1500);
      }
    } catch {
      setError("Si è verificato un errore nell'invio della notifica.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-inverse-surface/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface-container-lowest w-full max-w-xl rounded-3xl shadow-2xl border border-surface-variant/50 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-surface-variant/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-container/40 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">campaign</span>
            </div>
            <div>
              <h2 className="text-xl font-headline font-bold text-on-surface">Invia Notifica Push</h2>
              <p className="text-xs text-on-surface-variant">Invia comunicazioni cliniche o promemoria ai tuoi pazienti.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-outline hover:bg-surface-container"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-error-container text-on-error-container text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-error text-base">error</span>
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-primary-container text-on-primary-container text-xs flex items-center gap-2 font-bold">
              <span className="material-symbols-outlined text-primary text-base">check_circle</span>
              <span>{successMsg}</span>
            </div>
          )}

          {/* Recipient Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-on-surface uppercase tracking-wider">
                Destinatari Notifica
              </label>
              <label className="flex items-center gap-2 text-xs font-semibold text-primary cursor-pointer">
                <input
                  type="checkbox"
                  checked={inviatoATutti}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="rounded text-primary focus:ring-primary h-4 w-4"
                />
                Invia a Tutti i Pazienti ({pazienti.length})
              </label>
            </div>

            {!inviatoATutti && (
              <div className="p-3 rounded-2xl bg-surface-container-low border border-surface-variant/50 space-y-2">
                <input
                  type="text"
                  placeholder="Cerca paziente per nome..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full h-9 px-3 bg-surface rounded-lg text-xs border border-surface-variant/40 focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                  {filteredPazienti.map((p) => {
                    const checked = selectedIds.includes(p.id);
                    return (
                      <label
                        key={p.id}
                        className={`flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer transition-colors ${
                          checked
                            ? "bg-primary-container/30 font-bold text-primary"
                            : "hover:bg-surface-container text-on-surface"
                        }`}
                      >
                        <span>{p.cognome} {p.nome}</span>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleSelectPatient(p.id)}
                          className="rounded text-primary focus:ring-primary h-4 w-4"
                        />
                      </label>
                    );
                  })}
                </div>
                <span className="text-[11px] text-secondary font-semibold block pt-1">
                  {selectedIds.length} selezionati su {pazienti.length} totali
                </span>
              </div>
            )}
          </div>

          {/* Titolo */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-on-surface uppercase tracking-wider">
              Titolo della Comunicazione *
            </label>
            <input
              type="text"
              required
              value={titolo}
              onChange={(e) => setTitolo(e.target.value)}
              placeholder="es. Promemoria Visita di Controllo / Consigli Alimentari"
              className="w-full h-11 px-3 bg-surface-container-low rounded-xl text-sm border border-surface-variant/50 focus:ring-2 focus:ring-primary focus:outline-none"
            />
          </div>

          {/* Messaggio */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-on-surface uppercase tracking-wider">
              Messaggio Notifica *
            </label>
            <textarea
              required
              rows={4}
              value={messaggio}
              onChange={(e) => setMessaggio(e.target.value)}
              placeholder="Inserisci il testo del messaggio che apparirà sullo smartphone del paziente..."
              className="w-full p-3 bg-surface-container-low rounded-xl text-sm border border-surface-variant/50 focus:ring-2 focus:ring-primary focus:outline-none"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-secondary hover:bg-surface-container"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-on-primary text-sm font-bold shadow-sm flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-base">send</span>
              {loading ? "Invio in corso..." : "Invia Comunicazione"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
