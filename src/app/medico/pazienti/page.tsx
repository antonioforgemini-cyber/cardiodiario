"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { getDoctorDashboardData, deletePaziente } from "@/db/actions";
import { StethoscopeLoader } from "@/components/StethoscopeLoader";
import { NuovoPazienteModal } from "@/components/modals/NuovoPazienteModal";
import { SchedaCredenzialiModal } from "@/components/modals/SchedaCredenzialiModal";
import { ConfermaEliminazioneModal } from "@/components/modals/ConfermaEliminazioneModal";

export default function PazientiListPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isNewPatientOpen, setIsNewPatientOpen] = useState(false);
  const [selectedForCredenziali, setSelectedForCredenziali] = useState<any>(null);
  const [patientToDelete, setPatientToDelete] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

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

  const handleConfirmDelete = async () => {
    if (!patientToDelete) return;
    setDeleting(true);
    try {
      await deletePaziente(patientToDelete.id);
      setPatientToDelete(null);
      await loadData();
    } catch (err) {
      console.error("Errore durante l'eliminazione del paziente:", err);
      alert("Si è verificato un errore durante l'eliminazione del paziente.");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <StethoscopeLoader text="Caricamento anagrafica pazienti..." />
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
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-variant/40 pb-5 sm:pb-6">
        <div>
          <span className="text-[11px] sm:text-xs font-bold text-primary tracking-wider uppercase">
            Anagrafica Pazienti • CardioDiario
          </span>
          <h1 className="text-2xl sm:text-3xl font-headline font-bold text-on-surface tracking-tight mt-1">
            Gestione Pazienti dello Studio
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant">
            Censimento, rilascio credenziali e accesso alle schede con i diari clinici di ogni paziente.
          </p>
        </div>

        <button
          onClick={() => setIsNewPatientOpen(true)}
          className="w-full sm:w-auto justify-center px-4 sm:px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-on-primary text-xs sm:text-sm font-bold shadow-sm flex items-center gap-2 transition-colors"
        >
          <span className="material-symbols-outlined text-lg sm:text-xl">person_add</span>
          <span>Nuovo Paziente</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-surface-container-lowest p-3.5 sm:p-4 rounded-2xl border border-surface-variant/50">
        <div className="relative flex-1 sm:max-w-md w-full">
          <input
            type="text"
            placeholder="Cerca per cognome, nome o codice fiscale..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 sm:h-11 pl-10 pr-4 bg-surface-container-low rounded-xl text-xs font-medium border border-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">
            search
          </span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-bold text-secondary uppercase shrink-0">Stato:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 sm:h-11 pl-3.5 pr-9 bg-surface-container-low rounded-xl text-xs font-semibold text-on-surface border border-surface-variant/40 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer w-full sm:w-auto"
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
        <div className="bg-surface-container-lowest p-8 sm:p-12 rounded-3xl border border-surface-variant/50 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-surface-container flex items-center justify-center text-outline mx-auto">
            <span className="material-symbols-outlined text-3xl">group_off</span>
          </div>
          <div>
            <h3 className="font-headline font-bold text-base sm:text-lg text-on-surface">Nessun paziente in archivio</h3>
            <p className="text-xs text-on-surface-variant mt-1">
              Non è ancora stato registrato alcun paziente. Clicca sul pulsante &quot;Nuovo Paziente&quot; in alto per iniziare.
            </p>
          </div>
          <button
            onClick={() => setIsNewPatientOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-bold inline-flex items-center gap-2 shadow-sm hover:bg-primary/90 transition-colors"
          >
            <span className="material-symbols-outlined text-base">person_add</span>
            Registra Primo Paziente
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredPatients.map((p: any) => {
            let badgeClass = "bg-surface-container text-on-surface-variant";
            if (p.cicloStato === "in corso") badgeClass = "bg-primary-container/40 text-primary font-bold";
            if (p.cicloStato === "da iniziare") badgeClass = "bg-secondary-container text-tertiary font-bold";
            if (p.cicloStato === "in pausa") badgeClass = "bg-error-container/40 text-error font-bold";

            return (
              <div
                key={p.id}
                className="bg-surface-container-lowest p-5 sm:p-6 rounded-3xl border border-surface-variant/50 shadow-sm flex flex-col justify-between hover:border-primary/40 hover:shadow-md transition-all space-y-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-primary-container/30 text-primary flex items-center justify-center font-headline font-bold text-lg shrink-0">
                      {p.nome.charAt(0)}{p.cognome.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold text-primary uppercase tracking-wider block">
                        Scheda Paziente
                      </span>
                      <h3 className="font-headline font-bold text-base text-on-surface truncate">
                        {p.cognome} {p.nome}
                      </h3>
                      <p className="text-xs font-mono text-secondary truncate">{p.codiceFiscale}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setPatientToDelete(p)}
                    title="Elimina paziente"
                    className="w-9 h-9 rounded-xl bg-error-container/30 hover:bg-error-container/60 text-error flex items-center justify-center transition-colors shrink-0"
                  >
                    <span className="material-symbols-outlined text-lg">delete</span>
                  </button>
                </div>

                <div className="space-y-1.5 text-xs text-on-surface-variant bg-surface-container-low p-3.5 rounded-2xl">
                  <div className="flex justify-between">
                    <span className="text-secondary">Data di Nascita:</span>
                    <span className="font-semibold text-on-surface">{p.dataNascita || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary">Telefono:</span>
                    <span className="font-semibold text-on-surface">{p.telefono || "—"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-secondary">Diari Clinici:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-on-surface">{p.cicliCount ?? 0}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] capitalize ${badgeClass}`}>
                        {p.cicloStato}
                      </span>
                    </div>
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
                    className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-on-primary text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">folder_shared</span>
                    <span>Vedi Diari</span>
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
        onSuccess={(created) => {
          setIsNewPatientOpen(false);
          setSelectedForCredenziali(created);
          loadData();
        }}
      />

      {selectedForCredenziali && (
        <SchedaCredenzialiModal
          isOpen={true}
          onClose={() => setSelectedForCredenziali(null)}
          paziente={{
            id: selectedForCredenziali.id,
            nome: selectedForCredenziali.nome,
            cognome: selectedForCredenziali.cognome,
            codiceFiscale: selectedForCredenziali.codiceFiscale,
            pin: selectedForCredenziali.pin,
          }}
        />
      )}

      <ConfermaEliminazioneModal
        isOpen={!!patientToDelete}
        onClose={() => setPatientToDelete(null)}
        onConfirm={handleConfirmDelete}
        loading={deleting}
        title="Elimina Paziente"
        description={
          patientToDelete
            ? `Sei sicuro di voler eliminare definitivamente il paziente ${patientToDelete.cognome} ${patientToDelete.nome} (${patientToDelete.codiceFiscale})? Verranno eliminati tutti i dati personali, i diari clinici, le misurazioni e le note associate. Questa operazione non è reversibile.`
            : ""
        }
        confirmLabel="Elimina Paziente"
      />
    </div>
  );
}
