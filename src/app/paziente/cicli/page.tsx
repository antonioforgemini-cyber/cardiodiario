"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";
import { getPazienteDettaglioClinico, getComunicazioniPaziente } from "@/db/actions";
import { OnboardingModal } from "@/components/modals/OnboardingModal";
import MisurazioneInizialeModal from "@/components/modals/MisurazioneInizialeModal";
import { NoteTerapiaModal } from "@/components/modals/NoteTerapiaModal";
import { NotificheModal } from "@/components/modals/NotificheModal";

export default function PazienteCicliPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  // Modals
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isBilateralOpen, setIsBilateralOpen] = useState(false);
  const [selectedCicloForStart, setSelectedCicloForStart] = useState<string | null>(null);
  const [isNoteOpen, setIsNoteOpen] = useState(false);
  const [isNotificheOpen, setIsNotificheOpen] = useState(false);

  const loadData = async (pazienteId: string) => {
    try {
      const res = await getPazienteDettaglioClinico(pazienteId);
      setData(res);
      const comms = await getComunicazioniPaziente(pazienteId);
      setUnreadCount(comms.filter((c: any) => !c.letta).length);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const stored = localStorage.getItem("paziente_user");
    if (!stored) {
      router.push("/login/paziente");
      return;
    }
    const u = JSON.parse(stored);
    setUser(u);
    loadData(u.id);
  }, []);

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
      loadData(user.id);
    }
  };

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const allCicli = data?.allCicli || [];
  const inCorsoCicli = allCicli.filter((c: any) => c.stato === "in corso");
  const pendingCicli = allCicli.filter((c: any) => c.stato === "da iniziare" || c.stato === "in pausa");
  const pastCicli = allCicli.filter((c: any) => c.stato === "concluso" || c.stato === "annullato");

  return (
    <div className="min-h-screen bg-surface flex flex-col pt-safe pb-safe">
      {/* Top Mobile PWA Appbar */}
      <header className="fixed top-0 inset-x-0 z-40 bg-surface/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(46,50,48,0.04)] border-b border-surface-variant/30">
        <div className="max-w-md mx-auto h-16 px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size={36} showText={false} />
            <div className="flex flex-col">
              <span className="font-headline font-bold text-base leading-tight text-primary">
                CardioDiario
              </span>
              <span className="text-[11px] text-on-surface-variant">
                Paziente: {user.nome} {user.cognome}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsNotificheOpen(true)}
              title={unreadCount > 0 ? `Centro Notifiche (${unreadCount} nuove)` : "Centro Notifiche (Nessuna nuova notifica)"}
              aria-label="Centro Notifiche"
              className="relative w-10 h-10 flex items-center justify-center rounded-full text-on-surface hover:bg-surface-container active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[22px]">notifications</span>
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-error text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-surface">
                  {unreadCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setIsNoteOpen(true)}
              title="Note di Terapia e Prescrizioni del Medico"
              aria-label="Note Medico"
              className="w-10 h-10 flex items-center justify-center rounded-full text-on-surface hover:bg-surface-container active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[22px]">prescriptions</span>
            </button>

            <button
              onClick={() => {
                localStorage.removeItem("paziente_user");
                router.push("/login/paziente");
              }}
              title="Disconnetti (Esci dal diario)"
              aria-label="Esci"
              className="w-10 h-10 flex items-center justify-center rounded-full text-secondary hover:text-error hover:bg-surface-container active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[20px]">logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-md mx-auto pt-20 px-4 pb-12 space-y-6">
        {/* Welcome Card */}
        <div className="bg-surface-container-low rounded-3xl p-5 shadow-sm space-y-2 border border-surface-variant/40">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-primary bg-primary-container/30 px-3 py-1 rounded-full">
              Studio Medico Connesso
            </span>
            <span className="text-xs text-secondary font-mono">{user.codiceFiscale}</span>
          </div>
          <h1 className="text-2xl font-headline font-bold text-on-surface pt-1">
            I Tuoi Cicli di Monitoraggio
          </h1>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            Gestiti in collaborazione con la <strong>{user.medicoNomeCompleto || "Dott.ssa Ivana Pariggiano"}</strong>.
          </p>
        </div>

        {/* 1. Ciclo IN CORSO (Massima Priorità) */}
        {inCorsoCicli.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-headline font-bold text-on-surface uppercase tracking-wider">
                Ciclo Attivo
              </h2>
              <span className="text-xs font-bold text-primary flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-primary animate-ping"></span>
                In Corso
              </span>
            </div>

            {inCorsoCicli.map((c: any) => {
              const totalDays = (c.durataSettimane || 1) * 7;
              let currentDay = 1;
              if (c.dataInizioEffettiva) {
                const start = new Date(c.dataInizioEffettiva).getTime();
                const diffDays = Math.floor((Date.now() - start) / (1000 * 60 * 60 * 24)) + 1;
                currentDay = Math.min(Math.max(1, diffDays), totalDays);
              } else if (c.maxGiornoRilevato && c.maxGiornoRilevato > 0) {
                currentDay = Math.min(c.maxGiornoRilevato, totalDays);
              }

              // Calcolo percentuale di completamento
              const percentComplete = c.misurazioniCount && c.misurazioniCount > 0
                ? Math.min(100, Math.max(1, Math.round((currentDay / totalDays) * 100)))
                : 0;

              return (
                <div
                  key={c.id}
                  className="bg-surface-container-lowest rounded-3xl p-6 shadow-md border-2 border-primary/40 space-y-5"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-secondary uppercase tracking-wide">
                        Durata: {c.durataSettimane} Settimane ({totalDays} Giorni)
                      </span>
                      <h3 className="text-xl font-headline font-bold text-on-surface">
                        Diario della Pressione
                      </h3>
                    </div>

                    {c.braccioRiferimento && (
                      <div className="bg-primary-container/30 px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-primary/20">
                        <span className="material-symbols-outlined text-primary text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
                          pan_tool
                        </span>
                        <span className="text-[10px] font-bold text-primary uppercase">
                          Braccio {c.braccioRiferimento}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-on-surface-variant font-medium">
                      <span>Giorno {currentDay} di {totalDays}</span>
                      <span className="font-bold text-primary">{percentComplete}% Completato</span>
                    </div>
                    <div className="w-full bg-surface-variant h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-primary h-full rounded-full transition-all duration-500"
                        style={{ width: `${percentComplete}%` }}
                      ></div>
                    </div>
                  </div>

                  <Link
                    href={`/paziente/diario/${c.id}`}
                    className="w-full h-13 py-3 rounded-2xl bg-primary hover:bg-primary/90 text-on-primary text-sm font-bold shadow-sm flex items-center justify-center gap-2 active:scale-98 transition-all"
                  >
                    <span>Continua Misurazioni</span>
                    <span className="material-symbols-outlined text-lg">arrow_forward</span>
                  </Link>
                </div>
              );
            })}
          </div>
        )}

        {/* 2. Cicli DA INIZIARE o IN PAUSA */}
        {pendingCicli.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-headline font-bold text-on-surface uppercase tracking-wider px-1">
              Nuovi Cicli o In Sospeso
            </h2>

            {pendingCicli.map((c: any) => (
              <div
                key={c.id}
                className="bg-surface-container-lowest rounded-3xl p-5 shadow-sm border border-surface-variant/50 space-y-4"
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
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    {c.noteCiclo || "Monitoraggio prescritto dal tuo medico curante."}
                  </p>
                </div>

                {c.stato === "da iniziare" ? (
                  <button
                    type="button"
                    onClick={() => handleStartCycle(c.id)}
                    className="w-full h-12 rounded-xl bg-primary text-on-primary text-xs font-bold shadow-sm flex items-center justify-center gap-2 active:scale-98 transition-all"
                  >
                    <span>Inizia Ora (Guida & 1ª Misura)</span>
                    <span className="material-symbols-outlined text-base">play_arrow</span>
                  </button>
                ) : (
                  <div className="p-3 rounded-xl bg-error-container/20 text-xs text-error font-medium flex items-center gap-2">
                    <span className="material-symbols-outlined text-base">pause_circle</span>
                    <span>Questo ciclo è momentaneamente in pausa. Contatta il medico.</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 3. Cicli CONCLUSI o ANNULLATI */}
        {pastCicli.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-headline font-bold text-secondary uppercase tracking-wider px-1">
              Storico Cicli Conclusi
            </h2>

            {pastCicli.map((c: any) => (
              <div
                key={c.id}
                className="bg-surface-container-lowest/70 rounded-2xl p-4 border border-surface-variant/40 flex items-center justify-between"
              >
                <div>
                  <span className="text-xs font-bold text-on-surface block">
                    Ciclo del {new Date(c.dataCreazione).toLocaleDateString("it-IT")}
                  </span>
                  <span className="text-[11px] text-secondary capitalize">
                    Stato: {c.stato} • {c.durataSettimane} settimane
                  </span>
                </div>

                <Link
                  href={`/paziente/diario/${c.id}`}
                  className="px-3 py-1.5 rounded-lg bg-surface-container text-xs font-bold text-primary hover:bg-surface-container-high"
                >
                  Rivedi Dati
                </Link>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modals */}
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
        pazienteId={user.id}
      />
    </div>
  );
}
