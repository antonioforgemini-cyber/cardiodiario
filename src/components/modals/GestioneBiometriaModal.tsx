"use client";

import React, { useEffect, useState } from "react";
import { AlertCircle, Fingerprint, Plus, Smartphone, X } from "lucide-react";
import { browserSupportsWebAuthn } from "@simplewebauthn/browser";
import { listaMiePasskey, eliminaMiaPasskey } from "@/db/passkey-actions";
import { attivaBiometriaSuQuestoDispositivo } from "@/components/AttivaBiometriaSheet";
import { dimenticaBiometria } from "@/lib/biometria-client";
import { StethoscopeLoader } from "@/components/StethoscopeLoader";
import { AppDialog } from "@/components/ui/AppDialog";

interface Dispositivo {
  id: string;
  nomeDispositivo: string;
  sincronizzata: boolean;
  createdAt: string;
  lastUsedAt: string | null;
}

interface GestioneBiometriaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GestioneBiometriaModal: React.FC<GestioneBiometriaModalProps> = ({ isOpen, onClose }) => {
  const [items, setItems] = useState<Dispositivo[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [supported, setSupported] = useState(true);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      setItems(await listaMiePasskey());
    } catch {
      setError("Impossibile caricare i dispositivi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    setSupported(browserSupportsWebAuthn());
    setError(null);
    setConfirmId(null);
    void load();
  }, [isOpen]);

  const handleAttiva = async () => {
    setBusy(true);
    setError(null);
    const err = await attivaBiometriaSuQuestoDispositivo();
    if (err) setError(err);
    await load();
    setBusy(false);
  };

  const handleRimuovi = async (id: string) => {
    setBusy(true);
    setConfirmId(null);
    await eliminaMiaPasskey(id);
    dimenticaBiometria();
    await load();
    setBusy(false);
  };

  const formatData = (s: string | null) => {
    if (!s) return "mai";
    const d = new Date(s.includes("T") ? s : s.replace(" ", "T") + "Z");
    return isNaN(d.getTime())
      ? s
      : d.toLocaleDateString("it-IT", { day: "2-digit", month: "short", year: "numeric" });
  };

  return (
    <AppDialog
      isOpen={isOpen}
      onClose={busy ? () => {} : onClose}
      labelledBy="gestione-bio-title"
      dismissible={!busy}
      variant="sheet"
      maxWidthClassName="max-w-md"
    >
      {busy && <StethoscopeLoader overlay text="Aggiornamento passkey in corso..." />}
      <div className="p-5 border-b border-surface-variant/40 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-container/40 text-primary flex items-center justify-center shrink-0">
            <Fingerprint className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h1 id="gestione-bio-title" className="text-lg font-headline font-bold text-on-surface leading-tight">
              Accesso rapido
            </h1>
            <p className="text-xs text-on-surface-variant">Impronta digitale e riconoscimento del volto</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Chiudi accesso rapido"
          className="min-w-[40px] min-h-[40px] rounded-full flex items-center justify-center text-secondary hover:bg-surface-container"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>

      <div className="p-5 space-y-4 overflow-y-auto">
        {error && (
          <div
            role="alert"
            className="p-3 rounded-xl bg-error-container text-on-error-container text-sm flex items-center gap-2"
          >
            <AlertCircle className="w-5 h-5 text-error shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-6">
            <StethoscopeLoader size="md" text="Caricamento dispositivi..." />
          </div>
        ) : items.length === 0 ? (
          <p className="text-sm text-on-surface-variant text-center py-4">
            Nessun dispositivo con accesso biometrico attivo.
          </p>
        ) : (
          <ul className="space-y-2">
            {items.map((d) => (
              <li
                key={d.id}
                className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-surface-container-low border border-surface-variant/40"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Smartphone className="w-5 h-5 text-primary shrink-0" aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-on-surface truncate">{d.nomeDispositivo}</p>
                    <p className="text-xs text-on-surface-variant">
                      Attivato il {formatData(d.createdAt)} · ultimo uso {formatData(d.lastUsedAt)}
                      {d.sincronizzata ? " · sincronizzato" : ""}
                    </p>
                  </div>
                </div>
                {confirmId === d.id ? (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setConfirmId(null)}
                      className="min-h-[34px] px-2.5 rounded-lg bg-surface-container text-xs font-semibold text-on-surface"
                    >
                      No
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleRimuovi(d.id)}
                      className="min-h-[34px] px-2.5 rounded-lg bg-error text-on-error text-xs font-bold"
                    >
                      Rimuovi
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setConfirmId(d.id)}
                    className="min-h-[36px] px-2 text-xs font-semibold text-error hover:underline shrink-0 disabled:opacity-50"
                  >
                    Rimuovi
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}

        {supported ? (
          <button
            type="button"
            onClick={handleAttiva}
            disabled={busy}
            className="w-full min-h-[48px] px-4 rounded-xl bg-primary text-on-primary font-bold text-sm shadow-sm flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span>{busy ? "Attendere..." : "Attiva su questo dispositivo"}</span>
          </button>
        ) : (
          <p className="text-xs text-on-surface-variant text-center">
            Questo browser non supporta l&apos;accesso biometrico.
          </p>
        )}

        <p className="text-[11px] text-center text-outline leading-snug">
          Il dato biometrico resta sul dispositivo e non viene mai inviato a CardioDiario.
        </p>
      </div>
    </AppDialog>
  );
};
