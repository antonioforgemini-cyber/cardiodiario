"use client";

import React, { useEffect, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { Logo } from "@/components/Logo";

interface Misurazione {
  id: string;
  giornoNumero: number;
  slot: string;
  dataRilevazione: string;
  oraRilevazione: string;
  braccio: string;
  pressioneMax: number;
  pressioneMin: number;
  bpm: number | null;
  note: string | null;
  isCritica?: boolean;
}

interface NoteTerapia {
  id: string;
  testo: string;
  visibilePaziente: boolean;
  createdAt: string;
}

interface ReportClinicoModalProps {
  isOpen: boolean;
  onClose: () => void;
  paziente: {
    id: string;
    nome: string;
    cognome: string;
    codiceFiscale: string;
    dataNascita?: string;
    telefono?: string;
  };
  ciclo: {
    id: string;
    stato: string;
    durataSettimane: number;
    braccioRiferimento?: string | null;
    dataInizioEffettiva?: string | null;
    dataFinePrevista?: string | null;
    dataCreazione?: string;
  } | null;
  misurazioni: Misurazione[];
  averages: {
    avgMax: number;
    avgMin: number;
    avgBpm: number;
    targetRate: number;
    totalCount: number;
  };
  noteTerapia?: NoteTerapia[];
  medicoNome?: string;
}

export const ReportClinicoModal: React.FC<ReportClinicoModalProps> = ({
  isOpen,
  onClose,
  paziente,
  ciclo,
  misurazioni = [],
  averages,
  noteTerapia = [],
  medicoNome = "Dott. Valerio Marchi",
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Filter ONLY notes visible to the patient (strictly exclude private doctor notes)
  const patientVisibleNotes = useMemo(() => {
    return (noteTerapia || []).filter((n) => n.visibilePaziente);
  }, [noteTerapia]);

  // Classification helper (ESC/ESH Guidelines)
  const getEscCategory = (max: number, min: number) => {
    if (max < 120 && min < 80) return { label: "Ottimale", bg: "bg-emerald-100 text-emerald-800", color: "#10b981" };
    if (max <= 129 && min <= 84) return { label: "Normale", bg: "bg-green-100 text-green-800", color: "#22c55e" };
    if (max <= 139 || min <= 89) return { label: "Normale-Alta", bg: "bg-amber-100 text-amber-800", color: "#f59e0b" };
    if (max <= 159 || min <= 99) return { label: "Ipertensione Grado 1", bg: "bg-orange-100 text-orange-800", color: "#f97316" };
    return { label: "Ipertensione Grado 2", bg: "bg-red-100 text-red-800", color: "#ef4444" };
  };

  // Global classification from averages
  const globalEsc = getEscCategory(averages.avgMax || 120, averages.avgMin || 80);

  // Today formatted
  const todayFormatted = new Intl.DateTimeFormat("it-IT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  // Print handler
  const handlePrint = () => {
    document.body.classList.add("printing-report");
    window.print();
  };

  // Setup print lifecycle listeners
  useEffect(() => {
    if (!isOpen) return;

    const beforePrint = () => {
      document.body.classList.add("printing-report");
    };
    const afterPrint = () => {
      document.body.classList.remove("printing-report");
    };

    window.addEventListener("beforeprint", beforePrint);
    window.addEventListener("afterprint", afterPrint);

    return () => {
      window.removeEventListener("beforeprint", beforePrint);
      window.removeEventListener("afterprint", afterPrint);
      document.body.classList.remove("printing-report");
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  // SVG Chart Geometry calculation for printable vector chart
  const svgWidth = 720;
  const svgHeight = 170;
  const paddingX = 40;
  const paddingY = 25;
  const chartW = svgWidth - paddingX * 2;
  const chartH = svgHeight - paddingY * 2;

  const minY = 50;
  const maxY = 180;
  const getY = (val: number) => {
    const clamped = Math.max(minY, Math.min(maxY, val));
    return paddingY + chartH - ((clamped - minY) / (maxY - minY)) * chartH;
  };

  // Points for SVG path
  const numPoints = misurazioni.length;
  const getX = (idx: number) => {
    if (numPoints <= 1) return paddingX + chartW / 2;
    return paddingX + (idx / (numPoints - 1)) * chartW;
  };

  const maxPoints = misurazioni.map((m, idx) => ({
    x: getX(idx),
    y: getY(m.pressioneMax),
    val: m.pressioneMax,
    label: `G${m.giornoNumero} ${m.slot.charAt(0).toUpperCase()}`,
  }));

  const minPoints = misurazioni.map((m, idx) => ({
    x: getX(idx),
    y: getY(m.pressioneMin),
    val: m.pressioneMin,
  }));

  const maxPath = maxPoints.length > 0
    ? maxPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ")
    : "";

  const minPath = minPoints.length > 0
    ? minPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ")
    : "";

  const reportContent = (
    <div
      id="report-modal-portal"
      className="fixed inset-0 z-[9999] flex flex-col bg-slate-900/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
    >
      {/* Top Floating Toolbar (Hidden during actual print) */}
      <div className="sticky top-0 z-50 w-full bg-surface-container-lowest/95 backdrop-blur border-b border-surface-variant/40 px-6 py-3.5 shadow-md flex items-center justify-between no-print">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">description</span>
          </div>
          <div>
            <h2 className="text-sm font-bold text-on-surface">Anteprima Referto Clinico A4</h2>
            <p className="text-[11px] text-on-surface-variant">
              Pronto per la stampa cartacea o il salvataggio in PDF (Formato A4)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-secondary hover:bg-surface-container-high transition-colors"
          >
            Chiudi Anteprima
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-on-primary text-xs font-bold flex items-center gap-2 shadow-sm transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-base">print</span>
            Stampa / Salva in PDF
          </button>
        </div>
      </div>

      {/* Main Preview Container */}
      <div className="flex-1 py-8 px-4 flex justify-center items-start">
        {/* The Printable A4 Sheet */}
        <div
          id="printable-report"
          className="printable-sheet w-full max-w-[820px] bg-white text-slate-900 p-10 md:p-12 shadow-2xl rounded-2xl border border-slate-200 transition-all font-sans"
        >
          {/* 1. Official Header */}
          <div className="flex items-start justify-between border-b-2 border-primary/30 pb-5 mb-6">
            <div className="space-y-1">
              <Logo size={42} showText={true} subtitle="Monitoraggio Pressorio Domiciliare (HBPM)" />
              <p className="text-[11px] text-slate-500 font-medium pt-1">
                Studio Medico Specialistico • Dipartimento di Cardiologia Clinica
              </p>
            </div>
            <div className="text-right text-xs text-slate-600 space-y-0.5">
              <p className="font-bold text-slate-900 text-sm">{medicoNome}</p>
              <p className="text-[11px]">Specialista in Cardiologia ed Ipertensione</p>
              <p className="text-[11px] pt-1">
                <span className="text-slate-400">Data emissione:</span> <strong>{todayFormatted}</strong>
              </p>
              <p className="text-[10px] font-mono text-slate-400">
                REF-{paziente.codiceFiscale.slice(0, 6)}-{ciclo ? ciclo.id.slice(-4).toUpperCase() : "001"}
              </p>
            </div>
          </div>

          {/* 2. Patient Profile & Protocol Bar */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs page-break-avoid">
            <div className="space-y-1.5 border-b md:border-b-0 md:border-r border-slate-200 pb-3 md:pb-0 md:pr-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Dati Identificativi Paziente
              </span>
              <div className="flex items-baseline gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  {paziente.cognome} {paziente.nome}
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1 text-slate-600">
                <p>Codice Fiscale: <strong className="font-mono text-slate-800">{paziente.codiceFiscale}</strong></p>
                <p>Data di Nascita: <strong className="text-slate-800">{paziente.dataNascita || "N/D"}</strong></p>
                {paziente.telefono && <p>Recapito: <strong className="text-slate-800">{paziente.telefono}</strong></p>}
              </div>
            </div>

            <div className="space-y-1.5 md:pl-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Parametri di Protocollo HBPM
              </span>
              <div className="flex items-center gap-2">
                <span className="text-slate-700 font-medium">Braccio Ufficiale:</span>
                <span className="px-2.5 py-0.5 rounded-md bg-primary/15 text-primary font-bold text-xs">
                  {ciclo?.braccioRiferimento === "SX" ? "SINISTRO (SX)" : "DESTRO (DX)"}
                </span>
                <span className="text-[10px] text-slate-500 italic">(Calibrazione iniziale)</span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1 text-slate-600">
                <p>
                  Inizio Ciclo: <strong className="text-slate-800">{ciclo?.dataInizioEffettiva || ciclo?.dataCreazione || "N/D"}</strong>
                </p>
                <p>
                  Durata: <strong className="text-slate-800">{ciclo?.durataSettimane ? `${ciclo.durataSettimane} Settimane (${ciclo.durataSettimane * 7} giorni)` : "14 giorni"}</strong>
                </p>
                <p>
                  Stato Ciclo: <strong className="text-slate-800 capitalize">{ciclo?.stato || "Attivo"}</strong>
                </p>
                <p>
                  Misurazioni Totali: <strong className="text-slate-800">{averages.totalCount}</strong>
                </p>
              </div>
            </div>
          </div>

          {/* 3. Clinical Metrics Summary (ESC/ESH 2026) */}
          <div className="mb-6 page-break-avoid">
            <div className="flex items-center justify-between mb-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Quadro Clinico di Sintesi (Medie del Ciclo)
              </h4>
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${globalEsc.bg}`}>
                Classificazione: {globalEsc.label}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-3 text-center">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <p className="text-[10px] font-semibold text-slate-500 uppercase">Sistolica Media (MAX)</p>
                <p className="text-2xl font-bold text-slate-900 mt-0.5">{averages.avgMax} <span className="text-xs font-normal text-slate-500">mmHg</span></p>
                <p className="text-[10px] text-slate-400 mt-0.5">Target: &lt; 140 mmHg</p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <p className="text-[10px] font-semibold text-slate-500 uppercase">Diastolica Media (MIN)</p>
                <p className="text-2xl font-bold text-slate-900 mt-0.5">{averages.avgMin} <span className="text-xs font-normal text-slate-500">mmHg</span></p>
                <p className="text-[10px] text-slate-400 mt-0.5">Target: &lt; 90 mmHg</p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <p className="text-[10px] font-semibold text-slate-500 uppercase">Frequenza Media</p>
                <p className="text-2xl font-bold text-slate-900 mt-0.5">{averages.avgBpm} <span className="text-xs font-normal text-slate-500">BPM</span></p>
                <p className="text-[10px] text-slate-400 mt-0.5">Ritmo medio a riposo</p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <p className="text-[10px] font-semibold text-slate-500 uppercase">Controllo Pressorio</p>
                <p className="text-2xl font-bold text-primary mt-0.5">{averages.targetRate}%</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Misurazioni a Target</p>
              </div>
            </div>
          </div>

          {/* 4. Vector SVG Chart for Pristine Crisp Printing */}
          {misurazioni.length > 0 && (
            <div className="mb-6 bg-slate-50 border border-slate-200 rounded-xl p-4 page-break-avoid">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-slate-700">
                  Andamento Pressorio Temporale (Sistolica &amp; Diastolica)
                </h4>
                <div className="flex items-center gap-4 text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-1.5 rounded-full bg-emerald-600"></span>
                    <span className="text-slate-600 font-medium">Sistolica (MAX)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-1.5 rounded-full bg-amber-600"></span>
                    <span className="text-slate-600 font-medium">Diastolica (MIN)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 border-t border-dashed border-red-400"></span>
                    <span className="text-[10px] text-red-600 font-medium">Soglia 140/90</span>
                  </div>
                </div>
              </div>

              {/* Vector SVG */}
              <div className="w-full overflow-hidden">
                <svg
                  viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                  className="w-full h-auto"
                  style={{ maxHeight: "170px" }}
                >
                  {/* Grid Lines */}
                  {[60, 90, 120, 140, 160].map((val) => {
                    const y = getY(val);
                    return (
                      <g key={val}>
                        <line
                          x1={paddingX}
                          y1={y}
                          x2={svgWidth - paddingX}
                          y2={y}
                          stroke={val === 140 || val === 90 ? "#ef4444" : "#e2e8f0"}
                          strokeWidth={val === 140 || val === 90 ? "1.5" : "1"}
                          strokeDasharray={val === 140 || val === 90 ? "4 3" : undefined}
                        />
                        <text
                          x={paddingX - 6}
                          y={y + 3}
                          fontSize="9"
                          fill={val === 140 || val === 90 ? "#dc2626" : "#94a3b8"}
                          textAnchor="end"
                          fontWeight={val === 140 || val === 90 ? "bold" : "normal"}
                        >
                          {val}
                        </text>
                      </g>
                    );
                  })}

                  {/* Diastolic Path */}
                  {minPath && (
                    <path
                      d={minPath}
                      fill="none"
                      stroke="#d97706"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}

                  {/* Systolic Path */}
                  {maxPath && (
                    <path
                      d={maxPath}
                      fill="none"
                      stroke="#059669"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}

                  {/* Data Points */}
                  {maxPoints.map((p, i) => (
                    <circle key={`max-${i}`} cx={p.x} cy={p.y} r="3.5" fill="#059669" stroke="#ffffff" strokeWidth="1.5" />
                  ))}
                  {minPoints.map((p, i) => (
                    <circle key={`min-${i}`} cx={p.x} cy={p.y} r="3.5" fill="#d97706" stroke="#ffffff" strokeWidth="1.5" />
                  ))}

                  {/* X Axis Labels */}
                  {maxPoints.map((p, i) => {
                    // Show a label every few points to avoid crowding
                    const step = Math.ceil(numPoints / 12);
                    if (i % step !== 0 && i !== numPoints - 1) return null;
                    return (
                      <text
                        key={`lbl-${i}`}
                        x={p.x}
                        y={svgHeight - 6}
                        fontSize="9"
                        fill="#64748b"
                        textAnchor="middle"
                        fontWeight="500"
                      >
                        {p.label}
                      </text>
                    );
                  })}
                </svg>
              </div>
            </div>
          )}

          {/* 5. Full Measurements Log Table */}
          <div className="mb-6">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
              Diario Cronologico Completo delle Misurazioni
            </h4>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 text-[11px] font-bold">
                    <th className="py-2 px-3 text-center w-12">Giorno</th>
                    <th className="py-2 px-3">Data e Ora</th>
                    <th className="py-2 px-3">Slot</th>
                    <th className="py-2 px-3 text-center">MAX / MIN (mmHg)</th>
                    <th className="py-2 px-3 text-center">BPM</th>
                    <th className="py-2 px-3">Valutazione ESC/ESH</th>
                    <th className="py-2 px-3">Note Paziente</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {misurazioni.map((m, idx) => {
                    const esc = getEscCategory(m.pressioneMax, m.pressioneMin);
                    const slotLabel =
                      m.slot === "mattina" ? "Mattina (ore 11)" :
                      m.slot === "pomeriggio" ? "Pomeriggio (ore 16)" : "Sera (ore 22)";

                    return (
                      <tr
                        key={m.id || idx}
                        className={`page-break-avoid ${idx % 2 === 0 ? "bg-white" : "bg-slate-50/60"}`}
                      >
                        <td className="py-1.5 px-3 text-center font-bold text-slate-800">
                          G{m.giornoNumero}
                        </td>
                        <td className="py-1.5 px-3 text-slate-600 font-mono text-[11px]">
                          {m.dataRilevazione} • {m.oraRilevazione}
                        </td>
                        <td className="py-1.5 px-3 text-slate-700 capitalize font-medium">
                          {slotLabel}
                        </td>
                        <td className="py-1.5 px-3 text-center font-bold font-mono text-slate-900">
                          <span className={m.pressioneMax >= 140 ? "text-red-700 font-extrabold" : ""}>{m.pressioneMax}</span>
                          <span className="text-slate-400 mx-1">/</span>
                          <span className={m.pressioneMin >= 90 ? "text-amber-700 font-extrabold" : ""}>{m.pressioneMin}</span>
                        </td>
                        <td className="py-1.5 px-3 text-center text-slate-600 font-mono">
                          {m.bpm ? `${m.bpm} bpm` : "—"}
                        </td>
                        <td className="py-1.5 px-3">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${esc.bg}`}>
                            {esc.label}
                          </span>
                        </td>
                        <td className="py-1.5 px-3 text-slate-500 text-[11px] italic max-w-[140px] truncate">
                          {m.note || "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* 6. Medical Prescriptions & Patient-Facing Notes ONLY */}
          <div className="mb-8 border border-slate-200 rounded-xl p-4 bg-slate-50 page-break-avoid">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-primary">clinical_notes</span>
              Indicazioni di Terapia e Prescrizioni del Medico
            </h4>

            {patientVisibleNotes.length > 0 ? (
              <ul className="space-y-2 text-xs text-slate-800 divide-y divide-slate-200/60">
                {patientVisibleNotes.map((n, i) => (
                  <li key={n.id || i} className="pt-2 first:pt-0">
                    <p className="font-semibold text-slate-900">{n.testo}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Prescritto in data: {new Date(n.createdAt).toLocaleDateString("it-IT")}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-500 italic">
                Nessuna prescrizione o variazione terapeutica annotata per questo ciclo. Continuare la terapia domiciliare abituale.
              </p>
            )}
          </div>

          {/* 7. Footer: Doctor Stamp, Signature & Legal Disclaimer */}
          <div className="pt-4 border-t border-slate-200 flex items-end justify-between page-break-avoid text-xs">
            <div className="space-y-1 text-slate-500 text-[10px] max-w-[360px]">
              <p className="font-semibold text-slate-600">CardioDiario Platform • HBPM Report</p>
              <p>
                Documento clinico generato conformemente alle linee guida ESC/ESH per l&apos;automisurazione domiciliare della pressione arteriosa.
              </p>
            </div>

            <div className="text-center space-y-8 pr-4">
              <p className="text-xs text-slate-700 font-semibold">Timbro e Firma del Medico Curante</p>
              <div className="border-b border-slate-400 w-48 mx-auto"></div>
              <p className="text-[11px] text-slate-500">{medicoNome}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(reportContent, document.body);
};
