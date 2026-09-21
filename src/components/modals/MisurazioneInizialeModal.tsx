"use client";

import React, { useState } from "react";
import { startCicloBilaterale } from "@/db/actions";

interface MisurazioneInizialeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  cicloId: string;
  pazienteId: string;
}

export default function MisurazioneInizialeModal({
  isOpen,
  onClose,
  onSuccess,
  cicloId,
  pazienteId,
}: MisurazioneInizialeModalProps) {
  // Step: 1 = DX, 2 = SX, 3 = Result & Slot Choice
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Right Arm
  const [maxDx, setMaxDx] = useState("");
  const [minDx, setMinDx] = useState("");
  const [bpmDx, setBpmDx] = useState("");

  // Left Arm
  const [maxSx, setMaxSx] = useState("");
  const [minSx, setMinSx] = useState("");
  const [bpmSx, setBpmSx] = useState("");

  // Result Selection
  const [braccioScelto, setBraccioScelto] = useState<"DX" | "SX" | null>(null);
  const [slotAssegnato, setSlotAssegnato] = useState<"mattina" | "pomeriggio" | "sera">("mattina");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleNextToLeft = (e: React.FormEvent) => {
    e.preventDefault();
    const numMaxDx = Number(maxDx);
    const numMinDx = Number(minDx);
    if (!numMaxDx || !numMinDx) {
      setError("Inserisci sia la pressione massima che minima per il braccio destro.");
      return;
    }
    if (numMaxDx <= numMinDx) {
      setError("La massima deve essere maggiore della minima.");
      return;
    }
    setError(null);
    setStep(2);
  };

  const handleNextToResult = (e: React.FormEvent) => {
    e.preventDefault();
    const numMaxSx = Number(maxSx);
    const numMinSx = Number(minSx);
    if (!numMaxSx || !numMinSx) {
      setError("Inserisci sia la pressione massima che minima per il braccio sinistro.");
      return;
    }
    if (numMaxSx <= numMinSx) {
      setError("La massima deve essere maggiore della minima.");
      return;
    }
    setError(null);

    // Calculate automatically which arm has higher systolic
    const numMaxDx = Number(maxDx);
    if (numMaxDx > numMaxSx) {
      setBraccioScelto("DX");
    } else if (numMaxSx > numMaxDx) {
      setBraccioScelto("SX");
    } else {
      // Tie!
      setBraccioScelto("DX"); // default choice, patient can switch
    }
    setStep(3);
  };

  const handleConfirm = async () => {
    if (!braccioScelto) return;
    setLoading(true);
    setError(null);

    try {
      const res = await startCicloBilaterale({
        cicloId,
        pazienteId,
        maxDx: Number(maxDx),
        minDx: Number(minDx),
        bpmDx: bpmDx ? Number(bpmDx) : undefined,
        maxSx: Number(maxSx),
        minSx: Number(minSx),
        bpmSx: bpmSx ? Number(bpmSx) : undefined,
        braccioScelto,
        slotAssegnato,
      });

      if (res.success) {
        onSuccess();
        onClose();
      }
    } catch {
      setError("Errore durante l'avvio del ciclo.");
    } finally {
      setLoading(false);
    }
  };

  const isTie = Number(maxDx) === Number(maxSx);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-inverse-surface/50 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-surface-container-lowest w-full max-w-lg rounded-3xl shadow-2xl border border-surface-variant/50 p-6 flex flex-col justify-between max-h-[90vh] overflow-y-auto">
        {/* Step Indicator Header */}
        <div className="flex items-center justify-between border-b border-surface-variant/40 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-full bg-primary text-on-primary text-xs font-bold flex items-center justify-center">
              {step}/3
            </span>
            <span className="text-xs font-bold text-on-surface uppercase tracking-wider">
              {step === 1 && "Fase 1: Misurazione Braccio Destro"}
              {step === 2 && "Fase 2: Misurazione Braccio Sinistro"}
              {step === 3 && "Fase 3: Esito e Avvio Ciclo"}
            </span>
          </div>
          <button onClick={onClose} className="text-outline hover:text-on-surface">
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {error && (
          <div className="p-3 my-3 rounded-xl bg-error-container text-on-error-container text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-error text-base">error</span>
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: BRACCIO DESTRO */}
        {step === 1 && (
          <form onSubmit={handleNextToLeft} className="py-4 space-y-5">
            <div className="text-center space-y-1">
              <div className="w-16 h-16 rounded-2xl bg-primary-container/30 text-primary flex items-center justify-center mx-auto mb-2">
                <span className="material-symbols-outlined text-3xl">pan_tool</span>
              </div>
              <h3 className="text-xl font-headline font-bold text-on-surface">Misura il Braccio Destro</h3>
              <p className="text-xs text-on-surface-variant max-w-xs mx-auto">
                Posiziona il bracciale sul braccio destro ed effettua la prima misurazione.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-on-surface">Pressione Massima (MAX) *</label>
                <div className="relative mt-1">
                  <input
                    type="number"
                    required
                    value={maxDx}
                    onChange={(e) => setMaxDx(e.target.value)}
                    placeholder="es. 135"
                    className="w-full h-14 px-3 text-xl font-mono font-bold bg-surface-container-low rounded-xl text-center border border-surface-variant/40 focus:ring-2 focus:ring-primary focus:outline-none"
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
                    value={minDx}
                    onChange={(e) => setMinDx(e.target.value)}
                    placeholder="es. 85"
                    className="w-full h-14 px-3 text-xl font-mono font-bold bg-surface-container-low rounded-xl text-center border border-surface-variant/40 focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-secondary font-semibold">mmHg</span>
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-on-surface">Battiti Cardiaci (BPM - Facoltativo)</label>
              <input
                type="number"
                value={bpmDx}
                onChange={(e) => setBpmDx(e.target.value)}
                placeholder="es. 72"
                className="w-full h-11 px-3 mt-1 bg-surface-container-low rounded-xl text-center font-mono border border-surface-variant/40 focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full h-12 rounded-xl bg-primary text-on-primary text-sm font-bold shadow-sm flex items-center justify-center gap-2 mt-4"
            >
              <span>Procedi al Braccio Sinistro</span>
              <span className="material-symbols-outlined text-lg">arrow_forward</span>
            </button>
          </form>
        )}

        {/* STEP 2: BRACCIO SINISTRO */}
        {step === 2 && (
          <form onSubmit={handleNextToResult} className="py-4 space-y-5">
            <div className="text-center space-y-1">
              <div className="w-16 h-16 rounded-2xl bg-secondary-container text-tertiary flex items-center justify-center mx-auto mb-2">
                <span className="material-symbols-outlined text-3xl">pan_tool</span>
              </div>
              <h3 className="text-xl font-headline font-bold text-on-surface">Misura il Braccio Sinistro</h3>
              <p className="text-xs text-on-surface-variant max-w-xs mx-auto">
                Sposta il bracciale sul braccio sinistro e ripeti la misurazione.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-on-surface">Pressione Massima (MAX) *</label>
                <div className="relative mt-1">
                  <input
                    type="number"
                    required
                    value={maxSx}
                    onChange={(e) => setMaxSx(e.target.value)}
                    placeholder="es. 128"
                    className="w-full h-14 px-3 text-xl font-mono font-bold bg-surface-container-low rounded-xl text-center border border-surface-variant/40 focus:ring-2 focus:ring-primary focus:outline-none"
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
                    value={minSx}
                    onChange={(e) => setMinSx(e.target.value)}
                    placeholder="es. 82"
                    className="w-full h-14 px-3 text-xl font-mono font-bold bg-surface-container-low rounded-xl text-center border border-surface-variant/40 focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-secondary font-semibold">mmHg</span>
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-on-surface">Battiti Cardiaci (BPM - Facoltativo)</label>
              <input
                type="number"
                value={bpmSx}
                onChange={(e) => setBpmSx(e.target.value)}
                placeholder="es. 70"
                className="w-full h-11 px-3 mt-1 bg-surface-container-low rounded-xl text-center font-mono border border-surface-variant/40 focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="h-12 px-4 rounded-xl bg-surface-container text-xs font-bold text-on-surface"
              >
                Torna a DX
              </button>
              <button
                type="submit"
                className="flex-1 h-12 rounded-xl bg-primary text-on-primary text-sm font-bold shadow-sm flex items-center justify-center gap-2"
              >
                <span>Confronta Valori</span>
                <span className="material-symbols-outlined text-lg">check_circle</span>
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: RESULT & SLOT CHOICE */}
        {step === 3 && (
          <div className="py-4 space-y-5">
            {/* Comparison Box */}
            <div className="p-4 rounded-2xl bg-surface-container-low border border-surface-variant/40 space-y-3">
              <span className="text-xs font-bold text-secondary uppercase tracking-wider block text-center">
                Esito del Confronto
              </span>

              <div className="grid grid-cols-2 gap-3 text-center">
                <div className={`p-3 rounded-xl border ${braccioScelto === "DX" ? "bg-primary-container/30 border-primary" : "bg-white border-surface-variant/30"}`}>
                  <span className="text-xs font-bold text-secondary block">Braccio Destro</span>
                  <span className="text-xl font-bold font-mono text-on-surface">{maxDx} / {minDx}</span>
                </div>
                <div className={`p-3 rounded-xl border ${braccioScelto === "SX" ? "bg-primary-container/30 border-primary" : "bg-white border-surface-variant/30"}`}>
                  <span className="text-xs font-bold text-secondary block">Braccio Sinistro</span>
                  <span className="text-xl font-bold font-mono text-on-surface">{maxSx} / {minSx}</span>
                </div>
              </div>

              {isTie ? (
                <div className="p-3 rounded-xl bg-secondary-container/50 text-xs space-y-2">
                  <p className="font-bold text-on-surface text-center">
                    La pressione massima è identica su entrambe le braccia ({maxDx} mmHg).
                  </p>
                  <p className="text-center text-on-surface-variant">Seleziona quale braccio preferisci utilizzare:</p>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setBraccioScelto("DX")}
                      className={`py-2 rounded-lg text-xs font-bold transition-all ${braccioScelto === "DX" ? "bg-primary text-on-primary" : "bg-white text-on-surface"}`}
                    >
                      Braccio Destro
                    </button>
                    <button
                      type="button"
                      onClick={() => setBraccioScelto("SX")}
                      className={`py-2 rounded-lg text-xs font-bold transition-all ${braccioScelto === "SX" ? "bg-primary text-on-primary" : "bg-white text-on-surface"}`}
                    >
                      Braccio Sinistro
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-center text-on-surface-variant leading-relaxed">
                  La pressione massima è risultata maggiore al{" "}
                  <strong className="text-primary uppercase font-extrabold">
                    {braccioScelto === "DX" ? "Braccio Destro (DX)" : "Braccio Sinistro (SX)"}
                  </strong>.
                  Questo sarà il tuo braccio di riferimento per tutte le prossime misurazioni.
                </p>
              )}
            </div>

            {/* Day 1 Slot Placement */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-on-surface uppercase tracking-wider block">
                A quale momento della giornata vuoi assegnare questa prima misurazione? *
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "mattina", label: "Mattina", icon: "wb_sunny" },
                  { id: "pomeriggio", label: "Pomeriggio", icon: "light_mode" },
                  { id: "sera", label: "Sera", icon: "bedtime" },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSlotAssegnato(s.id as any)}
                    className={`py-3 px-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition-all border ${
                      slotAssegnato === s.id
                        ? "bg-primary text-on-primary border-primary shadow-sm"
                        : "bg-surface-container-low text-on-surface border-surface-variant/40 hover:bg-surface-container"
                    }`}
                  >
                    <span className="material-symbols-outlined text-lg">{s.icon}</span>
                    <span>{s.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              disabled={loading || !braccioScelto}
              onClick={handleConfirm}
              className="w-full h-13 py-3 rounded-xl bg-primary text-on-primary text-sm font-bold shadow-sm flex items-center justify-center gap-2 mt-4 active:scale-98 transition-all disabled:opacity-50"
            >
              <span>{loading ? "Avvio ciclo in corso..." : "Salva e Inizia il Diario"}</span>
              <span className="material-symbols-outlined text-lg">check</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
