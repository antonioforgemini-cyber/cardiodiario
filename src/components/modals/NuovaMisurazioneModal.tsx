"use client";

import React, { useState, useEffect } from "react";
import { saveMisurazioneGiornaliera, deleteMisurazione } from "@/db/actions";
import { classifyBloodPressure, isCriticalValue } from "@/lib/guidelines";
import { AlertCriticoModal } from "./AlertCriticoModal";

interface NuovaMisurazioneModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  cicloId: string;
  pazienteId: string;
  giornoNumero: number;
  defaultSlot: "mattina" | "pomeriggio" | "sera";
  defaultDate: string;
  braccioRiferimento: "DX" | "SX";
  existingMisurazione?: {
    id: string;
    pressioneMax: number;
    pressioneMin: number;
    bpm?: number | null;
    note?: string | null;
    oraRilevazione: string;
    slot: string;
  } | null;
}

export const NuovaMisurazioneModal: React.FC<NuovaMisurazioneModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  cicloId,
  pazienteId,
  giornoNumero,
  defaultSlot,
  defaultDate,
  braccioRiferimento,
  existingMisurazione,
}) => {
  const [slot, setSlot] = useState(defaultSlot);
  const [dataRilevazione, setDataRilevazione] = useState(defaultDate);
  const [oraRilevazione, setOraRilevazione] = useState("");
  const [pressioneMax, setPressioneMax] = useState("");
  const [pressioneMin, setPressioneMin] = useState("");
  const [bpm, setBpm] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Critical Alert State
  const [criticalValues, setCriticalValues] = useState<{ max: number; min: number } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSlot(existingMisurazione?.slot as any || defaultSlot);
      setDataRilevazione(defaultDate);

      if (existingMisurazione) {
        setOraRilevazione(existingMisurazione.oraRilevazione || "08:30");
        setPressioneMax(existingMisurazione.pressioneMax.toString());
        setPressioneMin(existingMisurazione.pressioneMin.toString());
        setBpm(existingMisurazione.bpm ? existingMisurazione.bpm.toString() : "");
        setNote(existingMisurazione.note || "");
      } else {
        const now = new Date();
        const timeNow = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
        setOraRilevazione(timeNow);
        setPressioneMax("");
        setPressioneMin("");
        setBpm("");
        setNote("");
      }
      setError(null);
    }
  }, [isOpen, defaultSlot, defaultDate, existingMisurazione]);

  if (!isOpen) return null;

  const numMax = Number(pressioneMax);
  const numMin = Number(pressioneMin);
  const category = (numMax && numMin) ? classifyBloodPressure(numMax, numMin) : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!numMax || !numMin) {
      setError("Inserisci sia la pressione massima che minima.");
      return;
    }
    if (numMax <= numMin) {
      setError("La pressione massima (sistolica) deve essere maggiore della minima (diastolica).");
      return;
    }
    if (numMax < 60 || numMax > 280 || numMin < 40 || numMin > 160) {
      setError("I valori inseriti sono fuori scala fisiologica. Controlla i dati.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await saveMisurazioneGiornaliera({
        id: existingMisurazione?.id,
        cicloId,
        pazienteId,
        giornoNumero,
        slot,
        dataRilevazione,
        oraRilevazione,
        braccio: braccioRiferimento,
        pressioneMax: numMax,
        pressioneMin: numMin,
        bpm: bpm ? Number(bpm) : undefined,
        note: note.trim() || undefined,
      });

      if (res.success) {
        if (res.isCritica) {
          setCriticalValues({ max: numMax, min: numMin });
        } else {
          onSuccess();
          onClose();
        }
      }
    } catch {
      setError("Errore durante il salvataggio della misurazione.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!existingMisurazione?.id) return;
    if (confirm("Sei sicuro di voler eliminare questa misurazione?")) {
      setLoading(true);
      try {
        await deleteMisurazione(existingMisurazione.id);
        onSuccess();
        onClose();
      } catch {
        setError("Errore durante l'eliminazione.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCriticalAlertClose = () => {
    setCriticalValues(null);
    onSuccess();
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-inverse-surface/40 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-surface-container-lowest w-full max-w-lg rounded-3xl shadow-2xl border border-surface-variant/50 p-6 flex flex-col justify-between max-h-[92vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-surface-variant/40 pb-4">
            <div>
              <span className="text-xs font-bold text-primary uppercase tracking-wider">
                Giorno {giornoNumero} • {dataRilevazione}
              </span>
              <h2 className="text-xl font-headline font-bold text-on-surface">
                {existingMisurazione ? "Modifica Misurazione" : "Nuova Misurazione"}
              </h2>
            </div>
            <button onClick={onClose} className="text-outline hover:text-on-surface">
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>

          {/* Official Reference Arm Reminder */}
          <div className="my-4 flex items-center justify-between p-3.5 rounded-2xl bg-primary-container/25 border border-primary/20">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                pan_tool
              </span>
              <div>
                <span className="text-[11px] font-bold text-secondary uppercase block">
                  Braccio di Riferimento Ufficiale
                </span>
                <span className="text-sm font-extrabold text-primary">
                  {braccioRiferimento === "DX" ? "BRACCIO DESTRO (DX)" : "BRACCIO SINISTRO (SX)"}
                </span>
              </div>
            </div>
            <span className="text-xs text-on-surface-variant font-medium">Usa sempre questo braccio</span>
          </div>

          {error && (
            <div className="p-3 mb-3 rounded-xl bg-error-container text-on-error-container text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-error text-base">error</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Slot Choice */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "mattina", label: "Mattina", cutoff: "11:00", icon: "wb_sunny" },
                { id: "pomeriggio", label: "Pomeriggio", cutoff: "16:00", icon: "light_mode" },
                { id: "sera", label: "Sera", cutoff: "22:00", icon: "bedtime" },
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSlot(s.id as any)}
                  className={`py-2.5 px-2 rounded-xl text-xs font-bold flex flex-col items-center gap-0.5 transition-all border ${
                    slot === s.id
                      ? "bg-primary text-on-primary border-primary shadow-sm"
                      : "bg-surface-container-low text-on-surface border-surface-variant/40 hover:bg-surface-container"
                  }`}
                >
                  <span className="material-symbols-outlined text-base">{s.icon}</span>
                  <span>{s.label}</span>
                  <span className={`text-[10px] font-normal ${slot === s.id ? "text-on-primary/80" : "text-secondary"}`}>
                    entro {s.cutoff}
                  </span>
                </button>
              ))}
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-on-surface">Data Misurazione</label>
                <input
                  type="date"
                  required
                  value={dataRilevazione}
                  onChange={(e) => setDataRilevazione(e.target.value)}
                  className="w-full h-11 px-3 mt-1 bg-surface-container-low rounded-xl text-xs font-semibold border border-surface-variant/40 focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-on-surface">Orario Effettivo</label>
                <input
                  type="time"
                  required
                  value={oraRilevazione}
                  onChange={(e) => setOraRilevazione(e.target.value)}
                  className="w-full h-11 px-3 mt-1 bg-surface-container-low rounded-xl text-xs font-semibold border border-surface-variant/40 focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>
            </div>

            {/* MAX & MIN Input with Live ESC/ESH Feedback */}
            <div className="grid grid-cols-2 gap-4 pt-1">
              <div>
                <label className="text-xs font-bold text-on-surface">Pressione Massima (MAX) *</label>
                <div className="relative mt-1">
                  <input
                    type="number"
                    required
                    value={pressioneMax}
                    onChange={(e) => setPressioneMax(e.target.value)}
                    placeholder="120"
                    className="w-full h-16 px-3 text-2xl font-mono font-bold text-center bg-surface-container-low rounded-xl border border-surface-variant/40 focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-secondary font-semibold">mmHg</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-on-surface">Pressione Minima (MIN) *</label>
                <div className="relative mt-1">
                  <input
                    type="number"
                    required
                    value={pressioneMin}
                    onChange={(e) => setPressioneMin(e.target.value)}
                    placeholder="80"
                    className="w-full h-16 px-3 text-2xl font-mono font-bold text-center bg-surface-container-low rounded-xl border border-surface-variant/40 focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-secondary font-semibold">mmHg</span>
                </div>
              </div>
            </div>

            {/* Live ESC/ESH Classification Badge */}
            {category && (
              <div className="p-3 rounded-2xl border flex items-center justify-between transition-all" style={{ backgroundColor: category.colorBg, borderColor: category.colorBorder }}>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: category.colorText }}></span>
                  <div>
                    <span className="text-xs font-bold block" style={{ color: category.colorText }}>
                      {category.category}
                    </span>
                    <span className="text-[11px] text-secondary">{category.description}</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-secondary">ESC/ESH 2026</span>
              </div>
            )}

            {/* BPM */}
            <div>
              <label className="text-xs font-bold text-on-surface">Battiti Cardiaci (BPM - Facoltativo)</label>
              <div className="relative mt-1">
                <input
                  type="number"
                  value={bpm}
                  onChange={(e) => setBpm(e.target.value)}
                  placeholder="70"
                  className="w-full h-11 px-3 text-sm font-mono font-bold bg-surface-container-low rounded-xl border border-surface-variant/40 focus:ring-2 focus:ring-primary focus:outline-none"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-secondary">bpm</span>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs font-bold text-on-surface">Note e Sintomi (Facoltativo)</label>
              <textarea
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="es. Nessun sintomo, misurazione prima di pranzo..."
                className="w-full p-2.5 mt-1 bg-surface-container-low rounded-xl text-xs border border-surface-variant/40 focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-between">
              {existingMisurazione ? (
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleDelete}
                  className="text-xs font-bold text-error hover:underline flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-base">delete</span>
                  Elimina
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-secondary hover:bg-surface-container"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-on-primary text-xs font-bold shadow-sm flex items-center gap-1.5"
                >
                  <span>{loading ? "Salvataggio..." : "Salva Misurazione"}</span>
                  <span className="material-symbols-outlined text-base">check</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {criticalValues && (
        <AlertCriticoModal
          isOpen={true}
          onClose={handleCriticalAlertClose}
          max={criticalValues.max}
          min={criticalValues.min}
        />
      )}
    </>
  );
};
