"use client";

import React, { useCallback, useEffect, useState, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  FilePlus2,
  Fingerprint,
  IdCard,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";
import { getPazienteDettaglioClinico, deleteCiclo } from "@/db/actions";
import { contaPasskeyPaziente, resetPasskeyPaziente } from "@/db/passkey-actions";
import { StethoscopeLoader } from "@/components/StethoscopeLoader";
import { NuovoCicloModal } from "@/components/modals/NuovoCicloModal";
import { GestioneCicloModal } from "@/components/modals/GestioneCicloModal";
import { SchedaCredenzialiModal } from "@/components/modals/SchedaCredenzialiModal";
import { ConfermaEliminazioneModal } from "@/components/modals/ConfermaEliminazioneModal";
import { useToast } from "@/components/ui/ToastProvider";

export default function SchedePazientePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const pazienteId = resolvedParams.id;
  const { showToast } = useToast();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [passkeyCount, setPasskeyCount] = useState<number>(0);
  const [resettingPasskeys, setResettingPasskeys] = useState(false);
  const [isResetBioConfirmOpen, setIsResetBioConfirmOpen] = useState(false);

  const [isCicloModalOpen, setIsCicloModalOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [cicloToManage, setCicloToManage] = useState<any>(null);
  const [isCredenzialiOpen, setIsCredenzialiOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [cicloToDelete, setCicloToDelete] = useState<any>(null);
  const [deletingCiclo, setDeletingCiclo] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [res, pkCount] = await Promise.all([
        getPazienteDettaglioClinico(pazienteId),
        contaPasskeyPaziente(pazienteId).catch(() => 0),
      ]);
      setData(res);
      setPasskeyCount(pkCount);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [pazienteId]);

  const handleConfirmResetPasskeys = async () => {
    setResettingPasskeys(true);
    try {
      await resetPasskeyPaziente(pazienteId);
      setPasskeyCount(0);
      setIsResetBioConfirmOpen(false);
      showToast("Accessi biometrici rimossi. Il paziente rientrerà con il PIN.", "success");
    } catch {
      showToast("Impossibile resettare gli accessi biometrici.", "error");
    } finally {
      setResettingPasskeys(false);
    }
  };

  const handleConfirmDeleteCiclo = async () => {
    if (!cicloToDelete) return;
    setDeletingCiclo(true);
    try {
      await deleteCiclo(cicloToDelete.id);
      setCicloToDelete(null);
      showToast("Diario eliminato.", "success");
      await loadData();
    } catch (err) {
      console.error("Errore durante l'eliminazione del diario:", err);
      showToast("Si è verificato un errore durante l'eliminazione del diario.", "error");
    } finally {
      setDeletingCiclo(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <StethoscopeLoader text="Caricamento schede paziente..." />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-4 sm:p-8 text-center space-y-4 max-w-md mx-auto my-12">
        <h1 className="text-xl font-bold text-error">Paziente non trovato</h1>
        <Link href="/medico/pazienti" className="text-primary underline text-sm font-semibold">
          Torna a Gestione Pazienti dello Studio
        </Link>
      </div>
    );
  }

  const { paziente, allCicli = [], medicoNomeCompleto } = data;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Link
          href="/medico/pazienti"
          className="inline-flex items-center gap-1.5 min-h-[38px] text-xs font-bold text-secondary hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>Torna a Gestione Pazienti dello Studio</span>
        </Link>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setIsCredenzialiOpen(true)}
            className="flex-1 sm:flex-none justify-center min-h-[44px] px-3.5 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-xs font-bold text-on-surface flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <IdCard className="w-4 h-4" aria-hidden="true" />
            <span>Scheda PIN</span>
          </button>
          <button
            type="button"
            onClick={() => setIsCicloModalOpen(true)}
            className="flex-1 sm:flex-none justify-center min-h-[44px] px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-on-primary text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <FilePlus2 className="w-4 h-4" aria-hidden="true" />
            <span>Inserisci Nuovo Diario</span>
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
            <span className="text-[11px] font-bold text-primary uppercase tracking-wider block">
              Schede Paziente • CardioDiario
            </span>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <h1 className="text-xl sm:text-2xl font-headline font-bold text-on-surface truncate">
                {paziente.cognome} {paziente.nome}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-surface-container text-on-surface-variant shrink-0">
                {allCicli.length} {allCicli.length === 1 ? "diario" : "diari"}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-on-surface-variant">
              <span>
                CF: <strong className="font-mono text-on-surface">{paziente.codiceFiscale}</strong>
              </span>
              <span>
                Nascita: <strong className="text-on-surface">{paziente.dataNascita}</strong>
              </span>
              <span>
                Tel: <strong className="text-on-surface">{paziente.telefono}</strong>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Fingerprint className="w-4 h-4 text-primary" aria-hidden="true" />
                <span>
                  Biometria:{" "}
                  <strong className="text-on-surface">
                    {passkeyCount === 0
                      ? "non attiva"
                      : `${passkeyCount} dispositiv${passkeyCount === 1 ? "o" : "i"}`}
                  </strong>
                </span>
                {passkeyCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsResetBioConfirmOpen(true)}
                    disabled={resettingPasskeys}
                    className="ml-1 text-[11px] font-bold text-error hover:underline disabled:opacity-50"
                  >
                    {resettingPasskeys ? "Reset..." : "Reset accessi"}
                  </button>
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      <section className="space-y-4" aria-labelledby="patient-diaries-heading">
        <div>
          <h2 id="patient-diaries-heading" className="text-lg sm:text-xl font-headline font-bold text-on-surface">
            Elenco Schede Diari del Paziente
          </h2>
          <p className="text-xs text-on-surface-variant">
            Seleziona una scheda per aprire il diario clinico completo o inserisci un nuovo diario per questo paziente.
          </p>
        </div>

        {allCicli.length === 0 ? (
          <div className="bg-surface-container-lowest p-8 sm:p-12 rounded-3xl border border-surface-variant/50 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-surface-container flex items-center justify-center text-outline mx-auto">
              <BookOpen className="w-7 h-7" aria-hidden="true" />
            </div>
            <div>
              <h3 className="font-headline font-bold text-base sm:text-lg text-on-surface">
                Nessun diario presente per {paziente.nome} {paziente.cognome}
              </h3>
              <p className="text-xs text-on-surface-variant mt-1 max-w-md mx-auto">
                Puoi creare un nuovo diario pressorio con i dati del paziente già precompilati e senza bisogno di generare un nuovo PIN.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsCicloModalOpen(true)}
              className="min-h-[44px] px-5 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-bold inline-flex items-center gap-2 shadow-sm hover:bg-primary/90 transition-colors"
            >
              <FilePlus2 className="w-4 h-4" aria-hidden="true" />
              <span>Inserisci Primo Diario</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {allCicli.map((c: any, idx: number) => {
              let badgeClass = "bg-surface-container text-on-surface-variant";
              if (c.stato === "in corso") badgeClass = "bg-primary-container/40 text-primary font-bold";
              if (c.stato === "da iniziare") badgeClass = "bg-secondary-container text-tertiary font-bold";
              if (c.stato === "in pausa") badgeClass = "bg-error-container/40 text-error font-bold";
              if (c.stato === "concluso") badgeClass = "bg-surface-container-high text-secondary font-bold";

              const diaryNumber = allCicli.length - idx;

              return (
                <article
                  key={c.id}
                  className="bg-surface-container-lowest p-5 sm:p-6 rounded-3xl border border-surface-variant/50 shadow-terra flex flex-col justify-between hover:border-primary/40 transition-all space-y-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        aria-hidden="true"
                        className="w-12 h-12 rounded-2xl bg-primary-container/30 text-primary flex items-center justify-center font-headline font-bold text-lg shrink-0"
                      >
                        {paziente.nome.charAt(0)}
                        {paziente.cognome.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold text-primary uppercase tracking-wider block">
                          Diario #{diaryNumber} • {c.dataInizio}
                        </span>
                        <h3 className="font-headline font-bold text-base text-on-surface truncate">
                          {paziente.cognome} {paziente.nome}
                        </h3>
                        <p className="text-xs font-mono text-secondary truncate">{paziente.codiceFiscale}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] capitalize ${badgeClass}`}>
                        {c.stato}
                      </span>
                      <button
                        type="button"
                        onClick={() => setCicloToDelete(c)}
                        aria-label={`Elimina diario numero ${diaryNumber}`}
                        className="min-w-[36px] min-h-[36px] rounded-xl bg-error-container/30 hover:bg-error-container/60 text-error flex items-center justify-center transition-colors"
                      >
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-on-surface-variant bg-surface-container-low p-3.5 rounded-2xl">
                    <div className="flex justify-between">
                      <span className="text-secondary">Telefono:</span>
                      <span className="font-semibold text-on-surface">{paziente.telefono || "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary">Durata Monitoraggio:</span>
                      <span className="font-semibold text-on-surface">{c.durataGiorni} giorni</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary">Braccio Riferimento:</span>
                      <span className="font-semibold text-on-surface">
                        {c.braccioRiferimento ? `Braccio ${c.braccioRiferimento}` : "Da definire"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary">Ultima Rilevazione:</span>
                      <span className="font-bold text-on-surface">
                        {c.ultimoMax && c.ultimoMin ? `${c.ultimoMax}/${c.ultimoMin} mmHg` : "Nessuna"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary">Rilevazioni:</span>
                      <span className="font-semibold text-on-surface">
                        {c.misurazioniCount ?? 0} registrate
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-surface-variant/30 gap-2">
                    <button
                      type="button"
                      onClick={() => setCicloToManage(c)}
                      className="min-h-[40px] px-2 text-xs font-semibold text-secondary hover:text-on-surface flex items-center gap-1.5"
                    >
                      <SlidersHorizontal className="w-4 h-4" aria-hidden="true" />
                      <span>Stato Diario</span>
                    </button>

                    <Link
                      href={`/medico/pazienti/${paziente.id}/diario/${c.id}`}
                      className="min-h-[40px] px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-on-primary text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
                    >
                      <span>Apri Diario</span>
                      <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <NuovoCicloModal
        isOpen={isCicloModalOpen}
        onClose={() => setIsCicloModalOpen(false)}
        onSuccess={() => void loadData()}
        pazienteId={paziente.id}
        medicoId="med-1"
        paziente={paziente}
      />

      {cicloToManage && (
        <GestioneCicloModal
          isOpen={true}
          onClose={() => setCicloToManage(null)}
          onSuccess={() => {
            setCicloToManage(null);
            void loadData();
          }}
          cicloId={cicloToManage.id}
          currentStato={cicloToManage.stato}
        />
      )}

      <SchedaCredenzialiModal
        isOpen={isCredenzialiOpen}
        onClose={() => setIsCredenzialiOpen(false)}
        medicoNome={medicoNomeCompleto}
        paziente={paziente}
      />

      <ConfermaEliminazioneModal
        isOpen={!!cicloToDelete}
        onClose={() => setCicloToDelete(null)}
        onConfirm={handleConfirmDeleteCiclo}
        loading={deletingCiclo}
        title="Elimina Diario Paziente"
        description={
          cicloToDelete
            ? `Sei sicuro di voler eliminare definitivamente il diario avviato il ${cicloToDelete.dataInizio} (${cicloToDelete.durataGiorni} giorni) di ${paziente.cognome} ${paziente.nome}? Verranno eliminate anche tutte le misurazioni registrate in questo diario.`
            : ""
        }
        confirmLabel="Elimina Diario"
      />

      <ConfermaEliminazioneModal
        isOpen={isResetBioConfirmOpen}
        onClose={() => setIsResetBioConfirmOpen(false)}
        onConfirm={handleConfirmResetPasskeys}
        loading={resettingPasskeys}
        title="Reset Accessi Biometrici"
        description={`Rimuovere tutti gli accessi biometrici (impronta / Face ID) di ${paziente.nome} ${paziente.cognome}? Il paziente dovrà rientrare con il PIN personale.`}
        confirmLabel="Rimuovi Accessi"
      />
    </div>
  );
}
