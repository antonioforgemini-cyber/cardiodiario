"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { getPazienteDettaglioClinico } from "@/db/actions";
import { NuovaNotaModal } from "@/components/modals/NuovaNotaModal";
import { NuovoCicloModal } from "@/components/modals/NuovoCicloModal";
import { GestioneCicloModal } from "@/components/modals/GestioneCicloModal";
import { SchedaCredenzialiModal } from "@/components/modals/SchedaCredenzialiModal";
import { classifyBloodPressure } from "@/lib/guidelines";
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

export default function PazienteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const pazienteId = resolvedParams.id;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isNotaModalOpen, setIsNotaModalOpen] = useState(false);
  const [isCicloModalOpen, setIsCicloModalOpen] = useState(false);
  const [isGestioneCicloOpen, setIsGestioneCicloOpen] = useState(false);
  const [isCredenzialiOpen, setIsCredenzialiOpen] = useState(false);

  const loadData = async () => {
    try {
      const res = await getPazienteDettaglioClinico(pazienteId);
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [pazienteId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-secondary">Caricamento scheda clinica...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center space-y-4">
        <h2 className="text-xl font-bold text-error">Paziente non trovato</h2>
        <Link href="/medico/pazienti" className="text-primary underline">
          Torna all&apos;elenco pazienti
        </Link>
      </div>
    );
  }

  const { paziente, activeCiclo, allCicli, misurazioni, averages, slotAverages, noteTerapia } = data;

  // Chart data from actual measurements
  const chartData = misurazioni.map((m: any) => ({
    label: `G${m.giornoNumero} ${m.slot.charAt(0).toUpperCase()}`,
    sistolica: m.pressioneMax,
    diastolica: m.pressioneMin,
    bpm: m.bpm,
    data: m.dataRilevazione,
    slot: m.slot,
  }));

  const distributionData = [
    { fascia: "Mattina", avgMax: slotAverages.mattina.avgMax, avgMin: slotAverages.mattina.avgMin },
    { fascia: "Pomeriggio", avgMax: slotAverages.pomeriggio.avgMax, avgMin: slotAverages.pomeriggio.avgMin },
    { fascia: "Sera", avgMax: slotAverages.sera.avgMax, avgMin: slotAverages.sera.avgMin },
  ];

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/medico/pazienti"
          className="inline-flex items-center gap-2 text-xs font-bold text-secondary hover:text-primary transition-colors"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Torna all&apos;Elenco Pazienti
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCredenzialiOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-xs font-bold text-on-surface flex items-center gap-1.5 shadow-sm"
          >
            <span className="material-symbols-outlined text-sm">badge</span>
            Scheda Credenziali
          </button>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-on-primary text-xs font-bold flex items-center gap-1.5 shadow-sm"
          >
            <span className="material-symbols-outlined text-sm">print</span>
            Stampa Report PDF
          </button>
        </div>
      </div>

      {/* Patient Header Profile */}
      <div className="bg-surface-container-lowest p-6 rounded-3xl border border-surface-variant/50 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-primary-container/30 text-primary flex items-center justify-center font-headline font-bold text-2xl">
            {paziente.nome.charAt(0)}{paziente.cognome.charAt(0)}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-headline font-bold text-on-surface">
                {paziente.cognome} {paziente.nome}
              </h1>
              {activeCiclo && (
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-primary-container/40 text-primary">
                  Ciclo {activeCiclo.stato}
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs text-on-surface-variant">
              <span>CF: <strong className="font-mono text-on-surface">{paziente.codiceFiscale}</strong></span>
              <span>Nascita: <strong className="text-on-surface">{paziente.dataNascita}</strong></span>
              <span>Tel: <strong className="text-on-surface">{paziente.telefono}</strong></span>
            </div>
          </div>
        </div>

        {/* Reference Arm and Cycle Control */}
        <div className="flex flex-wrap items-center gap-3">
          {activeCiclo?.braccioRiferimento && (
            <div className="flex items-center gap-2 bg-primary-container/25 px-4 py-2 rounded-2xl border border-primary/20">
              <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                pan_tool
              </span>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-secondary uppercase">Braccio di Riferimento</span>
                <span className="text-xs font-extrabold text-primary">
                  {activeCiclo.braccioRiferimento === "DX" ? "DESTRO (DX)" : "SINISTRO (SX)"}
                </span>
              </div>
            </div>
          )}

          {activeCiclo ? (
            <button
              onClick={() => setIsGestioneCicloOpen(true)}
              className="px-4 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-xs font-bold text-on-surface flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm">tune</span>
              Gestisci Ciclo
            </button>
          ) : (
            <button
              onClick={() => setIsCicloModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold flex items-center gap-1.5 shadow-sm"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              Avvia Nuovo Ciclo
            </button>
          )}
        </div>
      </div>

      {/* Clinical Metrics Summary (4 Cards) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface-container-lowest p-5 rounded-3xl border border-surface-variant/50 shadow-sm">
          <span className="text-[11px] font-bold text-secondary uppercase tracking-wider block">
            Media Sistolica (MAX)
          </span>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-3xl font-headline font-bold text-on-surface">
              {averages.avgMax || "—"}
            </span>
            <span className="text-xs text-secondary font-semibold">mmHg</span>
          </div>
          <span className="text-[11px] text-on-surface-variant block mt-1">
            Target ESC: &lt;140 mmHg
          </span>
        </div>

        <div className="bg-surface-container-lowest p-5 rounded-3xl border border-surface-variant/50 shadow-sm">
          <span className="text-[11px] font-bold text-secondary uppercase tracking-wider block">
            Media Diastolica (MIN)
          </span>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-3xl font-headline font-bold text-on-surface">
              {averages.avgMin || "—"}
            </span>
            <span className="text-xs text-secondary font-semibold">mmHg</span>
          </div>
          <span className="text-[11px] text-on-surface-variant block mt-1">
            Target ESC: &lt;90 mmHg
          </span>
        </div>

        <div className="bg-surface-container-lowest p-5 rounded-3xl border border-surface-variant/50 shadow-sm">
          <span className="text-[11px] font-bold text-secondary uppercase tracking-wider block">
            Frequenza Media
          </span>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-3xl font-headline font-bold text-on-surface">
              {averages.avgBpm || "—"}
            </span>
            <span className="text-xs text-secondary font-semibold">BPM</span>
          </div>
          <span className="text-[11px] text-on-surface-variant block mt-1">
            Ritmo cardiaco medio
          </span>
        </div>

        <div className="bg-surface-container-lowest p-5 rounded-3xl border border-surface-variant/50 shadow-sm">
          <span className="text-[11px] font-bold text-secondary uppercase tracking-wider block">
            A Target Clinico
          </span>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-3xl font-headline font-bold text-primary">
              {averages.targetRate}%
            </span>
          </div>
          <span className="text-[11px] text-on-surface-variant block mt-1">
            {averages.totalCount} misurazioni effettuate
          </span>
        </div>
      </div>

      {/* Clinical Charts */}
      {misurazioni.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-surface-container-lowest p-6 rounded-3xl border border-surface-variant/50 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-headline font-bold text-on-surface">
                  Andamento Pressorio del Ciclo
                </h2>
                <p className="text-xs text-on-surface-variant">
                  Evoluzione di Sistolica e Diastolica con linee di riferimento clinico (140/90 mmHg).
                </p>
              </div>
            </div>

            <div className="h-72 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e4e0d8" vertical={false} />
                  <XAxis dataKey="label" stroke="#74796e" fontSize={11} tickLine={false} />
                  <YAxis stroke="#74796e" fontSize={11} domain={[60, 170]} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      borderRadius: "12px",
                      border: "1px solid #c4c8bc",
                      fontSize: "12px",
                    }}
                  />
                  <ReferenceLine y={140} stroke="#b83230" strokeDasharray="4 4" label={{ value: "Limite Max 140", fill: "#b83230", fontSize: 10, position: "insideTopRight" }} />
                  <ReferenceLine y={90} stroke="#b83230" strokeDasharray="4 4" label={{ value: "Limite Min 90", fill: "#b83230", fontSize: 10, position: "insideBottomRight" }} />
                  <Line type="monotone" dataKey="sistolica" stroke="#4a7c59" strokeWidth={3} dot={{ r: 3, fill: "#4a7c59" }} name="Sistolica (MAX)" />
                  <Line type="monotone" dataKey="diastolica" stroke="#705c30" strokeWidth={3} dot={{ r: 3, fill: "#705c30" }} name="Diastolica (MIN)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-surface-container-lowest p-6 rounded-3xl border border-surface-variant/50 shadow-sm space-y-4">
            <div>
              <h2 className="text-lg font-headline font-bold text-on-surface">
                Medie per Fascia Oraria
              </h2>
              <p className="text-xs text-on-surface-variant">
                Confronto tra Mattina, Pomeriggio e Sera.
              </p>
            </div>

            <div className="h-72 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={distributionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e4e0d8" vertical={false} />
                  <XAxis dataKey="fascia" stroke="#74796e" fontSize={11} tickLine={false} />
                  <YAxis stroke="#74796e" fontSize={11} domain={[60, 160]} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      borderRadius: "12px",
                      border: "1px solid #c4c8bc",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="avgMax" fill="#4a7c59" name="Media Max" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="avgMin" fill="#c4a66a" name="Media Min" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Therapy Notes Section */}
      <div className="bg-surface-container-lowest p-6 rounded-3xl border border-surface-variant/50 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-headline font-bold text-on-surface">
              Note di Terapia & Indicazioni Cliniche
            </h2>
            <p className="text-xs text-on-surface-variant">
              Gestisci le prescrizioni visibili al paziente e le note private riservate al medico.
            </p>
          </div>
          <button
            onClick={() => setIsNotaModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-on-primary text-xs font-bold flex items-center gap-1.5 shadow-sm"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Aggiungi Nota
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {noteTerapia.length === 0 ? (
            <p className="text-xs text-secondary italic">Nessuna nota clinica ancora registrata.</p>
          ) : (
            noteTerapia.map((n: any) => (
              <div
                key={n.id}
                className={`p-4 rounded-2xl border flex flex-col justify-between space-y-2 ${
                  n.visibilePaziente
                    ? "bg-primary-container/15 border-primary/30"
                    : "bg-secondary-container/40 border-tertiary/30"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                      n.visibilePaziente
                        ? "bg-primary text-on-primary"
                        : "bg-tertiary text-on-tertiary"
                    }`}
                  >
                    <span className="material-symbols-outlined text-xs">
                      {n.visibilePaziente ? "visibility" : "lock"}
                    </span>
                    {n.visibilePaziente ? "Visibile al Paziente" : "Nota Privata Medico"}
                  </span>
                  <span className="text-[10px] text-secondary">
                    {new Date(n.createdAt).toLocaleDateString("it-IT")}
                  </span>
                </div>
                <p className="text-xs font-medium text-on-surface leading-relaxed">
                  {n.testo}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Measurement History Table */}
      <div className="bg-surface-container-lowest p-6 rounded-3xl border border-surface-variant/50 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-headline font-bold text-on-surface">
              Diario delle Misurazioni Quotidiane
            </h2>
            <p className="text-xs text-on-surface-variant">
              Cronologia completa di tutte le rilevazioni inserite dal paziente.
            </p>
          </div>
          <span className="text-xs font-bold text-secondary">
            {misurazioni.length} rilevazioni registrate
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-surface-variant/40 text-[11px] font-bold text-secondary uppercase tracking-wider">
                <th className="pb-3 px-3">Giorno</th>
                <th className="pb-3 px-3">Data & Ora</th>
                <th className="pb-3 px-3">Slot</th>
                <th className="pb-3 px-3">Braccio</th>
                <th className="pb-3 px-3">Pressione (MAX/MIN)</th>
                <th className="pb-3 px-3">BPM</th>
                <th className="pb-3 px-3">Classificazione ESC</th>
                <th className="pb-3 px-3">Note Paziente</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-variant/20">
              {misurazioni.map((m: any) => {
                const cat = classifyBloodPressure(m.pressioneMax, m.pressioneMin);
                return (
                  <tr key={m.id} className="hover:bg-surface-container-low/60 transition-colors">
                    <td className="py-3.5 px-3 font-bold text-xs text-on-surface">
                      G{m.giornoNumero}
                    </td>
                    <td className="py-3.5 px-3 text-xs text-on-surface-variant">
                      {m.dataRilevazione} • {m.oraRilevazione}
                    </td>
                    <td className="py-3.5 px-3 text-xs capitalize font-semibold text-on-surface">
                      {m.slot}
                    </td>
                    <td className="py-3.5 px-3 text-xs text-on-surface-variant">
                      {m.braccio}
                    </td>
                    <td className="py-3.5 px-3 font-bold text-sm text-on-surface">
                      {m.pressioneMax} / {m.pressioneMin} <span className="text-[11px] font-normal text-secondary">mmHg</span>
                    </td>
                    <td className="py-3.5 px-3 text-xs text-on-surface-variant">
                      {m.bpm ? `${m.bpm} bpm` : "—"}
                    </td>
                    <td className="py-3.5 px-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] inline-block ${cat.badgeClass}`}>
                        {cat.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-xs text-secondary italic max-w-xs truncate">
                      {m.note || "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <NuovaNotaModal
        isOpen={isNotaModalOpen}
        onClose={() => setIsNotaModalOpen(false)}
        onSuccess={loadData}
        pazienteId={paziente.id}
        medicoId="med-1"
      />

      <NuovoCicloModal
        isOpen={isCicloModalOpen}
        onClose={() => setIsCicloModalOpen(false)}
        onSuccess={loadData}
        pazienteId={paziente.id}
        medicoId="med-1"
      />

      {activeCiclo && (
        <GestioneCicloModal
          isOpen={isGestioneCicloOpen}
          onClose={() => setIsGestioneCicloOpen(false)}
          onSuccess={loadData}
          cicloId={activeCiclo.id}
          currentStato={activeCiclo.stato}
        />
      )}

      <SchedaCredenzialiModal
        isOpen={isCredenzialiOpen}
        onClose={() => setIsCredenzialiOpen(false)}
        paziente={paziente}
      />
    </div>
  );
}
