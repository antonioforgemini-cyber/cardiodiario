"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Bell,
  BellOff,
  ClipboardList,
  Hand,
  LogOut,
  PauseCircle,
  Play,
  Settings,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { StethoscopeLoader } from "@/components/StethoscopeLoader";
import {
  getPazienteDettaglioClinico,
  getComunicazioniPaziente,
  getUtenteCorrente,
  logout,
} from "@/db/actions";
import { OnboardingModal } from "@/components/modals/OnboardingModal";
import MisurazioneInizialeModal from "@/components/modals/MisurazioneInizialeModal";
import { NoteTerapiaModal } from "@/components/modals/NoteTerapiaModal";
import { NotificheModal } from "@/components/modals/NotificheModal";
import { GestioneBiometriaModal } from "@/components/modals/GestioneBiometriaModal";
import { ImpostazioniAppModal } from "@/components/modals/ImpostazioniAppModal";
import { DisclaimerPazienteModal } from "@/components/modals/DisclaimerPazienteModal";
import { PwaInstallCard } from "@/components/pwa/PwaInstallCard";
import { PushPermissionCard } from "@/components/pwa/PushPermissionCard";
import { calculateCurrentActiveDay } from "@/lib/dateUtils";

export default function PazienteCicliPage() {
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [user, setUser] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isBilateralOpen, setIsBilateralOpen] = useState(false);
  const [selectedCicloForStart, setSelectedCicloForStart] = useState<string | null>(null);
  const [isNoteOpen, setIsNoteOpen] = useState(false);
  const [isNotificheOpen, setIsNotificheOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isBioOpen, setIsBioOpen] = useState(false);
  const [isNotificationsMuted, setIsNotificationsMuted] = useState(false);

  const loadData = useCallback(async (pazienteId: string) => {
    try {
      const [res, comms, pushInfo] = await Promise.all([
        getPazienteDettaglioClinico(pazienteId),
        getComunicazioniPaziente(pazienteId),
        fetch("/api/push/subscribe", { cache: "no-store" })
          .then((r) => (r.ok ? (r.json() as Promise<{ mute?: { isMuted?: boolean } }>) : null))
          .catch(() => null),
      ]);
      setData(res);
      setUnreadCount(comms.filter((c) => !c.letta).length);
      if (pushInfo?.mute) {
        setIsNotificationsMuted(Boolean(pushInfo.mute.isMuted));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const u = await getUtenteCorrente();
        if (!u || u.role !== "paziente") {
          router.push("/login/paziente");
          return;
        }
        setUser(u);
        await loadData(u.id);
        if (typeof window !== "undefined") {
          const sp = new URLSearchParams(window.location.search);
          if (sp.get("open") === "notifiche") {
            setIsNotificheOpen(true);
          }
        }
      } catch {
        router.push("/login/paziente");
      }
    })();
  }, [loadData, router]);

  const handleStartCycle = (cicloId: string) => {
    setSelectedCicloForStart(cicloId);
    setIsOnboardingOpen(true);
  };

  const handleOnboardingComplete = () => {
    setIsOnboardingOpen(false);
    setIsBilateralOpen(true);
  };

  const handleBilateralSuccess = () => {
    if (selectedCicloForStart) {
      router.push(`/paziente/diario/${selectedCicloForStart}`);
    } else if (user) {
      void loadData(user.id);
    }
  };

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <StethoscopeLoader text="Caricamento dei tuoi diari..." />
      </div>
    );
  }

  const allCicli = data?.allCicli || [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const inCorsoCicli = allCicli.filter((c: any) => c.stato === "in corso");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pendingCicli = allCicli.filter((c: any) => c.stato === "da iniziare" || c.stato === "in pausa");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pastCicli = allCicli.filter((c: any) => c.stato === "concluso" || c.stato === "annullato");

  return (
    <div className="min-h-screen bg-surface flex flex-col pt-safe pb-safe">
      <header className="fixed top-0 inset-x-0 z-40 bg-surface/90 backdrop-blur-xl shadow-xs border-b border-surface-variant/30">
        <div className="max-w-md mx-auto min-h-[64px] px-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <Logo size={36} showText={false} />
            <div className="flex flex-col min-w-0">
              <span className="font-headline font-bold text-base leading-tight text-primary">
                CardioDiario
              </span>
              <span className="text-[11px] text-on-surface-variant truncate">
                Paziente: {user.nome} {user.cognome}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              aria-label="Impostazioni dell'app (Notifiche, Suoneria e Biometria)"
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-on-surface hover:bg-surface-container transition-colors"
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
                  : "Centro Notifiche (Nessuna nuova notifica)"
              }
              className="relative min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-on-surface hover:bg-surface-container transition-colors"
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
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-on-surface hover:bg-surface-container transition-colors"
            >
              <ClipboardList className="w-5 h-5" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={async () => {
                try {
                  localStorage.removeItem("paziente_user");
                } catch {}
                await logout();
                router.push("/login/paziente");
              }}
              aria-label="Esci dal diario"
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-secondary hover:text-error hover:bg-surface-container transition-colors"
            >
              <LogOut className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      <main id="main-content" tabIndex={-1} className="flex-1 w-full max-w-md mx-auto pt-20 px-4 pb-12 space-y-6">
        <div className="bg-surface-container-low rounded-3xl p-5 shadow-terra space-y-2 border border-surface-variant/40">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-[11px] font-bold uppercase tracking-wider text-primary bg-primary-container/30 px-3 py-1 rounded-full">
              Studio Medico Connesso
            </span>
            <span className="text-xs text-secondary font-mono">{user.codiceFiscale}</span>
          </div>
          <h1 className="text-2xl font-headline font-bold text-on-surface pt-1">
            I Tuoi Cicli di Monitoraggio
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
            Gestiti in collaborazione con la{" "}
            <strong className="text-on-surface">
              {user.medicoNomeCompleto || "Dott.ssa Ivana Pariggiano"}
            </strong>
            .
          </p>
        </div>

        <PwaInstallCard compact />
        <PushPermissionCard variant="banner" />

        {inCorsoCicli.length > 0 && (
          <section className="space-y-3" aria-labelledby="active-cycles-heading">
            <div className="flex items-center justify-between px-1">
              <h2
                id="active-cycles-heading"
                className="text-sm font-headline font-bold text-on-surface uppercase tracking-wider"
              >
                Ciclo Attivo
              </h2>
              <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-primary" aria-hidden="true" />
                <span>In Corso</span>
              </span>
            </div>

            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {inCorsoCicli.map((c: any) => {
              const totalDays = (c.durataSettimane || 1) * 7;
              const currentDay = calculateCurrentActiveDay(
                c.dataInizioEffettiva,
                totalDays,
                c.maxGiornoRilevato || 1
              );

              const percentComplete =
                c.misurazioniCount && c.misurazioniCount > 0
                  ? Math.min(100, Math.max(1, Math.round((currentDay / totalDays) * 100)))
                  : 0;

              return (
                <div
                  key={c.id}
                  className="bg-surface-container-lowest rounded-3xl p-6 shadow-terra border-2 border-primary/40 space-y-5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-secondary uppercase tracking-wide">
                        Durata: {c.durataSettimane} Settimane ({totalDays} Giorni)
                      </span>
                      <h3 className="text-xl font-headline font-bold text-on-surface">
                        Diario della Pressione
                      </h3>
                    </div>

                    {c.braccioRiferimento && (
                      <div className="bg-primary-container/30 px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-primary/20 shrink-0">
                        <Hand className="w-4 h-4 text-primary" aria-hidden="true" />
                        <span className="text-[11px] font-bold text-primary uppercase">
                          Braccio {c.braccioRiferimento}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-on-surface-variant font-medium">
                      <span>
                        Giorno {currentDay} di {totalDays}
                      </span>
                      <span className="font-bold text-primary">{percentComplete}% Completato</span>
                    </div>
                    <div
                      role="progressbar"
                      aria-label={`Avanzamento ciclo: ${percentComplete}%`}
                      aria-valuenow={percentComplete}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      className="w-full bg-surface-variant h-2.5 rounded-full overflow-hidden"
                    >
                      <div
                        className="bg-primary h-full rounded-full transition-all duration-500"
                        style={{ width: `${percentComplete}%` }}
                      />
                    </div>
                  </div>

                  <Link
                    href={`/paziente/diario/${c.id}`}
                    className="w-full min-h-[52px] py-3 px-4 rounded-2xl bg-primary hover:bg-primary/90 text-on-primary text-sm font-bold shadow-sm flex items-center justify-center gap-2 transition-colors"
                  >
                    <span>Continua Misurazioni</span>
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </Link>
                </div>
              );
            })}
          </section>
        )}

        {pendingCicli.length > 0 && (
          <section className="space-y-3" aria-labelledby="pending-cycles-heading">
            <h2
              id="pending-cycles-heading"
              className="text-sm font-headline font-bold text-on-surface uppercase tracking-wider px-1"
            >
              Nuovi Cicli o In Sospeso
            </h2>

            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {pendingCicli.map((c: any) => (
              <div
                key={c.id}
                className="bg-surface-container-lowest rounded-3xl p-5 shadow-terra border border-surface-variant/50 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wide px-2.5 py-0.5 rounded-full bg-secondary-container text-tertiary">
                    Stato: {c.stato}
                  </span>
                  <span className="text-xs text-secondary font-semibold">
                    {c.durataSettimane} settimane
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-headline font-bold text-on-surface">
                    Nuovo Ciclo di Controllo
                  </h3>
                  <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5">
                    {c.noteCiclo || "Monitoraggio prescritto dal tuo medico curante."}
                  </p>
                </div>

                {c.stato === "da iniziare" ? (
                  <button
                    type="button"
                    onClick={() => handleStartCycle(c.id)}
                    className="w-full min-h-[48px] px-4 rounded-xl bg-primary hover:bg-primary/90 text-on-primary text-xs sm:text-sm font-bold shadow-sm flex items-center justify-center gap-2 transition-colors"
                  >
                    <span>Inizia Ora (Guida &amp; 1ª Misura)</span>
                    <Play className="w-4 h-4" aria-hidden="true" />
                  </button>
                ) : (
                  <div className="p-3 rounded-xl bg-error-container/25 text-xs text-error font-medium flex items-center gap-2">
                    <PauseCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>Questo ciclo è momentaneamente in pausa. Contatta il medico.</span>
                  </div>
                )}
              </div>
            ))}
          </section>
        )}

        {pastCicli.length > 0 && (
          <section className="space-y-3" aria-labelledby="past-cycles-heading">
            <h2
              id="past-cycles-heading"
              className="text-sm font-headline font-bold text-secondary uppercase tracking-wider px-1"
            >
              Storico Cicli Conclusi
            </h2>

            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {pastCicli.map((c: any) => (
              <div
                key={c.id}
                className="bg-surface-container-lowest/80 rounded-2xl p-4 border border-surface-variant/40 flex items-center justify-between gap-3"
              >
                <div>
                  <span className="text-xs sm:text-sm font-bold text-on-surface block">
                    Ciclo del {new Date(c.dataCreazione).toLocaleDateString("it-IT")}
                  </span>
                  <span className="text-[11px] text-secondary capitalize">
                    Stato: {c.stato} • {c.durataSettimane} settimane
                  </span>
                </div>

                <Link
                  href={`/paziente/diario/${c.id}`}
                  className="min-h-[40px] px-3.5 py-2 rounded-lg bg-surface-container text-xs font-bold text-primary hover:bg-surface-container-high inline-flex items-center"
                >
                  Rivedi Dati
                </Link>
              </div>
            ))}
          </section>
        )}
      </main>

      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onStartCalibration={handleOnboardingComplete}
      />

      {selectedCicloForStart && (
        <MisurazioneInizialeModal
          isOpen={isBilateralOpen}
          onClose={() => setIsBilateralOpen(false)}
          onSuccess={handleBilateralSuccess}
          cicloId={selectedCicloForStart}
          pazienteId={user.id}
        />
      )}

      <NoteTerapiaModal
        isOpen={isNoteOpen}
        onClose={() => setIsNoteOpen(false)}
        note={data?.noteTerapia || []}
      />

      <NotificheModal
        isOpen={isNotificheOpen}
        onClose={() => setIsNotificheOpen(false)}
        onRead={() => setUnreadCount(0)}
        onMuteChange={(m) => setIsNotificationsMuted(m.isMuted)}
        pazienteId={user.id}
      />

      <ImpostazioniAppModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onOpenBiometria={() => setIsBioOpen(true)}
        onMuteChange={(m) => setIsNotificationsMuted(m.isMuted)}
      />

      <GestioneBiometriaModal isOpen={isBioOpen} onClose={() => setIsBioOpen(false)} />

      <DisclaimerPazienteModal
        isOpen={!user.disclaimerAccettato}
        onAcceptSuccess={() => setUser({ ...user, disclaimerAccettato: true })}
        onDeclineLogout={() => router.push("/login/paziente")}
      />
    </div>
  );
}
