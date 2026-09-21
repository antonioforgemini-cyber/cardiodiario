"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { getDoctorDashboardData } from "@/db/actions";
import { NuovoPazienteModal } from "@/components/modals/NuovoPazienteModal";
import { SchedaCredenzialiModal } from "@/components/modals/SchedaCredenzialiModal";

export default function PazientiListPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isNewPatientOpen, setIsNewPatientOpen] = useState(false);
  const [selectedForCredenziali, setSelectedForCredenziali] = useState<any>(null);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-secondary">Caricamento anagrafica pazienti...</p>
        </div>
      </div>
    );
  }

  const { pazienti } = data;

  const filteredPatients = pazienti.filter((p: any) => {
    const matchesSearch =
      `${p.nome} ${p.cognome} ${p.codiceFiscale}`.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || p.cicloStato === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-surface-variant/40 pb-6">
        <div>
          <span className="text-xs font-bold text-primary tracking-wider uppercase">
            Anagrafica Pazienti • CardioDiario
          </span>
          <h1 className="text-3xl font-headline font-bold text-on-surface tracking-tight mt-1">
            Gestione Pazienti dello Studio
          </h1>
          <p className="text-sm text-on-surface-variant">
            Censimento, rilascio credenziali e accesso immediato ai diari clinici.
          </p>
        </div>

        <button
          onClick={() => setIsNewPatientOpen(true)}
          className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-on-primary text-sm font-bold shadow-sm flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-xl">person_add</span>
          <span>Nuovo Paziente</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-container-lowest p-4 rounded-2xl border border-surface-variant/50">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Cerca per cognome, nome o codice fiscale..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 pl-10 pr-4 bg-surface-container-low rounded-xl text-xs font-medium border border-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">
            search
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-secondary uppercase">Stato:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-11 pl-3.5 pr-9 bg-surface-container-low rounded-xl text-xs font-semibold text-on-surface border border-surface-variant/40 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
          >
            <option value="all">Tutti i pazienti ({pazienti.length})</option>
            <option value="in corso">Ciclo In Corso</option>
            <option value="da iniziare">Ciclo Da Iniziare</option>
            <option value="in pausa">Ciclo In Pausa</option>
          </select>
        </div>
      </div>

      {/* Patient Cards Grid or Empty State */}
      {filteredPatients.length === 0 ? (
        <div className="bg-surface-container-lowest p-12 rounded-3xl border border-surface-variant/50 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-surface-container flex items-center justify-center text-outline mx-auto">
            <span className="material-symbols-outlined text-3xl">group_off</span>
          </div>
          <div>
            <h3 className="font-headline font-bold text-lg text-on-surface">Nessun paziente in archivio</h3>
            <p className="text-xs text-on-surface-variant mt-1">
              Non è ancora stato registrato alcun paziente. Clicca sul pulsante &quot;Nuovo Paziente&quot; in alto per iniziare.
            </p>
          </div>
          <button
            onClick={() => setIsNewPatientOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-bold inline-flex items-center gap-2 shadow-sm hover:bg-primary/90"
          >
            <span className="material-symbols-outlined text-base">person_add</span>
            Registra Primo Paziente
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPatients.map((p: any) => {
            let badgeClass = "bg-surface-container text-on-surface-variant";
          if (p.cicloStato === "in corso") badgeClass = "bg-primary-container/40 text-primary font-bold";
          if (p.cicloStato === "da iniziare") badgeClass = "bg-secondary-container text-tertiary font-bold";
          if (p.cicloStato === "in pausa") badgeClass = "bg-error-container/40 text-error font-bold";

          return (
            <div
              key={p.id}
              className="bg-surface-container-lowest p-6 rounded-3xl border border-surface-variant/50 shadow-sm flex flex-col justify-between hover:border-primary/40 hover:shadow-md transition-all space-y-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-primary-container/30 text-primary flex items-center justify-center font-headline font-bold text-lg">
                    {p.nome.charAt(0)}{p.cognome.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-headline font-bold text-base text-on-surface">
                      {p.cognome} {p.nome}
                    </h3>
                    <p className="text-xs font-mono text-secondary">{p.codiceFiscale}</p>
                  </div>
                </div>

                <span className={`px-2.5 py-1 rounded-full text-[11px] capitalize ${badgeClass}`}>
                  {p.cicloStato}
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-on-surface-variant bg-surface-container-low p-3 rounded-2xl">
                <div className="flex justify-between">
                  <span className="text-secondary">Telefono:</span>
                  <span className="font-semibold text-on-surface">{p.telefono}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary">Braccio Riferimento:</span>
                  <span className="font-semibold text-on-surface">
                    {p.braccioRiferimento ? `Braccio ${p.braccioRiferimento}` : "Da definire"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary">Ultima Rilevazione:</span>
                  <span className="font-bold text-on-surface">
                    {p.ultimoMax && p.ultimoMin ? `${p.ultimoMax}/${p.ultimoMin} mmHg` : "Nessuna"}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-surface-variant/30">
                <button
                  type="button"
                  onClick={() => setSelectedForCredenziali(p)}
                  className="text-xs font-semibold text-secondary hover:text-on-surface flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-base">badge</span>
                  <span>Scheda PIN</span>
                </button>

                <Link
                  href={`/medico/pazienti/${p.id}`}
                  className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-on-primary text-xs font-bold flex items-center gap-1 shadow-sm"
                >
                  <span>Apri Diario</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </Link>
              </div>
            </div>
          );
        })}
      </div>
      )}

      {/* Modals */}
      <NuovoPazienteModal
        isOpen={isNewPatientOpen}
        onClose={() => setIsNewPatientOpen(false)}
        onSuccess={() => {
          setIsNewPatientOpen(false);
          loadData();
        }}
        medicoId="med-1"
      />

      {selectedForCredenziali && (
        <SchedaCredenzialiModal
          isOpen={true}
          onClose={() => setSelectedForCredenziali(null)}
          paziente={{
            nome: selectedForCredenziali.nome,
            cognome: selectedForCredenziali.cognome,
            codiceFiscale: selectedForCredenziali.codiceFiscale,
            pin: "•••••• (Vedi scheda originale o rigenera)",
          }}
        />
      )}
    </div>
  );
}
