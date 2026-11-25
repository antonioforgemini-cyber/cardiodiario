"use client";

import React, { useEffect, useState } from "react";
import { AlertCircle, ArrowRight, Check, CheckCircle2, Hand, Moon, Sun, SunMedium, X } from "lucide-react";
import { startCicloBilaterale } from "@/db/actions";
import { StethoscopeLoader } from "@/components/StethoscopeLoader";
import { AppDialog } from "@/components/ui/AppDialog";

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
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [maxDx, setMaxDx] = useState("");
  const [minDx, setMinDx] = useState("");
  const [bpmDx, setBpmDx] = useState("");

  const [maxSx, setMaxSx] = useState("");
  const [minSx, setMinSx] = useState("");
  const [bpmSx, setBpmSx] = useState("");

  const [braccioScelto, setBraccioScelto] = useState<"DX" | "SX" | null>(null);
  const [slotAssegnato, setSlotAssegnato] = useState<"mattina" | "pomeriggio" | "sera">("mattina");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setMaxDx("");
      setMinDx("");
      setBpmDx("");
      setMaxSx("");
      setMinSx("");
      setBpmSx("");
      setBraccioScelto(null);
      setSlotAssegnato("mattina");
      setError(null);
    }
  }, [isOpen, cicloId]);

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
    if (numMaxDx < 60 || numMaxDx > 280 || numMinDx < 40 || numMinDx > 160) {
      setError("Valori fuori scala fisiologica. Controlla i numeri inseriti.");
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
    if (numMaxSx < 60 || numMaxSx > 280 || numMinSx < 40 || numMinSx > 160) {
      setError("Valori fuori scala fisiologica. Controlla i numeri inseriti.");
      return;
    }
    setError(null);

    const numMaxDx = Number(maxDx);
    if (numMaxDx > numMaxSx) {
      setBraccioScelto("DX");
    } else if (numMaxSx > numMaxDx) {
      setBraccioScelto("SX");
    } else {
      setBraccioScelto("DX");
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
    <AppDialog
      isOpen={isOpen}
      onClose={loading ? () => {} : onClose}
      labelledBy="bilateral-title"
      dismissible={!loading}
      variant="sheet"
      maxWidthClassName="max-w-lg"
    >
      {loading && <StethoscopeLoader overlay text="Avvio diario e salvataggio in corso..." />}
      <div className="p-5 sm:p-6 flex flex-col justify-between overflow-y-auto">
        <div className="flex items-center justify-between border-b border-surface-variant/40 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-full bg-primary text-on-primary text-xs font-bold flex items-center justify-center shrink-0">
              {step}/3
            </span>
            <h1 id="bilateral-title" className="text-xs sm:text-sm font-bold text-on-surface uppercase tracking-wider">
              {step === 1 && "Fase 1: Misurazione Braccio Destro"}
              {step === 2 && "Fase 2: Misurazione Braccio Sinistro"}
              {step === 3 && "Fase 3: Esito e Avvio Ciclo"}
            </h1>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Chiudi calibrazione iniziale"
            className="min-w-[40px] min-h-[40px] rounded-full flex items-center justify-center text-secondary hover:bg-surface-container hover:text-on-surface"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="p-3 my-3 rounded-xl bg-error-container text-on-error-container text-xs flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 text-error shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        {step === 1 && (
          <form onSubmit={handleNextToLeft} className="py-4 space-y-5">
            <div className="text-center space-y-1">
              <div className="w-16 h-16 rounded-2xl bg-primary-container/30 text-primary flex items-center justify-center mx-auto mb-2">
                <Hand className="w-8 h-8" aria-hidden="true" />
              </div>
              <h2 className="text-xl font-headline font-bold text-on-surface">Misura il Braccio Destro</h2>
              <p className="text-xs sm:text-sm text-on-surface-variant max-w-xs mx-auto">
                Posiziona il bracciale sul braccio destro ed effettua la prima misurazione.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="init-max-dx" className="text-xs font-bold text-on-surface block">
                  Pressione Massima (MAX) *
                </label>
                <div className="relative mt-1">
                  <input
                    id="init-max-dx"
                    name="maxDx"
                    type="text"
                    inputMode="numeric"
                    pattern="\d{2,3}"
                    enterKeyHint="next"
                    autoFocus
                    required
                    value={maxDx}
                    onChange={(e) => setMaxDx(e.target.value.replace(/\D/g, ""))}
                    placeholder="135"
                    className="w-full h-14 px-3 pr-11 text-xl font-mono font-bold bg-surface-container-low rounded-xl text-center border border-surface-variant/50 focus:outline-none placeholder:text-outline-variant/60 placeholder:font-normal"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-secondary font-semibold">
                    mmHg
                  </span>
                </div>
              </div>

              <div>
                <label htmlFor="init-min-dx" className="text-xs font-bold text-on-surface block">
                  Pressione Minima (MIN) *
                </label>
                <div className="relative mt-1">
                  <input
                    id="init-min-dx"
                    name="minDx"
                    type="text"
                    inputMode="numeric"
                    pattern="\d{2,3}"
                    enterKeyHint="next"
                    required
                    value={minDx}
                    onChange={(e) => setMinDx(e.target.value.replace(/\D/g, ""))}
                    placeholder="85"
                    className="w-full h-14 px-3 pr-11 text-xl font-mono font-bold bg-surface-container-low rounded-xl text-center border border-surface-variant/50 focus:outline-none placeholder:text-outline-variant/60 placeholder:font-normal"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-secondary font-semibold">
                    mmHg
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="init-bpm-dx" className="text-xs font-bold text-on-surface block">
                Battiti Cardiaci (BPM - Facoltativo)
              </label>
              <input
                id="init-bpm-dx"
                name="bpmDx"
                type="text"
                inputMode="numeric"
                pattern="\d{2,3}"
                enterKeyHint="next"
                value={bpmDx}
                onChange={(e) => setBpmDx(e.target.value.replace(/\D/g, ""))}
                placeholder="72"
                className="w-full min-h-[48px] px-3 mt-1 bg-surface-container-low rounded-xl text-center font-mono font-bold border border-surface-variant/50 focus:outline-none placeholder:text-outline-variant/60 placeholder:font-normal"
              />
            </div>

            <button
              type="submit"
              className="w-full min-h-[52px] rounded-xl bg-primary text-on-primary text-sm font-bold shadow-sm flex items-center justify-center gap-2 mt-4"
            >
              <span>Procedi al Braccio Sinistro</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleNextToResult} className="py-4 space-y-5">
            <div className="text-center space-y-1">
              <div className="w-16 h-16 rounded-2xl bg-secondary-container text-tertiary flex items-center justify-center mx-auto mb-2">
                <Hand className="w-8 h-8 -scale-x-100" aria-hidden="true" />
              </div>
              <h2 className="text-xl font-headline font-bold text-on-surface">Misura il Braccio Sinistro</h2>
              <p className="text-xs sm:text-sm text-on-surface-variant max-w-xs mx-auto">
                Sposta il bracciale sul braccio sinistro e ripeti la misurazione.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="init-max-sx" className="text-xs font-bold text-on-surface block">
                  Pressione Massima (MAX) *
                </label>
                <div className="relative mt-1">
                  <input
                    id="init-max-sx"
                    name="maxSx"
                    type="text"
                    inputMode="numeric"
                    pattern="\d{2,3}"
                    enterKeyHint="next"
                    autoFocus
                    required
                    value={maxSx}
                    onChange={(e) => setMaxSx(e.target.value.replace(/\D/g, ""))}
                    placeholder="128"
                    className="w-full h-14 px-3 pr-11 text-xl font-mono font-bold bg-surface-container-low rounded-xl text-center border border-surface-variant/50 focus:outline-none placeholder:text-outline-variant/60 placeholder:font-normal"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-secondary font-semibold">
                    mmHg
                  </span>
                </div>
              </div>

              <div>
                <label htmlFor="init-min-sx" className="text-xs font-bold text-on-surface block">
                  Pressione Minima (MIN) *
                </label>
                <div className="relative mt-1">
                  <input
                    id="init-min-sx"
                    name="minSx"
                    type="text"
                    inputMode="numeric"
                    pattern="\d{2,3}"
                    enterKeyHint="next"
                    required
                    value={minSx}
                    onChange={(e) => setMinSx(e.target.value.replace(/\D/g, ""))}
                    placeholder="82"
                    className="w-full h-14 px-3 pr-11 text-xl font-mono font-bold bg-surface-container-low rounded-xl text-center border border-surface-variant/50 focus:outline-none placeholder:text-outline-variant/60 placeholder:font-normal"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-secondary font-semibold">
                    mmHg
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="init-bpm-sx" className="text-xs font-bold text-on-surface block">
                Battiti Cardiaci (BPM - Facoltativo)
              </label>
              <input
                id="init-bpm-sx"
                name="bpmSx"
                type="text"
                inputMode="numeric"
                pattern="\d{2,3}"
                enterKeyHint="done"
                value={bpmSx}
                onChange={(e) => setBpmSx(e.target.value.replace(/\D/g, ""))}
                placeholder="70"
                className="w-full min-h-[48px] px-3 mt-1 bg-surface-container-low rounded-xl text-center font-mono font-bold border border-surface-variant/50 focus:outline-none placeholder:text-outline-variant/60 placeholder:font-normal"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="min-h-[48px] px-4 rounded-xl bg-surface-container text-xs font-bold text-on-surface"
              >
                Torna a DX
              </button>
              <button
                type="submit"
                className="flex-1 min-h-[48px] rounded-xl bg-primary text-on-primary text-sm font-bold shadow-sm flex items-center justify-center gap-2"
              >
                <span>Confronta Valori</span>
                <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </form>
        )}

        {step === 3 && (
          <div className="py-4 space-y-5">
            <div className="p-4 rounded-2xl bg-surface-container-low border border-surface-variant/40 space-y-3">
              <span className="text-xs font-bold text-secondary uppercase tracking-wider block text-center">
                Esito del Confronto
              </span>

              <div className="grid grid-cols-2 gap-3 text-center">
                <div
                  className={`p-3 rounded-xl border ${
                    braccioScelto === "DX"
                      ? "bg-primary-container/30 border-primary"
                      : "bg-surface-container-lowest border-surface-variant/40"
                  }`}
                >
                  <span className="text-xs font-bold text-secondary block">Braccio Destro</span>
                  <span className="text-xl font-bold font-mono text-on-surface">
                    {maxDx} / {minDx}
                  </span>
                </div>
                <div
                  className={`p-3 rounded-xl border ${
                    braccioScelto === "SX"
                      ? "bg-primary-container/30 border-primary"
                      : "bg-surface-container-lowest border-surface-variant/40"
                  }`}
                >
                  <span className="text-xs font-bold text-secondary block">Braccio Sinistro</span>
                  <span className="text-xl font-bold font-mono text-on-surface">
                    {maxSx} / {minSx}
                  </span>
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
                      aria-pressed={braccioScelto === "DX"}
                      className={`min-h-[40px] py-2 rounded-lg text-xs font-bold transition-colors ${
                        braccioScelto === "DX"
                          ? "bg-primary text-on-primary"
                          : "bg-surface-container-lowest text-on-surface"
                      }`}
                    >
                      Braccio Destro
                    </button>
                    <button
                      type="button"
                      onClick={() => setBraccioScelto("SX")}
                      aria-pressed={braccioScelto === "SX"}
                      className={`min-h-[40px] py-2 rounded-lg text-xs font-bold transition-colors ${
                        braccioScelto === "SX"
                          ? "bg-primary text-on-primary"
                          : "bg-surface-container-lowest text-on-surface"
                      }`}
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
                  </strong>
                  . Questo sarà il tuo braccio di riferimento per tutte le prossime misurazioni.
                </p>
              )}
            </div>

            <fieldset className="space-y-2">
              <legend className="text-xs font-bold text-on-surface uppercase tracking-wider block">
                A quale momento della giornata vuoi assegnare questa prima misurazione? *
              </legend>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "mattina" as const, label: "Mattina", Icon: Sun },
                  { id: "pomeriggio" as const, label: "Pomeriggio", Icon: SunMedium },
                  { id: "sera" as const, label: "Sera", Icon: Moon },
                ].map((s) => {
                  const Icon = s.Icon;
                  const active = slotAssegnato === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setSlotAssegnato(s.id)}
                      className={`min-h-[64px] py-3 px-2 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 transition-colors border ${
                        active
                          ? "bg-primary text-on-primary border-primary shadow-sm"
                          : "bg-surface-container-low text-on-surface border-surface-variant/40 hover:bg-surface-container"
                      }`}
                    >
                      <Icon className="w-4 h-4" aria-hidden="true" />
                      <span>{s.label}</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <button
              type="button"
              disabled={loading || !braccioScelto}
              onClick={handleConfirm}
              className="w-full min-h-[52px] py-3 rounded-xl bg-primary text-on-primary text-sm font-bold shadow-sm flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
            >
              <span>{loading ? "Avvio ciclo in corso..." : "Salva e Inizia il Diario"}</span>
              <Check className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </AppDialog>
  );
}
