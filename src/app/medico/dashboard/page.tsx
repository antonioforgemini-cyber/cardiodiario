"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { getDoctorDashboardData } from "@/db/actions";
import { NuovoPazienteModal } from "@/components/modals/NuovoPazienteModal";
import { SchedaCredenzialiModal } from "@/components/modals/SchedaCredenzialiModal";
import { InvioComunicazioneModal } from "@/components/modals/InvioComunicazioneModal";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  BarChart,
  Bar,
} from "recharts";

export default function DoctorDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modals
  const [isNewPatientOpen, setIsNewPatientOpen] = useState(false);
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);
  const [createdPatient, setCreatedPatient] = useState<any>(null);

  const loadData = async () => {
    try {
      const res = await getDoctorDashboardData("med-1");
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePatientCreated = (id: string) => {
    setIsNewPatientOpen(false);
    loadData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-secondary">Caricamento cruscotto clinico...</p>
        </div>
      </div>
    );
  }

  const { stats, pazienti } = data;

  const filteredPatients = pazienti.filter((p: any) => {
    const matchesSearch =
      `${p.nome} ${p.cognome} ${p.codiceFiscale}`.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || p.cicloStato === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Mock trend data for executive chart
  const trendData = [
    { day: "G1", sistolica: 138, diastolica: 86, targetMax: 140, targetMin: 90 },
    { day: "G3", sistolica: 135, diastolica: 84, targetMax: 140, targetMin: 90 },
    { day: "G5", sistolica: 132, diastolica: 82, targetMax: 140, targetMin: 90 },
    { day: "G7", sistolica: 128, diastolica: 80, targetMax: 140, targetMin: 90 },
    { day: "G9", sistolica: 142, diastolica: 91, targetMax: 140, targetMin: 90 },
    { day: "G11", sistolica: 130, diastolica: 82, targetMax: 140, targetMin: 90 },
  ];

  const distributionData = [
    { fascia: "Mattina", mediaMax: 134, mediaMin: 84 },
    { fascia: "Pomeriggio", mediaMax: 131, mediaMin: 82 },
    { fascia: "Sera", mediaMax: 127, mediaMin: 80 },
  ];

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-surface-variant/40 pb-6">
        <div>
          <span className="text-xs font-bold text-primary tracking-wider uppercase">
            CardioDiario • Portale Specialista
          </span>
          <h1 className="text-3xl font-headline font-bold text-on-surface tracking-tight mt-1">
            Cruscotto Medico Esecutivo
          </h1>
          <p className="text-sm text-on-surface-variant">
            Studio Dott. Valerio Marchi • Monitoraggio attivo e analisi pressoria domiciliare.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsBroadcastOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-surface-container-lowest hover:bg-surface-container text-on-surface text-sm font-semibold border border-surface-variant/50 shadow-sm flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-primary text-xl">campaign</span>
            <span>Invia Notifica</span>
          </button>
          <button
            onClick={() => setIsNewPatientOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-on-primary text-sm font-bold shadow-sm flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-xl">person_add</span>
            <span>Nuovo Paziente</span>
          </button>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-surface-container-lowest p-6 rounded-3xl border border-surface-variant/50 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-secondary uppercase tracking-wider">
              Pazienti Censiti
            </span>
            <span className="w-10 h-10 rounded-2xl bg-primary-container/30 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-xl">group</span>
            </span>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-headline font-bold text-on-surface">
              {stats.totalPazienti}
            </span>
            <span className="text-xs text-primary font-bold ml-2">Studio Attivo</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-6 rounded-3xl border border-surface-variant/50 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-secondary uppercase tracking-wider">
              Cicli In Corso
            </span>
            <span className="w-10 h-10 rounded-2xl bg-secondary-container text-tertiary flex items-center justify-center">
              <span className="material-symbols-outlined text-xl">calendar_today</span>
            </span>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-headline font-bold text-on-surface">
              {stats.cicliInCorso}
            </span>
            <span className="text-xs text-secondary font-semibold ml-2">monitoraggi attivi</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-6 rounded-3xl border border-surface-variant/50 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-secondary uppercase tracking-wider">
              Misurazioni Oggi
            </span>
            <span className="w-10 h-10 rounded-2xl bg-primary-container/30 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-xl">speed</span>
            </span>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-headline font-bold text-on-surface">
              {stats.misurazioniOggi}
            </span>
            <span className="text-xs text-primary font-semibold ml-2">slot compilati</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-6 rounded-3xl border border-surface-variant/50 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-secondary uppercase tracking-wider">
              Allarmi Pressori
            </span>
            <span className="w-10 h-10 rounded-2xl bg-error-container text-error flex items-center justify-center">
              <span className="material-symbols-outlined text-xl">warning</span>
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

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Line Chart */}
        <div className="lg:col-span-2 bg-surface-container-lowest p-6 rounded-3xl border border-surface-variant/50 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-headline font-bold text-on-surface">
                Andamento Pressorio di Coorte
              </h2>
              <p className="text-xs text-on-surface-variant">
                Media sistolica e diastolica rilevata nei cicli con soglie target ESC/ESH (140/90 mmHg).
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-primary inline-block"></span>
                Sistolica (MAX)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-tertiary inline-block"></span>
                Diastolica (MIN)
              </span>
            </div>
          </div>

          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e0d8" vertical={false} />
                <XAxis dataKey="day" stroke="#74796e" fontSize={12} tickLine={false} />
                <YAxis stroke="#74796e" fontSize={12} domain={[60, 160]} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    borderRadius: "12px",
                    border: "1px solid #c4c8bc",
                    fontSize: "12px",
                  }}
                />
                <ReferenceLine y={140} stroke="#b83230" strokeDasharray="4 4" label={{ value: "Target Max 140", fill: "#b83230", fontSize: 10, position: "insideTopRight" }} />
                <ReferenceLine y={90} stroke="#b83230" strokeDasharray="4 4" label={{ value: "Target Min 90", fill: "#b83230", fontSize: 10, position: "insideBottomRight" }} />
                <Line type="monotone" dataKey="sistolica" stroke="#4a7c59" strokeWidth={3} dot={{ r: 4, fill: "#4a7c59" }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="diastolica" stroke="#705c30" strokeWidth={3} dot={{ r: 4, fill: "#705c30" }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Hourly Distribution Bar Chart */}
        <div className="bg-surface-container-lowest p-6 rounded-3xl border border-surface-variant/50 shadow-sm space-y-4">
          <div>
            <h2 className="text-lg font-headline font-bold text-on-surface">
              Distribuzione per Fascia
            </h2>
            <p className="text-xs text-on-surface-variant">
              Confronto dei valori medi per orario di misurazione.
            </p>
          </div>

          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distributionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e0d8" vertical={false} />
                <XAxis dataKey="fascia" stroke="#74796e" fontSize={12} tickLine={false} />
                <YAxis stroke="#74796e" fontSize={12} domain={[60, 160]} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    borderRadius: "12px",
                    border: "1px solid #c4c8bc",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="mediaMax" fill="#4a7c59" name="Media Max" radius={[6, 6, 0, 0]} />
                <Bar dataKey="mediaMin" fill="#c4a66a" name="Media Min" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Patient Table Overview */}
      <div className="bg-surface-container-lowest p-6 rounded-3xl border border-surface-variant/50 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-headline font-bold text-on-surface">
              Pazienti in Monitoraggio
            </h2>
            <p className="text-xs text-on-surface-variant">
              Seleziona un paziente per esaminare il diario clinico dettagliato o intervenire sulla terapia.
            </p>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Cerca paziente o CF..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 pl-9 pr-4 bg-surface-container-low rounded-xl text-xs font-medium border border-surface-variant/40 focus:outline-none focus:ring-1 focus:ring-primary w-52 sm:w-64"
              />
              <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-outline text-lg">
                search
              </span>
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 pl-3.5 pr-9 bg-surface-container-low rounded-xl text-xs font-semibold text-on-surface border border-surface-variant/40 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
            >
              <option value="all">Tutti gli stati</option>
              <option value="in corso">In Corso</option>
              <option value="da iniziare">Da Iniziare</option>
              <option value="in pausa">In Pausa</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-surface-variant/40 text-[11px] font-bold text-secondary uppercase tracking-wider">
                <th className="pb-3 px-3">Paziente</th>
                <th className="pb-3 px-3">Codice Fiscale</th>
                <th className="pb-3 px-3">Stato Ciclo</th>
                <th className="pb-3 px-3">Braccio</th>
                <th className="pb-3 px-3">Ultima Rilevazione</th>
                <th className="pb-3 px-3 text-right">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-variant/20">
              {filteredPatients.map((p: any) => {
                let badgeClass = "bg-surface-container text-on-surface-variant";
                if (p.cicloStato === "in corso") badgeClass = "bg-primary-container/40 text-primary font-bold";
                if (p.cicloStato === "da iniziare") badgeClass = "bg-secondary-container text-tertiary font-bold";
                if (p.cicloStato === "in pausa") badgeClass = "bg-error-container/40 text-error font-bold";

                return (
                  <tr key={p.id} className="hover:bg-surface-container-low/60 transition-colors">
                    <td className="py-4 px-3 font-semibold text-on-surface">
                      <Link href={`/medico/pazienti/${p.id}`} className="hover:text-primary hover:underline">
                        {p.cognome} {p.nome}
                      </Link>
                    </td>
                    <td className="py-4 px-3 font-mono text-xs text-on-surface-variant">
                      {p.codiceFiscale}
                    </td>
                    <td className="py-4 px-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs capitalize ${badgeClass}`}>
                        {p.cicloStato}
                      </span>
                    </td>
                    <td className="py-4 px-3 text-xs font-semibold text-on-surface-variant">
                      {p.braccioRiferimento ? `Braccio ${p.braccioRiferimento}` : "—"}
                    </td>
                    <td className="py-4 px-3 text-xs text-on-surface-variant">
                      {p.ultimoMax && p.ultimoMin ? (
                        <span className="font-bold text-on-surface">
                          {p.ultimoMax}/{p.ultimoMin} mmHg
                        </span>
                      ) : (
                        <span className="text-outline">Nessuna</span>
                      )}
                    </td>
                    <td className="py-4 px-3 text-right">
                      <Link
                        href={`/medico/pazienti/${p.id}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:bg-primary-container/20 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <span>Apri Diario</span>
                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <NuovoPazienteModal
        isOpen={isNewPatientOpen}
        onClose={() => setIsNewPatientOpen(false)}
        onSuccess={handlePatientCreated}
        medicoId="med-1"
      />

      <InvioComunicazioneModal
        isOpen={isBroadcastOpen}
        onClose={() => setIsBroadcastOpen(false)}
        pazienti={pazienti.map((p: any) => ({ id: p.id, nome: p.nome, cognome: p.cognome }))}
        medicoId="med-1"
      />

      {createdPatient && (
        <SchedaCredenzialiModal
          isOpen={true}
          onClose={() => setCreatedPatient(null)}
          paziente={createdPatient}
        />
      )}
    </div>
  );
}
