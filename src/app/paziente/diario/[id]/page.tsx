"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";
import { getPazienteDettaglioClinico } from "@/db/actions";
import { NuovaMisurazioneModal } from "@/components/modals/NuovaMisurazioneModal";
import { OnboardingModal } from "@/components/modals/OnboardingModal";
import { ConclusioneCicloModal } from "@/components/modals/ConclusioneCicloModal";
import { NoteTerapiaModal } from "@/components/modals/NoteTerapiaModal";
import { NotificheModal } from "@/components/modals/NotificheModal";
import { classifyBloodPressure } from "@/lib/guidelines";

export default function PazienteDiarioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const cicloId = resolvedParams.id;
  const router = useRouter();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Active selected day in the horizontal calendar (default to Day 11)
  const [selectedDay, setSelectedDay] = useState<number>(11);

  // Modals
  const [measurementModalOpen, setMeasurementModalOpen] = useState(false);
  const [selectedSlotForModal, setSelectedSlotForModal] = useState<"mattina" | "pomeriggio" | "sera">("sera");
  const [existingMisurazioneToEdit, setExistingMisurazioneToEdit] = useState<any>(null);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isConclusioneOpen, setIsConclusioneOpen] = useState(false);
  const [isNoteOpen, setIsNoteOpen] = useState(false);
  const [isNotificheOpen, setIsNotificheOpen] = useState(false);

  const loadData = async () => {
    try {
      const stored = localStorage.getItem("paziente_user");
      const pId = stored ? JSON.parse(stored).id : "paz-1";
      const res = await getPazienteDettaglioClinico(pId);
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [cicloId]);

  useEffect(() => {
    if (!loading) {
      setTimeout(() => {
        const el = document.getElementById(`day-btn-${selectedDay}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
        }
      }, 100);
    }
  }, [selectedDay, loading]);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const { activeCiclo, paziente, misurazioni, noteTerapia } = data;
  const totalDays = (activeCiclo?.durataSettimane || 2) * 7;
  const currentActiveDay = 11; // 11 of 14 for Giuseppe Bianchi
  const braccioRef = (activeCiclo?.braccioRiferimento || "DX") as "DX" | "SX";

  // Filter measurements for the currently selected day
  const dayMisurazioni = misurazioni.filter((m: any) => m.giornoNumero === selectedDay);
  const misMattina = dayMisurazioni.find((m: any) => m.slot === "mattina");
  const misPomeriggio = dayMisurazioni.find((m: any) => m.slot === "pomeriggio");
  const misSera = dayMisurazioni.find((m: any) => m.slot === "sera");

  // Calculate actual date for the selected day
  const startDate = activeCiclo?.dataInizioEffettiva ? new Date(activeCiclo.dataInizioEffettiva) : new Date();
  const selectedDate = new Date(startDate);
  selectedDate.setDate(startDate.getDate() + (selectedDay - 1));
  const selectedDateStr = selectedDate.toISOString().split("T")[0];

  const handleOpenSlot = (slot: "mattina" | "pomeriggio" | "sera", existing?: any) => {
    if (selectedDay > currentActiveDay) {
      alert("Non puoi inserire misurazioni per giornate future.");
      return;
    }
    setSelectedSlotForModal(slot);
    setExistingMisurazioneToEdit(existing || null);
    setMeasurementModalOpen(true);
  };

  const handleMeasurementSuccess = () => {
    loadData();
    if (selectedDay === totalDays && selectedSlotForModal === "sera") {
      setIsConclusioneOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col pt-safe pb-safe">
      {/* Fixed Appbar Header */}
      <header className="fixed top-0 inset-x-0 z-40 bg-surface/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(46,50,48,0.04)] border-b border-surface-variant/30">
        <div className="max-w-md mx-auto h-16 px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/paziente/cicli"
              className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-on-surface hover:bg-surface-container-high transition-colors"
            >
              <span className="material-symbols-outlined text-lg">arrow_back</span>
            </Link>
            <div className="flex flex-col">
              <span className="font-headline font-bold text-base leading-tight text-primary">
                CardioDiario
              </span>
              <span className="text-[11px] text-on-surface-variant">
                {paziente.nome} {paziente.cognome}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsNotificheOpen(true)}
              aria-label="Notifiche"
              className="relative w-10 h-10 flex items-center justify-center rounded-full text-on-surface hover:bg-surface-container active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[22px]">notifications</span>
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-error ring-2 ring-surface"></span>
            </button>

            <button
              onClick={() => setIsNoteOpen(true)}
              aria-label="Note Medico"
              className="w-10 h-10 flex items-center justify-center rounded-full text-on-surface hover:bg-surface-container active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[22px]">prescriptions</span>
            </button>

            <button
              onClick={() => window.print()}
              title="Stampa Diario PDF"
              className="w-10 h-10 flex items-center justify-center rounded-full text-secondary hover:text-primary hover:bg-surface-container active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[22px]">print</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Screen */}
      <main className="flex-1 w-full max-w-md mx-auto pt-20 px-4 pb-16 space-y-5">
        {/* Info Bar: Official Reference Arm & Cycle Progress */}
        <section className="bg-surface-container-low rounded-2xl p-4 shadow-sm space-y-3 border border-surface-variant/40">
          <div className="flex items-center justify-between">
            {/* Badge Braccio Ufficiale */}
            <div className="flex items-center gap-2 bg-primary-container/35 px-3 py-1.5 rounded-full border border-primary/20">
              <span className="material-symbols-outlined text-primary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                pan_tool
              </span>
              <span className="text-xs font-bold text-on-surface tracking-wide uppercase">
                Braccio: <strong className="text-primary font-extrabold">{braccioRef === "DX" ? "DESTRO (DX)" : "SINISTRO (SX)"}</strong>
              </span>
            </div>

            {/* Guida Rapida */}
            <button
              type="button"
              onClick={() => setIsOnboardingOpen(true)}
              className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 py-1 px-2.5 rounded-lg active:bg-surface-container transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">help_outline</span>
              <span>Guida</span>
            </button>
          </div>

          <div className="flex items-center justify-between text-xs text-on-surface-variant font-medium pt-1">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-tertiary">calendar_today</span>
              <span>
                Settimana 2 di 2 • <strong className="text-on-surface font-semibold">Giorno {selectedDay} di {totalDays}</strong>
              </span>
            </div>
            <span className="text-[11px] bg-secondary-container px-2 py-0.5 rounded text-on-secondary-container font-semibold">
              {Math.round((selectedDay / totalDays) * 100)}% Ciclo
            </span>
          </div>

          {/* Smooth Progress Bar */}
          <div className="w-full bg-surface-variant h-2 rounded-full overflow-hidden">
            <div
              className="bg-primary h-full rounded-full transition-all duration-500"
              style={{ width: `${(selectedDay / totalDays) * 100}%` }}
            ></div>
          </div>
        </section>

        {/* Horizontal Scrollable Days Calendar */}
        <section className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h2 className="font-headline font-bold text-base text-on-surface">
              Calendario del Diario
            </h2>
            <span className="text-xs font-semibold text-secondary capitalize">
              {selectedDate.toLocaleDateString("it-IT", { month: "long", year: "numeric" })}
            </span>
          </div>

          {/* Scrollable Days Strip */}
          <div
            className="flex items-center gap-2.5 overflow-x-auto py-3 -mx-4 px-4 scrollbar-none"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            {Array.from({ length: totalDays }, (_, i) => i + 1).map((dayNum) => {
              const isSelected = dayNum === selectedDay;
              const isToday = dayNum === currentActiveDay;
              const isFuture = dayNum > currentActiveDay;

              // Compute date for this day
              const d = new Date(startDate);
              d.setDate(startDate.getDate() + (dayNum - 1));
              const dayOfWeek = d.toLocaleDateString("it-IT", { weekday: "short" });
              const dayOfMonth = d.getDate();

              // Get status of measurements on this day
              const dMis = misurazioni.filter((m: any) => m.giornoNumero === dayNum);
              const mMat = dMis.find((m: any) => m.slot === "mattina");
              const mPom = dMis.find((m: any) => m.slot === "pomeriggio");
              const mSer = dMis.find((m: any) => m.slot === "sera");

              const getDotColor = (m?: any) => {
                if (!m) return isSelected ? "bg-white/40" : (isFuture ? "bg-surface-variant" : "bg-outline/30");
                if (m.pressioneMax >= 140 || m.pressioneMin >= 90) return isSelected ? "bg-red-200" : "bg-error";
                if (m.pressioneMax >= 130 || m.pressioneMin >= 85) return isSelected ? "bg-amber-200" : "bg-tertiary-fixed";
                return isSelected ? "bg-white" : "bg-primary";
              };

              return (
                <button
                  key={dayNum}
                  id={`day-btn-${dayNum}`}
                  type="button"
                  onClick={() => setSelectedDay(dayNum)}
                  className={`flex-shrink-0 flex flex-col items-center justify-between rounded-2xl transition-all duration-200 relative ${
                    isSelected
                      ? "w-16 py-3 bg-primary text-white shadow-lg shadow-primary/30 ring-2 ring-primary ring-offset-2 ring-offset-background scale-105 z-10 font-bold border-2 border-primary"
                      : isToday
                      ? "w-14 py-2.5 bg-primary-container/30 border-2 border-primary text-primary font-bold shadow-sm hover:bg-primary-container/45"
                      : isFuture
                      ? "w-14 py-2.5 bg-surface-container-highest/40 text-on-surface-variant/40 opacity-50 cursor-not-allowed border border-transparent"
                      : "w-14 py-2.5 bg-surface-container-low text-on-surface hover:bg-surface-container border border-surface-variant/40"
                  }`}
                >
                  <span className={`text-[10px] uppercase font-bold tracking-tight ${
                    isSelected
                      ? "text-white"
                      : isToday
                      ? "text-primary font-extrabold"
                      : "text-secondary"
                  }`}>
                    {isToday ? "Oggi" : `${dayOfWeek} ${dayOfMonth}`}
                  </span>
                  <span className={`font-headline font-extrabold my-0.5 ${
                    isSelected ? "text-white text-lg" : isToday ? "text-primary text-base" : "text-on-surface text-base"
                  }`}>
                    G{dayNum}
                  </span>
                  {/* 3 Status dots: Mattina, Pomeriggio, Sera */}
                  <div className="flex items-center gap-1 pt-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${getDotColor(mMat)}`}></span>
                    <span className={`w-1.5 h-1.5 rounded-full ${getDotColor(mPom)}`}></span>
                    <span className={`w-1.5 h-1.5 rounded-full ${getDotColor(mSer)}`}></span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* 3 Daily Slot Cards */}
        <section className="space-y-4 pt-1">
          {/* Card 1: MATTINA */}
          <div
            onClick={() => handleOpenSlot("mattina", misMattina)}
            className={`p-5 rounded-3xl border transition-all cursor-pointer shadow-sm ${
              misMattina
                ? "bg-surface-container-lowest border-surface-variant/60 hover:border-primary/50"
                : "bg-surface-container-lowest border-dashed border-surface-variant hover:border-primary/50"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-primary-container/30 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl">wb_sunny</span>
                </div>
                <div>
                  <span className="text-xs font-bold text-on-surface block">
                    Misurazione Mattina
                  </span>
                  <span className="text-[11px] text-secondary">Cutoff promemoria: ore 11:00</span>
                </div>
              </div>

              {misMattina ? (
                <span className="material-symbols-outlined text-outline text-lg">edit</span>
              ) : (
                <span className="px-3 py-1.5 rounded-xl bg-primary text-on-primary text-xs font-bold flex items-center gap-1 shadow-sm">
                  <span className="material-symbols-outlined text-sm">add</span>
                  Inserisci
                </span>
              )}
            </div>

            {misMattina && (
              <div className="mt-4 pt-3 border-t border-surface-variant/30 flex items-center justify-between">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-headline font-bold text-on-surface">
                    {misMattina.pressioneMax} / {misMattina.pressioneMin}
                  </span>
                  <span className="text-xs text-secondary font-semibold">mmHg</span>
                  {misMattina.bpm && (
                    <span className="text-xs text-secondary ml-3">
                      ❤️ {misMattina.bpm} bpm
                    </span>
                  )}
                </div>

                {(() => {
                  const cat = classifyBloodPressure(misMattina.pressioneMax, misMattina.pressioneMin);
                  return (
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${cat.badgeClass}`}>
                      {cat.category}
                    </span>
                  );
                })()}
              </div>
            )}
          </div>

          {/* Card 2: POMERIGGIO */}
          <div
            onClick={() => handleOpenSlot("pomeriggio", misPomeriggio)}
            className={`p-5 rounded-3xl border transition-all cursor-pointer shadow-sm ${
              misPomeriggio
                ? "bg-surface-container-lowest border-surface-variant/60 hover:border-primary/50"
                : "bg-surface-container-lowest border-dashed border-surface-variant hover:border-primary/50"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-secondary-container text-tertiary flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl">light_mode</span>
                </div>
                <div>
                  <span className="text-xs font-bold text-on-surface block">
                    Misurazione Pomeriggio
                  </span>
                  <span className="text-[11px] text-secondary">Cutoff promemoria: ore 16:00</span>
                </div>
              </div>

              {misPomeriggio ? (
                <span className="material-symbols-outlined text-outline text-lg">edit</span>
              ) : (
                <span className="px-3 py-1.5 rounded-xl bg-primary text-on-primary text-xs font-bold flex items-center gap-1 shadow-sm">
                  <span className="material-symbols-outlined text-sm">add</span>
                  Inserisci
                </span>
              )}
            </div>

            {misPomeriggio && (
              <div className="mt-4 pt-3 border-t border-surface-variant/30 flex items-center justify-between">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-headline font-bold text-on-surface">
                    {misPomeriggio.pressioneMax} / {misPomeriggio.pressioneMin}
                  </span>
                  <span className="text-xs text-secondary font-semibold">mmHg</span>
                  {misPomeriggio.bpm && (
                    <span className="text-xs text-secondary ml-3">
                      ❤️ {misPomeriggio.bpm} bpm
                    </span>
                  )}
                </div>

                {(() => {
                  const cat = classifyBloodPressure(misPomeriggio.pressioneMax, misPomeriggio.pressioneMin);
                  return (
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${cat.badgeClass}`}>
                      {cat.category}
                    </span>
                  );
                })()}
              </div>
            )}
          </div>

          {/* Card 3: SERA */}
          <div
            onClick={() => handleOpenSlot("sera", misSera)}
            className={`p-5 rounded-3xl border transition-all cursor-pointer shadow-sm ${
              misSera
                ? "bg-surface-container-lowest border-surface-variant/60 hover:border-primary/50"
                : "bg-surface-container-lowest border-dashed border-surface-variant hover:border-primary/50"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-surface-container text-secondary flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl">bedtime</span>
                </div>
                <div>
                  <span className="text-xs font-bold text-on-surface block">
                    Misurazione Sera
                  </span>
                  <span className="text-[11px] text-secondary">Cutoff promemoria: ore 22:00</span>
                </div>
              </div>

              {misSera ? (
                <span className="material-symbols-outlined text-outline text-lg">edit</span>
              ) : (
                <span className="px-3 py-1.5 rounded-xl bg-primary text-on-primary text-xs font-bold flex items-center gap-1 shadow-sm">
                  <span className="material-symbols-outlined text-sm">add</span>
                  Inserisci
                </span>
              )}
            </div>

            {misSera && (
              <div className="mt-4 pt-3 border-t border-surface-variant/30 flex items-center justify-between">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-headline font-bold text-on-surface">
                    {misSera.pressioneMax} / {misSera.pressioneMin}
                  </span>
                  <span className="text-xs text-secondary font-semibold">mmHg</span>
                  {misSera.bpm && (
                    <span className="text-xs text-secondary ml-3">
                      ❤️ {misSera.bpm} bpm
                    </span>
                  )}
                </div>

                {(() => {
                  const cat = classifyBloodPressure(misSera.pressioneMax, misSera.pressioneMin);
                  return (
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${cat.badgeClass}`}>
                      {cat.category}
                    </span>
                  );
                })()}
              </div>
            )}
          </div>
        </section>

        {/* Therapy Advice Prompt Banner */}
        {noteTerapia && noteTerapia.length > 0 && (
          <div
            onClick={() => setIsNoteOpen(true)}
            className="p-4 rounded-2xl bg-secondary-container/40 border border-secondary/20 flex items-center justify-between cursor-pointer hover:bg-secondary-container/60 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-tertiary text-xl">clinical_notes</span>
              <div>
                <span className="text-xs font-bold text-on-surface block">
                  Indicazioni del Medico
                </span>
                <span className="text-[11px] text-on-surface-variant truncate max-w-[240px] block">
                  {noteTerapia[0].testo}
                </span>
              </div>
            </div>
            <span className="material-symbols-outlined text-outline text-base">chevron_right</span>
          </div>
        )}
      </main>

      {/* Modals */}
      <NuovaMisurazioneModal
        isOpen={measurementModalOpen}
        onClose={() => setMeasurementModalOpen(false)}
        onSuccess={handleMeasurementSuccess}
        cicloId={activeCiclo.id}
        pazienteId={paziente.id}
        giornoNumero={selectedDay}
        defaultSlot={selectedSlotForModal}
        defaultDate={selectedDateStr}
        braccioRiferimento={braccioRef}
        existingMisurazione={existingMisurazioneToEdit}
      />

      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onStartCalibration={() => {
          setIsOnboardingOpen(false);
        }}
      />

      <ConclusioneCicloModal
        isOpen={isConclusioneOpen}
        onClose={() => setIsConclusioneOpen(false)}
        onDownloadPdf={() => window.print()}
        pazienteNome={paziente.nome}
      />

      <NoteTerapiaModal
        isOpen={isNoteOpen}
        onClose={() => setIsNoteOpen(false)}
        note={noteTerapia || []}
      />

      <NotificheModal
        isOpen={isNotificheOpen}
        onClose={() => setIsNotificheOpen(false)}
        pazienteId={paziente.id}
      />
    </div>
  );
}
