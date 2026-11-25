"use client";

import React, { useEffect, useState } from "react";
import { AlertCircle, Check, Hand, Moon, Sun, SunMedium, Trash2, X } from "lucide-react";
import { saveMisurazioneGiornaliera, deleteMisurazione } from "@/db/actions";
import { classifyBloodPressure } from "@/lib/guidelines";
import { AlertCriticoModal } from "./AlertCriticoModal";
import { StethoscopeLoader } from "@/components/StethoscopeLoader";
import { AppDialog } from "@/components/ui/AppDialog";

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
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const [criticalValues, setCriticalValues] = useState<{ max: number; min: number } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSlot((existingMisurazione?.slot as "mattina" | "pomeriggio" | "sera") || defaultSlot);
      setDataRilevazione(defaultDate);
      setConfirmingDelete(false);
      setCriticalValues(null);

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

  const numMax = Number(pressioneMax);
  const numMin = Number(pressioneMin);
  const category = numMax && numMin && numMax > numMin ? classifyBloodPressure(numMax, numMin) : null;

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

  const handleDeleteConfirmed = async () => {
    if (!existingMisurazione?.id) return;
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
  };

  const handleCriticalAlertClose = () => {
    setCriticalValues(null);
    onSuccess();
    onClose();
  };

  return (
    <>
      <AppDialog
        isOpen={isOpen && !criticalValues}
        onClose={loading ? () => {} : onClose}
        labelledBy="nuova-misurazione-title"
        dismissible={!loading}
        variant="sheet"
        maxWidthClassName="max-w-lg"
      >
        {loading && <StethoscopeLoader overlay text="Salvataggio misurazione in corso..." />}
        <div className="p-5 sm:p-6 flex flex-col justify-between overflow-y-auto">
          <div className="flex items-center justify-between border-b border-surface-variant/40 pb-4">
            <div>
              <span className="text-xs font-bold text-primary uppercase tracking-wider">
                Giorno {giornoNumero} • {dataRilevazione}
              </span>
              <h1 id="nuova-misurazione-title" className="text-xl font-headline font-bold text-on-surface">
                {existingMisurazione ? "Modifica Misurazione" : "Nuova Misurazione"}
              </h1>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Chiudi modulo misurazione"
              className="min-w-[40px] min-h-[40px] rounded-full flex items-center justify-center text-secondary hover:bg-surface-container hover:text-on-surface"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          <div className="my-4 flex items-center justify-between gap-2 p-3.5 rounded-2xl bg-primary-container/25 border border-primary/20">
            <div className="flex items-center gap-2.5">
              <Hand className="w-6 h-6 text-primary shrink-0" aria-hidden="true" />
              <div>
                <span className="text-[11px] font-bold text-secondary uppercase block">
                  Braccio di Riferimento Ufficiale
                </span>
                <span className="text-sm font-extrabold text-primary">
                  {braccioRiferimento === "DX" ? "BRACCIO DESTRO (DX)" : "BRACCIO SINISTRO (SX)"}
                </span>
              </div>
            </div>
            <span className="text-xs text-on-surface-variant font-medium text-right">
              Usa sempre questo braccio
            </span>
          </div>

          {error && (
            <div
              role="alert"
              className="p-3 mb-3 rounded-xl bg-error-container text-on-error-container text-xs flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 text-error shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <fieldset>
              <legend className="visually-hidden">Momento della giornata</legend>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "mattina" as const, label: "Mattina", cutoff: "11:00", Icon: Sun },
                  { id: "pomeriggio" as const, label: "Pomeriggio", cutoff: "16:00", Icon: SunMedium },
                  { id: "sera" as const, label: "Sera", cutoff: "22:00", Icon: Moon },
                ].map((s) => {
                  const Icon = s.Icon;
                  const active = slot === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setSlot(s.id)}
                      className={`py-2.5 px-2 rounded-xl text-xs font-bold flex flex-col items-center gap-0.5 transition-colors border ${
                        active
                          ? "bg-primary text-on-primary border-primary shadow-sm"
                          : "bg-surface-container-low text-on-surface border-surface-variant/40 hover:bg-surface-container"
                      }`}
                    >
                      <Icon className="w-4 h-4" aria-hidden="true" />
                      <span>{s.label}</span>
                      <span className={`text-[11px] font-normal ${active ? "text-on-primary/85" : "text-secondary"}`}>
                        entro {s.cutoff}
                      </span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="mis-data" className="text-xs font-bold text-on-surface block">
                  Data Misurazione
                </label>
                <input
                  id="mis-data"
                  name="dataRilevazione"
                  type="date"
                  required
                  value={dataRilevazione}
                  onChange={(e) => setDataRilevazione(e.target.value)}
                  className="w-full min-h-[46px] px-3 mt-1 bg-surface-container-low rounded-xl text-xs font-semibold border border-surface-variant/50 focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="mis-ora" className="text-xs font-bold text-on-surface block">
                  Orario Effettivo
                </label>
                <input
                  id="mis-ora"
                  name="oraRilevazione"
                  type="time"
                  required
                  value={oraRilevazione}
                  onChange={(e) => setOraRilevazione(e.target.value)}
                  className="w-full min-h-[46px] px-3 mt-1 bg-surface-container-low rounded-xl text-xs font-semibold border border-surface-variant/50 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-1">
              <div>
                <label htmlFor="mis-max" className="text-xs font-bold text-on-surface block">
                  Pressione Massima (MAX) *
                </label>
                <div className="relative mt-1">
                  <input
                    id="mis-max"
                    name="pressioneMax"
                    type="text"
                    inputMode="numeric"
                    pattern="\d{2,3}"
                    enterKeyHint="next"
                    autoFocus={!existingMisurazione}
                    required
                    value={pressioneMax}
                    onChange={(e) => setPressioneMax(e.target.value.replace(/\D/g, ""))}
                    placeholder="120"
                    className="w-full h-16 px-3 pr-11 text-2xl font-mono font-bold text-center bg-surface-container-low rounded-xl border border-surface-variant/50 focus:outline-none placeholder:text-outline-variant/60 placeholder:font-normal"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-secondary font-semibold">
                    mmHg
                  </span>
                </div>
              </div>

              <div>
                <label htmlFor="mis-min" className="text-xs font-bold text-on-surface block">
                  Pressione Minima (MIN) *
                </label>
                <div className="relative mt-1">
                  <input
                    id="mis-min"
                    name="pressioneMin"
                    type="text"
                    inputMode="numeric"
                    pattern="\d{2,3}"
                    enterKeyHint="next"
                    required
                    value={pressioneMin}
                    onChange={(e) => setPressioneMin(e.target.value.replace(/\D/g, ""))}
                    placeholder="80"
                    className="w-full h-16 px-3 pr-11 text-2xl font-mono font-bold text-center bg-surface-container-low rounded-xl border border-surface-variant/50 focus:outline-none placeholder:text-outline-variant/60 placeholder:font-normal"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-secondary font-semibold">
                    mmHg
                  </span>
                </div>
              </div>
            </div>

            {category && (
              <div
                role="status"
                className="p-3 rounded-2xl border flex items-center justify-between gap-2 transition-all"
                style={{
                  backgroundColor: category.colorBg,
                  borderColor: category.colorBorder,
                }}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: category.colorText }}
                    aria-hidden="true"
                  />
                  <div>
                    <span className="text-xs font-bold block" style={{ color: category.colorText }}>
                      {category.category}
                    </span>
                    <span className="text-[11px] text-on-surface-variant">{category.description}</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-secondary shrink-0">
                  ESC/ESH
                </span>
              </div>
            )}

            <div>
              <label htmlFor="mis-bpm" className="text-xs font-bold text-on-surface block">
                Battiti Cardiaci (BPM - Facoltativo)
              </label>
              <div className="relative mt-1">
                <input
                  id="mis-bpm"
                  name="bpm"
                  type="text"
                  inputMode="numeric"
                  pattern="\d{2,3}"
                  enterKeyHint="next"
                  value={bpm}
                  onChange={(e) => setBpm(e.target.value.replace(/\D/g, ""))}
                  placeholder="70"
                  className="w-full min-h-[46px] px-3 pr-12 text-sm font-mono font-bold bg-surface-container-low rounded-xl border border-surface-variant/50 focus:outline-none placeholder:text-outline-variant/60 placeholder:font-normal"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-secondary">bpm</span>
              </div>
            </div>

            <div>
              <label htmlFor="mis-note" className="text-xs font-bold text-on-surface block">
                Note e Sintomi (Facoltativo)
              </label>
              <textarea
                id="mis-note"
                name="note"
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="es. Nessun sintomo, misurazione prima di pranzo..."
                className="w-full p-2.5 mt-1 bg-surface-container-low rounded-xl text-xs border border-surface-variant/50 focus:outline-none placeholder:text-outline-variant/70 placeholder:font-normal"
              />
            </div>

            {confirmingDelete ? (
              <div className="p-3 rounded-2xl bg-error-container/35 border border-error/30 flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-error">Eliminare questa misurazione?</span>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setConfirmingDelete(false)}
                    className="min-h-[38px] px-3 rounded-lg bg-surface-container text-xs font-semibold text-on-surface"
                  >
                    Annulla
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteConfirmed}
                    disabled={loading}
                    className="min-h-[38px] px-3 rounded-lg bg-error text-on-error text-xs font-bold"
                  >
                    Sì, elimina
                  </button>
                </div>
              </div>
            ) : (
              <div className="pt-2 flex items-center justify-between gap-2">
                {existingMisurazione ? (
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => setConfirmingDelete(true)}
                    className="min-h-[44px] px-2 text-xs font-bold text-error hover:underline flex items-center gap-1"
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                    <span>Elimina</span>
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="min-h-[44px] px-4 py-2 rounded-xl text-xs font-semibold text-secondary hover:bg-surface-container"
                  >
                    Annulla
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="min-h-[44px] px-6 py-2 rounded-xl bg-primary hover:bg-primary/90 text-on-primary text-xs font-bold shadow-sm flex items-center gap-1.5"
                  >
                    <span>{loading ? "Salvataggio..." : "Salva Misurazione"}</span>
                    <Check className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </AppDialog>

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
