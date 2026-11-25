"use client";

import React, { useEffect, useState } from "react";
import { AlertCircle, BellRing, CheckCircle2, Clock, Send } from "lucide-react";
import { getDoctorDashboardData, sendComunicazione } from "@/db/actions";
import { StethoscopeLoader } from "@/components/StethoscopeLoader";

export default function ComunicazioniPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [pazienti, setPazienti] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviatoATutti, setInviatoATutti] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [titolo, setTitolo] = useState("");
  const [messaggio, setMessaggio] = useState("");
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    getDoctorDashboardData()
      .then((res) => {
        setPazienti(res.pazienti);
      })
      .finally(() => setLoading(false));
  }, []);

  const togglePatient = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titolo.trim() || !messaggio.trim()) {
      setFeedback({ type: "error", text: "Compila titolo e testo della comunicazione." });
      return;
    }
    if (!inviatoATutti && selectedIds.length === 0) {
      setFeedback({ type: "error", text: "Seleziona almeno un destinatario." });
      return;
    }

    setSending(true);
    setFeedback(null);

    try {
      const res = await sendComunicazione({
        titolo,
        messaggio,
        inviatoATutti,
        destinatariIds: selectedIds,
      });

      if (res.success) {
        const pushDetail = res.pushConfigured
          ? ` Inoltrate ${res.pushSent} notifiche push ai dispositivi registrati.`
          : " Salvata nel Centro Notifiche in-app (VAPID non ancora configurato).";
        setFeedback({
          type: "success",
          text: `Comunicazione registrata per ${res.count} pazienti.${pushDetail}`,
        });
        setTitolo("");
        setMessaggio("");
      }
    } catch {
      setFeedback({ type: "error", text: "Errore durante l'invio della notifica." });
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <StethoscopeLoader text="Caricamento centro notifiche..." />
      </div>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pushReadyCount = pazienti.filter((p: any) => p.pushActive).length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-5xl mx-auto">
      {sending && <StethoscopeLoader overlay text="Trasmissione notifica in corso..." />}

      <div className="border-b border-surface-variant/40 pb-5 sm:pb-6">
        <span className="text-[11px] sm:text-xs font-bold text-primary tracking-wider uppercase">
          Centro Notifiche • Web Push API
        </span>
        <h1 className="text-2xl sm:text-3xl font-headline font-bold text-on-surface tracking-tight mt-1">
          Invio Notifiche &amp; Comunicazioni
        </h1>
        <p className="text-xs sm:text-sm text-on-surface-variant">
          Invia messaggi push sugli smartphone dei tuoi pazienti per promemoria o istruzioni cliniche ({pushReadyCount} su {pazienti.length} con push attive).
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        <div className="lg:col-span-2 bg-surface-container-lowest p-5 sm:p-6 rounded-3xl border border-surface-variant/50 shadow-terra space-y-5">
          <h2 className="text-base sm:text-lg font-headline font-bold text-on-surface">
            Nuova Notifica Push
          </h2>

          {feedback && (
            <div
              role="status"
              className={`p-4 rounded-xl text-xs flex items-center gap-2 ${
                feedback.type === "success"
                  ? "bg-primary-container text-on-primary-container font-bold"
                  : "bg-error-container text-on-error-container"
              }`}
            >
              {feedback.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
              )}
              <span>{feedback.text}</span>
            </div>
          )}

          <form onSubmit={handleSend} className="space-y-4">
            <fieldset className="space-y-2">
              <legend className="text-xs font-bold text-on-surface uppercase tracking-wider block">
                Destinatari della Notifica
              </legend>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 sm:gap-4">
                <label htmlFor="com-target-all" className="flex items-center gap-2 text-sm font-semibold cursor-pointer min-h-[36px]">
                  <input
                    id="com-target-all"
                    type="radio"
                    name="target"
                    checked={inviatoATutti}
                    onChange={() => setInviatoATutti(true)}
                    className="text-primary h-4 w-4"
                  />
                  <span>Tutti i Pazienti ({pazienti.length})</span>
                </label>
                <label htmlFor="com-target-select" className="flex items-center gap-2 text-sm font-semibold cursor-pointer min-h-[36px]">
                  <input
                    id="com-target-select"
                    type="radio"
                    name="target"
                    checked={!inviatoATutti}
                    onChange={() => setInviatoATutti(false)}
                    className="text-primary h-4 w-4"
                  />
                  <span>Seleziona da Elenco</span>
                </label>
              </div>

              {!inviatoATutti && (
                <div className="mt-3 p-3 rounded-2xl bg-surface-container-low border border-surface-variant/40 max-h-48 overflow-y-auto space-y-1">
                  {pazienti.map((p) => {
                    const checked = selectedIds.includes(p.id);
                    const cbId = `com-paz-${p.id}`;
                    return (
                      <label
                        key={p.id}
                        htmlFor={cbId}
                        className={`flex items-center justify-between p-2 rounded-xl text-xs cursor-pointer ${
                          checked
                            ? "bg-primary-container/30 font-bold text-primary"
                            : "hover:bg-surface-container text-on-surface"
                        }`}
                      >
                        <span className="flex items-center gap-1.5 min-w-0">
                          <span className="truncate">
                            {p.cognome} {p.nome} ({p.codiceFiscale})
                          </span>
                          {p.pushActive && (
                            <BellRing className="w-3.5 h-3.5 text-primary shrink-0" aria-label="Push attive" />
                          )}
                        </span>
                        <input
                          id={cbId}
                          type="checkbox"
                          checked={checked}
                          onChange={() => togglePatient(p.id)}
                          className="rounded text-primary h-4 w-4 shrink-0"
                        />
                      </label>
                    );
                  })}
                </div>
              )}
            </fieldset>

            <div className="space-y-1">
              <label htmlFor="com-titolo" className="text-xs font-bold text-on-surface uppercase tracking-wider block">
                Oggetto Notifica *
              </label>
              <input
                id="com-titolo"
                name="titolo"
                type="text"
                required
                value={titolo}
                onChange={(e) => setTitolo(e.target.value)}
                placeholder="es. Promemoria Misurazione Serale"
                className="w-full min-h-[46px] px-3 bg-surface-container-low rounded-xl text-sm border border-surface-variant/50 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="com-messaggio" className="text-xs font-bold text-on-surface uppercase tracking-wider block">
                Testo del Messaggio *
              </label>
              <textarea
                id="com-messaggio"
                name="messaggio"
                required
                rows={4}
                value={messaggio}
                onChange={(e) => setMessaggio(e.target.value)}
                placeholder="es. Si ricorda di registrare la pressione prima di cena come concordato..."
                className="w-full p-3 bg-surface-container-low rounded-xl text-sm border border-surface-variant/50 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={sending}
              className="w-full min-h-[48px] px-4 rounded-xl bg-primary hover:bg-primary/90 text-on-primary text-sm font-bold shadow-sm flex items-center justify-center gap-2 transition-colors"
            >
              <Send className="w-4 h-4" aria-hidden="true" />
              <span>{sending ? "Trasmissione in corso..." : "Invia Notifica Push"}</span>
            </button>
          </form>
        </div>

        <div className="space-y-6">
          <div className="bg-secondary-container/40 p-6 rounded-3xl border border-secondary/20 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-surface-container-lowest text-tertiary flex items-center justify-center shadow-sm">
              <Clock className="w-5 h-5" aria-hidden="true" />
            </div>
            <h2 className="font-headline font-bold text-base text-on-surface">
              Promemoria Automatici (Cutoff)
            </h2>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Il sistema invia automaticamente notifiche push ai pazienti con slot non ancora compilati nei seguenti orari (ora italiana):
            </p>
            <ul className="text-xs space-y-1.5 font-semibold text-on-surface">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary" aria-hidden="true" />
                <span><strong>Ore 11:00</strong> — Promemoria Mattina</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-tertiary" aria-hidden="true" />
                <span><strong>Ore 16:00</strong> — Promemoria Pomeriggio</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-error" aria-hidden="true" />
                <span><strong>Ore 22:00</strong> — Promemoria Sera</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
