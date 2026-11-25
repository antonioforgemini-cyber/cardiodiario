"use client";

import React, { useCallback, useEffect, useState, use } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  ArrowLeft,
  Eye,
  Hand,
  IdCard,
  Lock,
  Plus,
  Printer,
  SlidersHorizontal,
} from "lucide-react";
import { getPazienteDettaglioClinico } from "@/db/actions";
import { StethoscopeLoader } from "@/components/StethoscopeLoader";
import { NuovaNotaModal } from "@/components/modals/NuovaNotaModal";
import { GestioneCicloModal } from "@/components/modals/GestioneCicloModal";
import { SchedaCredenzialiModal } from "@/components/modals/SchedaCredenzialiModal";
import { ReportClinicoModal } from "@/components/modals/ReportClinicoModal";
import { classifyBloodPressure } from "@/lib/guidelines";

const DiarioCharts = dynamic(
  () => import("@/components/charts/DiarioCharts").then((m) => m.DiarioCharts),
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

export default function MedicoDiarioCicloDetailPage({
  params,
}: {
  params: Promise<{ id: string; cicloId: string }>;
}) {
  const resolvedParams = use(params);
  const { id: pazienteId, cicloId } = resolvedParams;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [isNotaModalOpen, setIsNotaModalOpen] = useState(false);
  const [isGestioneCicloOpen, setIsGestioneCicloOpen] = useState(false);
  const [isCredenzialiOpen, setIsCredenzialiOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const res = await getPazienteDettaglioClinico(pazienteId, cicloId);
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [pazienteId, cicloId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <StethoscopeLoader text="Caricamento diario clinico..." />
      </div>
    );
  }

  if (!data || !data.activeCiclo) {
    return (
      <div className="p-4 sm:p-8 text-center space-y-4 max-w-md mx-auto my-12">
        <h1 className="text-xl font-bold text-error">Diario non trovato</h1>
        <Link href={`/medico/pazienti/${pazienteId}`} className="text-primary underline text-sm font-semibold">
          Torna alle Schede Paziente
        </Link>
      </div>
    );
  }

  const {
    paziente,
    activeCiclo,
    misurazioni,
    averages,
    slotAverages,
    noteTerapia,
    medicoNomeCompleto,
  } = data;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Link
          href={`/medico/pazienti/${pazienteId}`}
          className="inline-flex items-center gap-1.5 min-h-[38px] text-xs font-bold text-secondary hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>
            Torna alle Schede Paziente ({paziente.cognome} {paziente.nome})
          </span>
        </Link>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setIsCredenzialiOpen(true)}
            className="flex-1 sm:flex-none justify-center min-h-[44px] px-3.5 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-xs font-bold text-on-surface flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <IdCard className="w-4 h-4" aria-hidden="true" />
            <span>Scheda Credenziali</span>
          </button>
          <button
            type="button"
            onClick={() => setIsReportOpen(true)}
            className="flex-1 sm:flex-none justify-center min-h-[44px] px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-on-primary text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Printer className="w-4 h-4" aria-hidden="true" />
            <span>Stampa Report PDF</span>
          </button>
        </div>
      </div>

      <div className="bg-surface-container-lowest p-5 sm:p-6 rounded-3xl border border-surface-variant/50 shadow-terra flex flex-col md:flex-row md:items-center justify-between gap-5 sm:gap-6">
        <div className="flex items-start sm:items-center gap-4 sm:gap-5">
          <div
            aria-hidden="true"
            className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-primary-container/30 text-primary flex items-center justify-center font-headline font-bold text-xl sm:text-2xl shrink-0"
          >
            {paziente.nome.charAt(0)}
            {paziente.cognome.charAt(0)}
          </div>
          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <h1 className="text-xl sm:text-2xl font-headline font-bold text-on-surface truncate">
                {paziente.cognome} {paziente.nome}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-primary-container/40 text-primary shrink-0">
                Diario {activeCiclo.stato}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-on-surface-variant">
              <span>
                CF: <strong className="font-mono text-on-surface">{paziente.codiceFiscale}</strong>
              </span>
              <span>
                Avvio: <strong className="text-on-surface">{activeCiclo.dataInizio}</strong>
              </span>
              <span>
                Durata: <strong className="text-on-surface">{activeCiclo.durataGiorni} giorni</strong>
              </span>
              <span>
                Tel: <strong className="text-on-surface">{paziente.telefono}</strong>
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-surface-variant/40">
          {activeCiclo.braccioRiferimento && (
            <div className="flex items-center gap-2 bg-primary-container/25 px-3 sm:px-4 py-1.5 sm:py-2 rounded-2xl border border-primary/20">
              <Hand className="w-5 h-5 text-primary shrink-0" aria-hidden="true" />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-secondary uppercase">
                  Braccio di Riferimento
                </span>
                <span className="text-xs font-extrabold text-primary">
                  {activeCiclo.braccioRiferimento === "DX" ? "DESTRO (DX)" : "SINISTRO (SX)"}
                </span>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsGestioneCicloOpen(true)}
            className="min-h-[42px] px-3.5 sm:px-4 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-xs font-bold text-on-surface flex items-center gap-1.5 transition-colors"
          >
            <SlidersHorizontal className="w-4 h-4" aria-hidden="true" />
            <span>Gestisci Diario</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface-container-lowest p-5 rounded-3xl border border-surface-variant/50 shadow-terra">
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

        <div className="bg-surface-container-lowest p-5 rounded-3xl border border-surface-variant/50 shadow-terra">
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

        <div className="bg-surface-container-lowest p-5 rounded-3xl border border-surface-variant/50 shadow-terra">
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

        <div className="bg-surface-container-lowest p-5 rounded-3xl border border-surface-variant/50 shadow-terra">
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

      {misurazioni.length > 0 && (
        <DiarioCharts chartData={chartData} distributionData={distributionData} />
      )}

      <section
        aria-labelledby="therapy-notes-heading"
        className="bg-surface-container-lowest p-6 rounded-3xl border border-surface-variant/50 shadow-terra space-y-4"
      >
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 id="therapy-notes-heading" className="text-lg font-headline font-bold text-on-surface">
              Note di Terapia &amp; Indicazioni Cliniche
            </h2>
            <p className="text-xs text-on-surface-variant">
              Gestisci le prescrizioni visibili al paziente e le note private riservate al medico.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsNotaModalOpen(true)}
            className="min-h-[42px] px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-on-primary text-xs font-bold flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span>Aggiungi Nota</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {noteTerapia.length === 0 ? (
            <p className="text-xs text-secondary italic">Nessuna nota clinica ancora registrata.</p>
          ) : (
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            noteTerapia.map((n: any) => (
              <div
                key={n.id}
                className={`p-4 rounded-2xl border flex flex-col justify-between space-y-2 ${
                  n.visibilePaziente
                    ? "bg-primary-container/15 border-primary/30"
                    : "bg-secondary-container/40 border-tertiary/30"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                      n.visibilePaziente
                        ? "bg-primary text-on-primary"
                        : "bg-tertiary text-on-tertiary"
                    }`}
                  >
                    {n.visibilePaziente ? (
                      <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                    ) : (
                      <Lock className="w-3.5 h-3.5" aria-hidden="true" />
                    )}
                    <span>{n.visibilePaziente ? "Visibile al Paziente" : "Nota Privata Medico"}</span>
                  </span>
                  <span className="text-[11px] text-secondary">
                    {new Date(n.createdAt).toLocaleDateString("it-IT")}
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-medium text-on-surface leading-relaxed">
                  {n.testo}
                </p>
              </div>
            ))
          )}
        </div>
      </section>

      <section
        aria-labelledby="diario-table-title"
        className="bg-surface-container-lowest p-5 sm:p-6 rounded-3xl border border-surface-variant/50 shadow-terra space-y-4"
      >
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <h2 id="diario-table-title" className="text-lg font-headline font-bold text-on-surface">
              Diario delle Misurazioni Quotidiane
            </h2>
            <p className="text-xs text-on-surface-variant">
              Cronologia completa di tutte le rilevazioni inserite dal paziente in questo diario.
            </p>
          </div>
          <span className="text-xs font-bold text-secondary">
            {misurazioni.length} rilevazioni registrate
          </span>
        </div>

        <div tabIndex={0} role="region" aria-labelledby="diario-table-title" className="responsive-table-wrapper">
          <table className="w-full text-left text-sm">
            <caption className="visually-hidden">
              Cronologia delle misurazioni giornaliere del ciclo
            </caption>
            <thead>
              <tr className="border-b border-surface-variant/40 text-[11px] font-bold text-secondary uppercase tracking-wider">
                <th scope="col" className="pb-3 px-3">Giorno</th>
                <th scope="col" className="pb-3 px-3">Data &amp; Ora</th>
                <th scope="col" className="pb-3 px-3">Slot</th>
                <th scope="col" className="pb-3 px-3">Braccio</th>
                <th scope="col" className="pb-3 px-3">Pressione (MAX/MIN)</th>
                <th scope="col" className="pb-3 px-3">BPM</th>
                <th scope="col" className="pb-3 px-3">Classificazione ESC</th>
                <th scope="col" className="pb-3 px-3">Note Paziente</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-variant/20">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {misurazioni.map((m: any) => {
                const cat = classifyBloodPressure(m.pressioneMax, m.pressioneMin);
                return (
                  <tr key={m.id} className="hover:bg-surface-container-low/60 transition-colors">
                    <th scope="row" className="py-3.5 px-3 font-bold text-xs text-on-surface text-left">
                      G{m.giornoNumero}
                    </th>
                    <td data-label="Data e Ora" className="py-3.5 px-3 text-xs text-on-surface-variant">
                      {m.dataRilevazione} • {m.oraRilevazione}
                    </td>
                    <td data-label="Slot" className="py-3.5 px-3 text-xs capitalize font-semibold text-on-surface">
                      {m.slot}
                    </td>
                    <td data-label="Braccio" className="py-3.5 px-3 text-xs text-on-surface-variant">
                      {m.braccio}
                    </td>
                    <td data-label="Pressione" className="py-3.5 px-3 font-bold text-sm text-on-surface">
                      {m.pressioneMax} / {m.pressioneMin}{" "}
                      <span className="text-[11px] font-normal text-secondary">mmHg</span>
                    </td>
                    <td data-label="BPM" className="py-3.5 px-3 text-xs text-on-surface-variant">
                      {m.bpm ? `${m.bpm} bpm` : "—"}
                    </td>
                    <td data-label="Valutazione ESC" className="py-3.5 px-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] inline-block ${cat.badgeClass}`}>
                        {cat.category}
                      </span>
                    </td>
                    <td data-label="Note Paziente" className="py-3.5 px-3 text-xs text-secondary italic max-w-xs truncate">
                      {m.note || "—"}
                    </td>
                  </tr>
                );
              })}
              {misurazioni.length === 0 && (
                <tr className="responsive-empty-row">
                  <td colSpan={8} className="py-8 text-center text-xs text-secondary italic">
                    Nessuna misurazione ancora registrata per questo diario.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <NuovaNotaModal
        isOpen={isNotaModalOpen}
        onClose={() => setIsNotaModalOpen(false)}
        onSuccess={() => void loadData()}
        pazienteId={paziente.id}
        medicoId="med-1"
      />

      <GestioneCicloModal
        isOpen={isGestioneCicloOpen}
        onClose={() => setIsGestioneCicloOpen(false)}
        onSuccess={() => void loadData()}
        cicloId={activeCiclo.id}
        currentStato={activeCiclo.stato}
      />

      <SchedaCredenzialiModal
        isOpen={isCredenzialiOpen}
        onClose={() => setIsCredenzialiOpen(false)}
        medicoNome={medicoNomeCompleto}
        paziente={paziente}
      />

      <ReportClinicoModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        paziente={paziente}
        ciclo={activeCiclo}
        misurazioni={misurazioni}
        averages={averages}
        noteTerapia={noteTerapia}
        medicoNome={medicoNomeCompleto || "Dott.ssa Ivana Pariggiano"}
      />
    </div>
  );
}
