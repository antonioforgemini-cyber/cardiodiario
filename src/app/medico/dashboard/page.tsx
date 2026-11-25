"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  AlertTriangle,
  ArrowRight,
  BellRing,
  Calendar,
  Gauge,
  Megaphone,
  Search,
  UserPlus,
  UserX,
  Users,
} from "lucide-react";
import { getDoctorDashboardData } from "@/db/actions";
import { StethoscopeLoader } from "@/components/StethoscopeLoader";
import { NuovoPazienteModal } from "@/components/modals/NuovoPazienteModal";
import { SchedaCredenzialiModal } from "@/components/modals/SchedaCredenzialiModal";
import { InvioComunicazioneModal } from "@/components/modals/InvioComunicazioneModal";

const DashboardCharts = dynamic(
  () => import("@/components/charts/DashboardCharts").then((m) => m.DashboardCharts),
  {
    ssr: false,
    loading: () => (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-80 rounded-3xl bg-surface-container-low border border-surface-variant/40 animate-pulse" />
        <div className="h-80 rounded-3xl bg-surface-container-low border border-surface-variant/40 animate-pulse" />
      </div>
    ),
  }
);

export default function DoctorDashboardPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [isNewPatientOpen, setIsNewPatientOpen] = useState(false);
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [createdPatient, setCreatedPatient] = useState<any>(null);

  const loadData = useCallback(async () => {
    try {
      const res = await getDoctorDashboardData();
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handlePatientCreated = (created: any) => {
    setIsNewPatientOpen(false);
    setCreatedPatient(created);
    void loadData();
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <StethoscopeLoader text="Caricamento cruscotto clinico..." />
      </div>
    );
  }

  const { medico, stats, pazienti, trendData = [], distributionData = [] } = data;
  const medicoNomeCompleto = medico
    ? `Dott.ssa ${medico.nome} ${medico.cognome}`
    : "Dott.ssa Ivana Pariggiano";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filteredPatients = pazienti.filter((p: any) => {
    const matchesSearch = `${p.nome} ${p.cognome} ${p.codiceFiscale}`
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || p.cicloStato === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-variant/40 pb-5 sm:pb-6">
        <div>
          <span className="text-[11px] sm:text-xs font-bold text-primary tracking-wider uppercase">
            CardioDiario • Portale Specialista
          </span>
          <h1 className="text-2xl sm:text-3xl font-headline font-bold text-on-surface tracking-tight mt-1">
            Cruscotto Medico Esecutivo
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant">
            {medicoNomeCompleto} • {medico?.specializzazione || "Specialista in Cardiologia"}
          </p>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setIsBroadcastOpen(true)}
            className="flex-1 sm:flex-none justify-center min-h-[44px] px-3.5 sm:px-4 py-2.5 rounded-xl bg-surface-container-lowest hover:bg-surface-container text-on-surface text-xs sm:text-sm font-semibold border border-surface-variant/50 shadow-sm flex items-center gap-2 transition-colors"
          >
            <Megaphone className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
            <span>Invia Notifica</span>
          </button>
          <button
            type="button"
            onClick={() => setIsNewPatientOpen(true)}
            className="flex-1 sm:flex-none justify-center min-h-[44px] px-4 sm:px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-on-primary text-xs sm:text-sm font-bold shadow-sm flex items-center gap-2 transition-colors"
          >
            <UserPlus className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Nuovo Paziente</span>
          </button>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="flex sm:grid sm:grid-cols-2 lg:grid-cols-4 overflow-x-auto snap-x snap-mandatory gap-3 sm:gap-5 pb-2 sm:pb-0 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-none">
        <div className="shrink-0 w-[240px] sm:w-auto snap-start bg-surface-container-lowest p-5 sm:p-6 rounded-3xl border border-surface-variant/50 shadow-terra flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-secondary uppercase tracking-wider">
              Pazienti Censiti
            </span>
            <span className="w-10 h-10 rounded-2xl bg-primary-container/30 text-primary flex items-center justify-center">
              <Users className="w-5 h-5" aria-hidden="true" />
            </span>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-headline font-bold text-on-surface">
              {stats.totalPazienti}
            </span>
            <span className="text-xs text-primary font-bold ml-2">Studio Attivo</span>
          </div>
        </div>

        <div className="shrink-0 w-[240px] sm:w-auto snap-start bg-surface-container-lowest p-5 sm:p-6 rounded-3xl border border-surface-variant/50 shadow-terra flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-secondary uppercase tracking-wider">
              Cicli In Corso
            </span>
            <span className="w-10 h-10 rounded-2xl bg-secondary-container text-tertiary flex items-center justify-center">
              <Calendar className="w-5 h-5" aria-hidden="true" />
            </span>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-headline font-bold text-on-surface">
              {stats.cicliInCorso}
            </span>
            <span className="text-xs text-secondary font-semibold ml-2">
              {stats.cicliInCorso > 0 ? `aderenza ${stats.compliance}%` : "monitoraggi attivi"}
            </span>
          </div>
        </div>

        <div className="shrink-0 w-[240px] sm:w-auto snap-start bg-surface-container-lowest p-5 sm:p-6 rounded-3xl border border-surface-variant/50 shadow-terra flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-secondary uppercase tracking-wider">
              Misurazioni Oggi
            </span>
            <span className="w-10 h-10 rounded-2xl bg-primary-container/30 text-primary flex items-center justify-center">
              <Gauge className="w-5 h-5" aria-hidden="true" />
            </span>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-headline font-bold text-on-surface">
              {stats.misurazioniOggi}
            </span>
            <span className="text-xs text-primary font-semibold ml-2">slot compilati</span>
          </div>
        </div>

        <div className="shrink-0 w-[240px] sm:w-auto snap-start bg-surface-container-lowest p-5 sm:p-6 rounded-3xl border border-surface-variant/50 shadow-terra flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-secondary uppercase tracking-wider">
              Allarmi Pressori
            </span>
            <span className="w-10 h-10 rounded-2xl bg-error-container text-error flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" aria-hidden="true" />
            </span>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-headline font-bold text-error">
              {stats.allarmiCount}
            </span>
            <span className="text-xs text-on-surface-variant ml-2 font-medium">ultimi 7 giorni</span>
          </div>
        </div>
      </div>

      <DashboardCharts trendData={trendData} distributionData={distributionData} />

      <section
        aria-labelledby="dashboard-patients-title"
        className="bg-surface-container-lowest p-5 sm:p-6 rounded-3xl border border-surface-variant/50 shadow-terra space-y-5"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 id="dashboard-patients-title" className="text-lg font-headline font-bold text-on-surface">
              Pazienti in Monitoraggio
            </h2>
            <p className="text-xs text-on-surface-variant">
              Seleziona un paziente per esaminare il diario clinico dettagliato o intervenire sulla terapia.
            </p>
          </div>

          <search className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <label htmlFor="dash-search" className="visually-hidden">
                Cerca paziente o codice fiscale
              </label>
              <input
                id="dash-search"
                type="search"
                placeholder="Cerca paziente o CF..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="min-h-[42px] pl-9 pr-4 bg-surface-container-low rounded-xl text-xs font-medium border border-surface-variant/50 focus:outline-none w-full sm:w-64"
              />
              <Search
                className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none"
                aria-hidden="true"
              />
            </div>

            <div>
              <label htmlFor="dash-status-filter" className="visually-hidden">
                Filtra per stato del ciclo
              </label>
              <select
                id="dash-status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="min-h-[42px] pl-3.5 pr-9 bg-surface-container-low rounded-xl text-xs font-semibold text-on-surface border border-surface-variant/50 focus:outline-none cursor-pointer w-full sm:w-auto"
              >
                <option value="all">Tutti gli stati</option>
                <option value="in corso">In Corso</option>
                <option value="da iniziare">Da Iniziare</option>
                <option value="in pausa">In Pausa</option>
              </select>
            </div>
          </search>
        </div>

        <div
          tabIndex={0}
          role="region"
          aria-labelledby="dashboard-patients-title"
          className="responsive-table-wrapper"
        >
          <table className="w-full text-left text-sm">
            <caption className="visually-hidden">
              Elenco dei pazienti seguiti con stato ciclo e ultima misurazione
            </caption>
            <thead>
              <tr className="border-b border-surface-variant/40 text-[11px] font-bold text-secondary uppercase tracking-wider">
                <th scope="col" className="pb-3 px-3">Paziente</th>
                <th scope="col" className="pb-3 px-3">Codice Fiscale</th>
                <th scope="col" className="pb-3 px-3">Stato Ciclo</th>
                <th scope="col" className="pb-3 px-3">Braccio</th>
                <th scope="col" className="pb-3 px-3">Ultima Rilevazione</th>
                <th scope="col" className="pb-3 px-3 text-right">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-variant/20">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {filteredPatients.map((p: any) => {
                let badgeClass = "bg-surface-container text-on-surface-variant";
                if (p.cicloStato === "in corso") badgeClass = "bg-primary-container/40 text-primary font-bold";
                if (p.cicloStato === "da iniziare") badgeClass = "bg-secondary-container text-tertiary font-bold";
                if (p.cicloStato === "in pausa") badgeClass = "bg-error-container/40 text-error font-bold";

                return (
                  <tr key={p.id} className="hover:bg-surface-container-low/60 transition-colors">
                    <th scope="row" className="py-4 px-3 font-semibold text-on-surface text-left">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link href={`/medico/pazienti/${p.id}`} className="hover:text-primary hover:underline">
                          {p.cognome} {p.nome}
                        </Link>
                        {p.pushActive && (
                          <span
                            title="Notifiche push attive sullo smartphone"
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary-container/30 text-primary text-[10px] font-bold"
                          >
                            <BellRing className="w-3 h-3" aria-hidden="true" />
                            <span className="visually-hidden">Push attive</span>
                          </span>
                        )}
                      </div>
                    </th>
                    <td data-label="Codice Fiscale" className="py-4 px-3 font-mono text-xs text-on-surface-variant">
                      {p.codiceFiscale}
                    </td>
                    <td data-label="Stato Ciclo" className="py-4 px-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs capitalize ${badgeClass}`}>
                        {p.cicloStato}
                      </span>
                    </td>
                    <td data-label="Braccio" className="py-4 px-3 text-xs font-semibold text-on-surface-variant">
                      {p.braccioRiferimento ? `Braccio ${p.braccioRiferimento}` : "—"}
                    </td>
                    <td data-label="Ultima Rilevazione" className="py-4 px-3 text-xs text-on-surface-variant">
                      {p.ultimoMax && p.ultimoMin ? (
                        <span className="font-bold text-on-surface">
                          {p.ultimoMax}/{p.ultimoMin} mmHg
                        </span>
                      ) : (
                        <span className="text-outline">Nessuna</span>
                      )}
                    </td>
                    <td data-label="Azioni" className="py-4 px-3 text-right">
                      <Link
                        href={`/medico/pazienti/${p.id}`}
                        className="inline-flex items-center gap-1 min-h-[38px] text-xs font-bold text-primary hover:bg-primary-container/20 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <span>Apri Diario</span>
                        <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {filteredPatients.length === 0 && (
                <tr className="responsive-empty-row">
                  <td colSpan={6} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <UserX className="w-8 h-8 text-outline" aria-hidden="true" />
                      <p className="text-sm font-semibold text-on-surface">Nessun paziente presente</p>
                      <p className="text-xs text-on-surface-variant">
                        Clicca su &quot;Nuovo Paziente&quot; in alto a destra per registrare il primo paziente.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <NuovoPazienteModal
        isOpen={isNewPatientOpen}
        onClose={() => setIsNewPatientOpen(false)}
        onSuccess={handlePatientCreated}
        medicoId={medico?.id}
      />

      <InvioComunicazioneModal
        isOpen={isBroadcastOpen}
        onClose={() => setIsBroadcastOpen(false)}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        pazienti={pazienti.map((p: any) => ({
          id: p.id,
          nome: p.nome,
          cognome: p.cognome,
          pushActive: p.pushActive,
        }))}
        medicoId={medico?.id || "med-1"}
      />

      {createdPatient && (
        <SchedaCredenzialiModal
          isOpen={true}
          onClose={() => setCreatedPatient(null)}
          medicoNome={medicoNomeCompleto}
          paziente={createdPatient}
        />
      )}
    </div>
  );
}
