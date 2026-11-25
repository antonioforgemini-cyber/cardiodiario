"use client";

import React, { useCallback, useEffect, useRef, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bell,
  BellOff,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Hand,
  Heart,
  HelpCircle,
  Moon,
  Pencil,
  Plus,
  Printer,
  Settings,
  Sun,
  SunMedium,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { StethoscopeLoader } from "@/components/StethoscopeLoader";
import {
  getPazienteDettaglioClinico,
  getComunicazioniPaziente,
  getUtenteCorrente,
} from "@/db/actions";
import { NuovaMisurazioneModal } from "@/components/modals/NuovaMisurazioneModal";
import { OnboardingModal } from "@/components/modals/OnboardingModal";
import { ConclusioneCicloModal } from "@/components/modals/ConclusioneCicloModal";
import { NoteTerapiaModal } from "@/components/modals/NoteTerapiaModal";
import { NotificheModal } from "@/components/modals/NotificheModal";
import { GestioneBiometriaModal } from "@/components/modals/GestioneBiometriaModal";
import { ImpostazioniAppModal } from "@/components/modals/ImpostazioniAppModal";
import { ReportClinicoModal } from "@/components/modals/ReportClinicoModal";
import { DisclaimerPazienteModal } from "@/components/modals/DisclaimerPazienteModal";
import { useToast } from "@/components/ui/ToastProvider";
import { classifyBloodPressure } from "@/lib/guidelines";
import {
  calculateCurrentActiveDay,
  getDateForCycleDay,
  formatLocalDate,
} from "@/lib/dateUtils";

export default function PazienteDiarioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const cicloId = resolvedParams.id;
  const router = useRouter();
  const { showToast } = useToast();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [futureNotice, setFutureNotice] = useState<string | null>(null);

  const [measurementModalOpen, setMeasurementModalOpen] = useState(false);
  const [selectedSlotForModal, setSelectedSlotForModal] = useState<"mattina" | "pomeriggio" | "sera">("sera");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [existingMisurazioneToEdit, setExistingMisurazioneToEdit] = useState<any>(null);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isConclusioneOpen, setIsConclusioneOpen] = useState(false);
  const [isNoteOpen, setIsNoteOpen] = useState(false);
  const [isNotificheOpen, setIsNotificheOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isBioOpen, setIsBioOpen] = useState(false);
  const [isNotificationsMuted, setIsNotificationsMuted] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollCalendar = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === "left" ? -280 : 280;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  const loadData = useCallback(async () => {
    try {
      const u = await getUtenteCorrente();
      if (!u || u.role !== "paziente") {
        router.push("/login/paziente");
        return;
      }
      const pId = u.id;
      const [res, comms, pushInfo] = await Promise.all([
        getPazienteDettaglioClinico(pId, cicloId),
        getComunicazioniPaziente(pId),
        fetch("/api/push/subscribe", { cache: "no-store" })
          .then((r) => (r.ok ? (r.json() as Promise<{ mute?: { isMuted?: boolean } }>) : null))
          .catch(() => null),
      ]);
      setData(res);
      if (res?.activeCiclo) {
        const total = (res.activeCiclo.durataSettimane || 1) * 7;
        const maxMis =
          res.misurazioni && res.misurazioni.length > 0
            ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
              Math.max(...res.misurazioni.map((m: any) => m.giornoNumero || 1))
            : 1;
        const activeDay = calculateCurrentActiveDay(
          res.activeCiclo.dataInizioEffettiva,
          total,
          maxMis
        );
        setSelectedDay(activeDay);
      }
      setUnreadCount(comms.filter((c) => !c.letta).length);
      if (pushInfo?.mute) {
        setIsNotificationsMuted(Boolean(pushInfo.mute.isMuted));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [cicloId, router]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

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
        <StethoscopeLoader text="Caricamento diario..." />
      </div>
    );
  }

  const { activeCiclo, paziente, misurazioni, noteTerapia, averages, medicoNomeCompleto } = data;
  const totalDays = (activeCiclo?.durataSettimane || 2) * 7;
  const maxDayRecorded =
    misurazioni && misurazioni.length > 0
      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Math.max(...misurazioni.map((m: any) => m.giornoNumero || 1))
      : 1;
  const currentActiveDay = calculateCurrentActiveDay(
    activeCiclo?.dataInizioEffettiva,
    totalDays,
    maxDayRecorded
  );
  const braccioRef = (activeCiclo?.braccioRiferimento || "DX") as "DX" | "SX";
  const currentWeek = Math.ceil(selectedDay / 7);
  const totalWeeks = Math.ceil(totalDays / 7);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dayMisurazioni = misurazioni.filter((m: any) => m.giornoNumero === selectedDay);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const misMattina = dayMisurazioni.find((m: any) => m.slot === "mattina");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const misPomeriggio = dayMisurazioni.find((m: any) => m.slot === "pomeriggio");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const misSera = dayMisurazioni.find((m: any) => m.slot === "sera");

  const selectedDate = getDateForCycleDay(activeCiclo?.dataInizioEffettiva, selectedDay);
  const selectedDateStr = formatLocalDate(selectedDate);
  const cyclePercent = Math.round((selectedDay / totalDays) * 100);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleOpenSlot = (slot: "mattina" | "pomeriggio" | "sera", existing?: any) => {
    if (selectedDay > currentActiveDay) {
      const msg = `Il Giorno ${selectedDay} è futuro rispetto a oggi (Giorno ${currentActiveDay}). Non è possibile registrare misurazioni anticipate.`;
      setFutureNotice(msg);
      showToast(msg, "info");
      return;
    }
    setFutureNotice(null);
    setSelectedSlotForModal(slot);
    setExistingMisurazioneToEdit(existing || null);
    setMeasurementModalOpen(true);
  };

  const handleMeasurementSuccess = () => {
    void loadData();
    if (selectedDay === totalDays && selectedSlotForModal === "sera") {
      setIsConclusioneOpen(true);
    }
  };

  const slots = [
    {
      id: "mattina" as const,
      title: "Misurazione Mattina",
      cutoff: "Promemoria ore 11:00",
      Icon: Sun,
      iconBg: "bg-primary-container/30 text-primary",
      mis: misMattina,
    },
    {
      id: "pomeriggio" as const,
      title: "Misurazione Pomeriggio",
      cutoff: "Promemoria ore 16:00",
      Icon: SunMedium,
      iconBg: "bg-secondary-container text-tertiary",
      mis: misPomeriggio,
    },
    {
      id: "sera" as const,
      title: "Misurazione Sera",
      cutoff: "Promemoria ore 22:00",
      Icon: Moon,
      iconBg: "bg-surface-container text-secondary",
      mis: misSera,
    },
  ];

  return (
    <div className="min-h-screen bg-surface flex flex-col pt-safe pb-safe">
      <header className="fixed top-0 inset-x-0 z-40 bg-surface/90 backdrop-blur-xl shadow-xs border-b border-surface-variant/30">
        <div className="max-w-md mx-auto min-h-[64px] px-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <Link
              href="/paziente/cicli"
              aria-label="Torna all'elenco dei cicli"
              className="min-w-[44px] min-h-[44px] rounded-full bg-surface-container flex items-center justify-center text-on-surface hover:bg-surface-container-high transition-colors shrink-0"
            >
              <ArrowLeft className="w-5 h-5" aria-hidden="true" />
            </Link>
            <div className="flex items-center gap-2 min-w-0">
              <Logo size={32} showText={false} />
              <div className="flex flex-col min-w-0">
                <span className="font-headline font-bold text-base leading-tight text-primary">
                  CardioDiario
                </span>
                <span className="text-[11px] text-on-surface-variant truncate">
                  {paziente.nome} {paziente.cognome}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-0.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              aria-label="Impostazioni dell'app (Notifiche, Suoneria e Biometria)"
              className="min-w-[40px] min-h-[44px] flex items-center justify-center rounded-full text-on-surface hover:bg-surface-container transition-colors"
            >
              <Settings className="w-5 h-5" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={() => setIsNotificheOpen(true)}
              aria-label={
                isNotificationsMuted
                  ? unreadCount > 0
                    ? `Centro Notifiche (${unreadCount} nuove, notifiche silenziate)`
                    : "Centro Notifiche (Notifiche silenziate)"
                  : unreadCount > 0
                  ? `Centro Notifiche (${unreadCount} nuove)`
                  : "Centro Notifiche"
              }
              className="relative min-w-[40px] min-h-[44px] flex items-center justify-center rounded-full text-on-surface hover:bg-surface-container transition-colors"
            >
              {isNotificationsMuted ? (
                <BellOff className="w-5 h-5 text-tertiary" aria-hidden="true" />
              ) : (
                <Bell className="w-5 h-5" aria-hidden="true" />
              )}
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-error text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-surface">
                  {unreadCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsNoteOpen(true)}
              aria-label="Note di Terapia e Prescrizioni del Medico"
              className="min-w-[40px] min-h-[44px] flex items-center justify-center rounded-full text-on-surface hover:bg-surface-container transition-colors"
            >
              <ClipboardList className="w-5 h-5" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={() => setIsReportOpen(true)}
              aria-label="Stampa o salva il diario in formato PDF"
              className="min-w-[40px] min-h-[44px] flex items-center justify-center rounded-full text-secondary hover:text-primary hover:bg-surface-container transition-colors"
            >
              <Printer className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      <main id="main-content" tabIndex={-1} className="flex-1 w-full max-w-md mx-auto pt-20 px-4 pb-16 space-y-5">
        <section
          aria-label="Riepilogo ciclo attivo"
          className="bg-surface-container-low rounded-2xl p-4 shadow-terra space-y-3 border border-surface-variant/40"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 bg-primary-container/35 px-3 py-1.5 rounded-full border border-primary/20">
              <Hand className="w-4 h-4 text-primary" aria-hidden="true" />
              <span className="text-xs font-bold text-on-surface tracking-wide uppercase">
                Braccio:{" "}
                <strong className="text-primary font-extrabold">
                  {braccioRef === "DX" ? "DESTRO (DX)" : "SINISTRO (SX)"}
                </strong>
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsOnboardingOpen(true)}
              className="min-h-[38px] flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 py-1 px-2.5 rounded-lg hover:bg-surface-container transition-colors"
            >
              <HelpCircle className="w-4 h-4" aria-hidden="true" />
              <span>Guida</span>
            </button>
          </div>

          <div className="flex items-center justify-between text-xs text-on-surface-variant font-medium pt-1">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-tertiary" aria-hidden="true" />
              <span>
                Settimana {currentWeek} di {totalWeeks} •{" "}
                <strong className="text-on-surface font-semibold">
                  Giorno {selectedDay} di {totalDays}
                </strong>
              </span>
            </div>
            <span className="text-[11px] bg-secondary-container px-2 py-0.5 rounded text-on-secondary-container font-semibold">
              {cyclePercent}% Ciclo
            </span>
          </div>

          <div
            role="progressbar"
            aria-label={`Avanzamento al giorno ${selectedDay} su ${totalDays}`}
            aria-valuenow={cyclePercent}
            aria-valuemin={0}
            aria-valuemax={100}
            className="w-full bg-surface-variant h-2 rounded-full overflow-hidden"
          >
            <div
              className="bg-primary h-full rounded-full transition-all duration-500"
              style={{ width: `${cyclePercent}%` }}
            />
          </div>
        </section>

        <section className="space-y-3" aria-labelledby="calendar-heading">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 id="calendar-heading" className="font-headline font-bold text-lg text-on-surface">
                Calendario del Diario
              </h1>
              <span className="text-xs font-semibold text-secondary capitalize">
                • {selectedDate.toLocaleDateString("it-IT", { month: "long", year: "numeric" })}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => scrollCalendar("left")}
                aria-label="Scorri ai giorni precedenti"
                className="min-w-[38px] min-h-[38px] rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface flex items-center justify-center shadow-sm transition-colors"
              >
                <ChevronLeft className="w-4 h-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => scrollCalendar("right")}
                aria-label="Scorri ai giorni successivi"
                className="min-w-[38px] min-h-[38px] rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface flex items-center justify-center shadow-sm transition-colors"
              >
                <ChevronRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 px-1">
            {Array.from({ length: totalWeeks }, (_, wIdx) => {
              const wNum = wIdx + 1;
              const isWeekActive = currentWeek === wNum;
              const startDayOfW = (wNum - 1) * 7 + 1;
              const endDayOfW = Math.min(wNum * 7, totalDays);
              return (
                <button
                  key={wNum}
                  type="button"
                  aria-pressed={isWeekActive}
                  onClick={() => {
                    setFutureNotice(null);
                    setSelectedDay(startDayOfW);
                  }}
                  className={`flex-1 min-h-[40px] py-2 px-1.5 rounded-xl text-xs font-bold transition-colors flex items-center justify-center text-center leading-snug ${
                    isWeekActive
                      ? "bg-primary text-white shadow-sm ring-1 ring-primary"
                      : "bg-surface-container-low text-secondary hover:bg-surface-container hover:text-on-surface border border-surface-variant/40"
                  }`}
                >
                  <span>
                    Settimana {wNum} (G{startDayOfW}–G{endDayOfW})
                  </span>
                </button>
              );
            })}
          </div>

          <div
            ref={scrollContainerRef}
            className="flex items-center gap-2.5 overflow-x-auto py-3 -mx-4 px-4 scroll-smooth"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            {Array.from({ length: totalDays }, (_, i) => i + 1).map((dayNum) => {
              const isSelected = dayNum === selectedDay;
              const isToday = dayNum === currentActiveDay;
              const isFuture = dayNum > currentActiveDay;

              const d = getDateForCycleDay(activeCiclo?.dataInizioEffettiva, dayNum);
              const dayOfWeek = d.toLocaleDateString("it-IT", { weekday: "short" });
              const dayOfMonth = d.getDate();

              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const dMis = misurazioni.filter((m: any) => m.giornoNumero === dayNum);
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const mMat = dMis.find((m: any) => m.slot === "mattina");
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const mPom = dMis.find((m: any) => m.slot === "pomeriggio");
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const mSer = dMis.find((m: any) => m.slot === "sera");

              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const getDotColor = (m?: any) => {
                if (!m) return isSelected ? "bg-white/40" : isFuture ? "bg-surface-variant" : "bg-outline/30";
                if (m.pressioneMax >= 140 || m.pressioneMin >= 90) return isSelected ? "bg-red-200" : "bg-error";
                if (m.pressioneMax >= 130 || m.pressioneMin >= 85) return isSelected ? "bg-amber-200" : "bg-tertiary-fixed";
                return isSelected ? "bg-white" : "bg-primary";
              };

              return (
                <button
                  key={dayNum}
                  id={`day-btn-${dayNum}`}
                  type="button"
                  aria-current={isSelected ? "date" : undefined}
                  aria-label={`Giorno ${dayNum}, ${dayOfWeek} ${dayOfMonth}${isToday ? ", oggi" : ""}${isFuture ? ", data futura" : ""}, ${dMis.length} di 3 misurazioni`}
                  onClick={() => {
                    setFutureNotice(null);
                    setSelectedDay(dayNum);
                  }}
                  className={`shrink-0 flex flex-col items-center justify-between rounded-2xl transition-all duration-200 relative ${
                    isSelected
                      ? "w-16 py-3 bg-primary text-white shadow-lg shadow-primary/30 ring-2 ring-primary ring-offset-2 ring-offset-background scale-105 z-10 font-bold border-2 border-primary"
                      : isToday
                      ? "w-14 py-2.5 bg-primary-container/30 border-2 border-primary text-primary font-bold shadow-sm hover:bg-primary-container/45"
                      : isFuture
                      ? "w-14 py-2.5 bg-surface-container-highest/40 text-on-surface-variant/50 border border-transparent"
                      : "w-14 py-2.5 bg-surface-container-low text-on-surface hover:bg-surface-container border border-surface-variant/40"
                  }`}
                >
                  <span
                    className={`text-[10px] uppercase font-bold tracking-tight ${
                      isSelected ? "text-white" : isToday ? "text-primary font-extrabold" : "text-secondary"
                    }`}
                  >
                    {isToday ? "Oggi" : `${dayOfWeek} ${dayOfMonth}`}
                  </span>
                  <span
                    className={`font-headline font-extrabold my-0.5 ${
                      isSelected ? "text-white text-lg" : isToday ? "text-primary text-base" : "text-on-surface text-base"
                    }`}
                  >
                    G{dayNum}
                  </span>
                  <div className="flex items-center gap-1 pt-1" aria-hidden="true">
                    <span className={`w-1.5 h-1.5 rounded-full ${getDotColor(mMat)}`} />
                    <span className={`w-1.5 h-1.5 rounded-full ${getDotColor(mPom)}`} />
                    <span className={`w-1.5 h-1.5 rounded-full ${getDotColor(mSer)}`} />
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <div className="flex items-center justify-between px-1 text-xs">
          <span className="font-semibold text-on-surface">
            Giorno {selectedDay} • {selectedDate.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" })}
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-surface-container font-bold text-primary">
            {dayMisurazioni.length}/3 registrate
          </span>
        </div>

        {futureNotice && (
          <div
            role="status"
            className="p-3.5 rounded-2xl bg-secondary-container/70 border border-tertiary/30 text-xs font-medium text-on-surface"
          >
            {futureNotice}
          </div>
        )}

        <section className="space-y-4 pt-1" aria-label="Schede misurazione del giorno">
          {slots.map(({ id, title, cutoff, Icon, iconBg, mis }) => (
            <button
              key={id}
              type="button"
              onClick={() => handleOpenSlot(id, mis)}
              aria-disabled={selectedDay > currentActiveDay ? "true" : undefined}
              className={`w-full text-left p-5 rounded-3xl border transition-all shadow-terra ${
                mis
                  ? "bg-surface-container-lowest border-surface-variant/60 hover:border-primary/50"
                  : "bg-surface-container-lowest border-dashed border-surface-variant hover:border-primary/50"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${iconBg}`}>
                    <Icon className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-on-surface block">{title}</span>
                    <span className="text-xs text-secondary">{cutoff}</span>
                  </div>
                </div>

                {mis ? (
                  <span className="min-w-[36px] min-h-[36px] rounded-xl bg-surface-container text-secondary flex items-center justify-center">
                    <Pencil className="w-4 h-4" aria-hidden="true" />
                  </span>
                ) : (
                  <span className="px-3.5 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold flex items-center gap-1 shadow-sm shrink-0">
                    <Plus className="w-4 h-4" aria-hidden="true" />
                    <span>Inserisci</span>
                  </span>
                )}
              </div>

              {mis && (
                <div className="mt-4 pt-3 border-t border-surface-variant/30 flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-baseline gap-1.5 flex-wrap">
                    <span className="text-3xl font-headline font-bold text-on-surface">
                      {mis.pressioneMax} / {mis.pressioneMin}
                    </span>
                    <span className="text-xs text-secondary font-semibold">mmHg</span>
                    {mis.bpm && (
                      <span className="text-xs text-secondary ml-2 inline-flex items-center gap-1">
                        <Heart className="w-3.5 h-3.5 text-error fill-error" aria-hidden="true" />
                        <span>{mis.bpm} bpm</span>
                      </span>
                    )}
                  </div>

                  {(() => {
                    const cat = classifyBloodPressure(mis.pressioneMax, mis.pressioneMin);
                    return (
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] ${cat.badgeClass}`}>
                        {cat.category}
                      </span>
                    );
                  })()}
                </div>
              )}
            </button>
          ))}
        </section>

        {noteTerapia && noteTerapia.length > 0 && (
          <button
            type="button"
            onClick={() => setIsNoteOpen(true)}
            className="w-full text-left p-4 rounded-2xl bg-secondary-container/40 border border-secondary/20 flex items-center justify-between gap-3 hover:bg-secondary-container/60 transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <ClipboardList className="w-5 h-5 text-tertiary shrink-0" aria-hidden="true" />
              <div className="min-w-0">
                <span className="text-xs font-bold text-on-surface block">
                  Indicazioni del Medico
                </span>
                <span className="text-xs text-on-surface-variant truncate block">
                  {noteTerapia[0].testo}
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-outline shrink-0" aria-hidden="true" />
          </button>
        )}
      </main>

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
        onStartCalibration={() => setIsOnboardingOpen(false)}
      />

      <ConclusioneCicloModal
        isOpen={isConclusioneOpen}
        onClose={() => setIsConclusioneOpen(false)}
        onDownloadPdf={() => {
          setIsConclusioneOpen(false);
          setIsReportOpen(true);
        }}
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
        onRead={() => setUnreadCount(0)}
        onMuteChange={(m) => setIsNotificationsMuted(m.isMuted)}
        pazienteId={paziente.id}
      />

      <ImpostazioniAppModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onOpenBiometria={() => setIsBioOpen(true)}
        onMuteChange={(m) => setIsNotificationsMuted(m.isMuted)}
      />

      <GestioneBiometriaModal isOpen={isBioOpen} onClose={() => setIsBioOpen(false)} />

      <ReportClinicoModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        paziente={paziente}
        ciclo={activeCiclo}
        misurazioni={misurazioni}
        averages={
          averages || {
            avgMax: 125,
            avgMin: 80,
            avgBpm: 72,
            targetRate: 90,
            totalCount: misurazioni.length,
          }
        }
        noteTerapia={noteTerapia}
        medicoNome={medicoNomeCompleto || "Dott.ssa Ivana Pariggiano"}
      />

      <DisclaimerPazienteModal
        isOpen={paziente.disclaimerAccettato === false}
        onAcceptSuccess={() =>
          setData({ ...data, paziente: { ...paziente, disclaimerAccettato: true } })
        }
        onDeclineLogout={() => router.push("/login/paziente")}
      />
    </div>
  );
}
