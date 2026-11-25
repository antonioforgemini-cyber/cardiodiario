"use client";

import React, { useEffect, useState } from "react";
import { AlertCircle, BellRing, CheckCircle2, Megaphone, Send, X } from "lucide-react";
import { sendComunicazione } from "@/db/actions";
import { StethoscopeLoader } from "@/components/StethoscopeLoader";
import { AppDialog } from "@/components/ui/AppDialog";

interface PatientOption {
  id: string;
  nome: string;
  cognome: string;
  pushActive?: boolean;
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

  useEffect(() => {
    if (isOpen) {
      setSuccessMsg(null);
      setError(null);
      setInviatoATutti(!initialSelectedId);
      setSelectedIds(initialSelectedId ? [initialSelectedId] : []);
    }
  }, [isOpen, initialSelectedId]);

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
        const pushNote = res.pushConfigured
          ? ` (${res.pushSent} notifiche push inviate ai dispositivi attivi)`
          : " (salvato nel centro notifiche in-app)";
        setSuccessMsg(`Comunicazione inviata a ${res.count} pazienti${pushNote}.`);
        setTitolo("");
        setMessaggio("");
        setTimeout(() => {
          setSuccessMsg(null);
          onClose();
        }, 1600);
      }
    } catch {
      setError("Si è verificato un errore nell'invio della notifica.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppDialog
      isOpen={isOpen}
      onClose={loading ? () => {} : onClose}
      labelledBy="invio-com-title"
      dismissible={!loading}
      variant="sheet"
      maxWidthClassName="max-w-xl"
    >
      {loading && <StethoscopeLoader overlay text="Invio comunicazione in corso..." />}

      <div className="p-4 sm:p-6 pb-3 sm:pb-4 border-b border-surface-variant/40 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-container/40 text-primary flex items-center justify-center shrink-0">
            <Megaphone className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h1 id="invio-com-title" className="text-lg sm:text-xl font-headline font-bold text-on-surface leading-tight">
              Invia Notifica Push
            </h1>
            <p className="text-xs text-on-surface-variant">
              Invia comunicazioni cliniche o promemoria ai tuoi pazienti.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Chiudi invio notifica"
          className="min-w-[40px] min-h-[40px] rounded-full flex items-center justify-center text-secondary hover:bg-surface-container"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
        {error && (
          <div
            role="alert"
            className="p-3 rounded-xl bg-error-container text-on-error-container text-xs flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 text-error shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div
            role="status"
            className="p-3 rounded-xl bg-primary-container text-on-primary-container text-xs flex items-center gap-2 font-bold"
          >
            <CheckCircle2 className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-xs font-bold text-on-surface uppercase tracking-wider">
              Destinatari Notifica
            </span>
            <label htmlFor="modal-send-all" className="flex items-center gap-2 text-xs font-semibold text-primary cursor-pointer min-h-[36px]">
              <input
                id="modal-send-all"
                type="checkbox"
                checked={inviatoATutti}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="rounded text-primary h-4 w-4"
              />
              <span>Invia a Tutti i Pazienti ({pazienti.length})</span>
            </label>
          </div>

          {!inviatoATutti && (
            <div className="p-3 rounded-2xl bg-surface-container-low border border-surface-variant/50 space-y-2">
              <label htmlFor="modal-search-recipient" className="visually-hidden">
                Cerca paziente per nome
              </label>
              <input
                id="modal-search-recipient"
                type="search"
                placeholder="Cerca paziente per nome..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full min-h-[40px] px-3 bg-surface rounded-lg text-xs border border-surface-variant/40 focus:outline-none"
              />
              <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                {filteredPazienti.map((p) => {
                  const checked = selectedIds.includes(p.id);
                  const cbId = `modal-rec-${p.id}`;
                  return (
                    <label
                      key={p.id}
                      htmlFor={cbId}
                      className={`flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer transition-colors ${
                        checked
                          ? "bg-primary-container/30 font-bold text-primary"
                          : "hover:bg-surface-container text-on-surface"
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <span>{p.cognome} {p.nome}</span>
                        {p.pushActive && (
                          <BellRing className="w-3.5 h-3.5 text-primary" aria-label="Push attive" />
                        )}
                      </span>
                      <input
                        id={cbId}
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleSelectPatient(p.id)}
                        className="rounded text-primary h-4 w-4"
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

        <div className="space-y-1">
          <label htmlFor="modal-com-titolo" className="text-xs font-bold text-on-surface uppercase tracking-wider block">
            Titolo della Comunicazione *
          </label>
          <input
            id="modal-com-titolo"
            name="titolo"
            type="text"
            required
            value={titolo}
            onChange={(e) => setTitolo(e.target.value)}
            placeholder="es. Promemoria Visita di Controllo / Consigli Alimentari"
            className="w-full min-h-[46px] px-3 bg-surface-container-low rounded-xl text-sm border border-surface-variant/50 focus:outline-none"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="modal-com-msg" className="text-xs font-bold text-on-surface uppercase tracking-wider block">
            Messaggio Notifica *
          </label>
          <textarea
            id="modal-com-msg"
            name="messaggio"
            required
            rows={4}
            value={messaggio}
            onChange={(e) => setMessaggio(e.target.value)}
            placeholder="Inserisci il testo del messaggio che apparirà sullo smartphone del paziente..."
            className="w-full p-3 bg-surface-container-low rounded-xl text-sm border border-surface-variant/50 focus:outline-none"
          />
        </div>

        <div className="pt-3 border-t border-surface-variant/30 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-4 py-2 rounded-xl text-sm font-semibold text-secondary hover:bg-surface-container text-center"
          >
            Annulla
          </button>
          <button
            type="submit"
            disabled={loading}
            className="min-h-[44px] px-6 py-2 rounded-xl bg-primary hover:bg-primary/90 text-on-primary text-sm font-bold shadow-sm flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" aria-hidden="true" />
            <span>{loading ? "Invio in corso..." : "Invia Comunicazione"}</span>
          </button>
        </div>
      </form>
    </AppDialog>
  );
};
