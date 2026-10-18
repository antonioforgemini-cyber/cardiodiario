"use client";

import React, { useEffect, useState } from "react";
import { browserSupportsWebAuthn } from "@simplewebauthn/browser";
import { listaMiePasskey, eliminaMiaPasskey } from "@/db/passkey-actions";
import { attivaBiometriaSuQuestoDispositivo } from "@/components/AttivaBiometriaSheet";
import { dimenticaBiometria } from "@/lib/biometria-client";
import { StethoscopeLoader } from "@/components/StethoscopeLoader";

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

/** Elenco dei dispositivi con accesso biometrico attivo per l'utente corrente (paziente o medico). */
export const GestioneBiometriaModal: React.FC<GestioneBiometriaModalProps> = ({ isOpen, onClose }) => {
  const [items, setItems] = useState<Dispositivo[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [supported, setSupported] = useState(true);

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
    load();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAttiva = async () => {
    setBusy(true);
    setError(null);
    const err = await attivaBiometriaSuQuestoDispositivo();
    if (err) setError(err);
    await load();
    setBusy(false);
  };

  const handleRimuovi = async (id: string) => {
    if (!confirm("Rimuovere l'accesso biometrico da questo dispositivo?")) return;
    setBusy(true);
    await eliminaMiaPasskey(id);
    dimenticaBiometria();
    await load();
    setBusy(false);
  };

  const formatData = (s: string | null) => {
    if (!s) return "mai";
    const d = new Date(s.includes("T") ? s : s.replace(" ", "T") + "Z");
    return isNaN(d.getTime()) ? s : d.toLocaleDateString("it-IT", { day: "2-digit", month: "short", year: "numeric" });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-inverse-surface/40 backdrop-blur-sm animate-in fade-in duration-200">
      {busy && <StethoscopeLoader overlay text="Aggiornamento passkey in corso..." />}
      <div className="bg-surface-container-lowest w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl border-t sm:border border-surface-variant/50 overflow-hidden max-h-[88vh] flex flex-col animate-in slide-in-from-bottom-6 duration-300">
        <div className="p-5 border-b border-surface-variant/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-container/40 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">fingerprint</span>
            </div>
            <div>
              <h2 className="text-lg font-headline font-bold text-on-surface leading-tight">Accesso rapido</h2>
              <p className="text-xs text-on-surface-variant">Impronta digitale e riconoscimento del volto</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Chiudi"
            className="w-8 h-8 rounded-full flex items-center justify-center text-outline hover:bg-surface-container"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-3 rounded-xl bg-error-container text-on-error-container text-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-error text-xl">error</span>
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
                    <span className="material-symbols-outlined text-primary text-2xl">smartphone</span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-on-surface truncate">{d.nomeDispositivo}</p>
                      <p className="text-[11px] text-on-surface-variant">
                        Attivato il {formatData(d.createdAt)} · ultimo uso {formatData(d.lastUsedAt)}
                        {d.sincronizzata ? " · sincronizzato" : ""}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleRimuovi(d.id)}
                    className="text-xs font-semibold text-error hover:underline flex-shrink-0 disabled:opacity-50"
                  >
                    Rimuovi
                  </button>
                </li>
              ))}
            </ul>
          )}

          {supported ? (
            <button
              type="button"
              onClick={handleAttiva}
              disabled={busy}
              className="w-full h-12 rounded-xl bg-primary text-on-primary font-bold text-sm shadow-sm flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <span className="material-symbols-outlined text-lg">add</span>
              {busy ? "Attendere..." : "Attiva su questo dispositivo"}
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
      </div>
    </div>
  );
};
