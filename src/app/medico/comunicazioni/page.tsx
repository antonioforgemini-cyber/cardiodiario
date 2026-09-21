"use client";

import React, { useEffect, useState } from "react";
import { getDoctorDashboardData, sendComunicazione } from "@/db/actions";

export default function ComunicazioniPage() {
  const [pazienti, setPazienti] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviatoATutti, setInviatoATutti] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [titolo, setTitolo] = useState("");
  const [messaggio, setMessaggio] = useState("");
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    getDoctorDashboardData("med-1")
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
        medicoId: "med-1",
        titolo,
        messaggio,
        inviatoATutti,
        destinatariIds: selectedIds,
      });

      if (res.success) {
        setFeedback({
          type: "success",
          text: `Notifica push trasmessa con successo a ${res.count} pazienti!`,
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
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="border-b border-surface-variant/40 pb-6">
        <span className="text-xs font-bold text-primary tracking-wider uppercase">
          Centro Notifiche • Web Push API
        </span>
        <h1 className="text-3xl font-headline font-bold text-on-surface tracking-tight mt-1">
          Invio Notifiche & Comunicazioni
        </h1>
        <p className="text-sm text-on-surface-variant">
          Invia messaggi push direttamente sugli smartphone dei tuoi pazienti per promemoria o istruzioni cliniche.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Column */}
        <div className="lg:col-span-2 bg-surface-container-lowest p-6 rounded-3xl border border-surface-variant/50 shadow-sm space-y-5">
          <h2 className="text-lg font-headline font-bold text-on-surface">
            Nuova Notifica Push
          </h2>

          {feedback && (
            <div
              className={`p-4 rounded-xl text-xs flex items-center gap-2 ${
                feedback.type === "success"
                  ? "bg-primary-container text-on-primary-container font-bold"
                  : "bg-error-container text-on-error-container"
              }`}
            >
              <span className="material-symbols-outlined text-base">
                {feedback.type === "success" ? "check_circle" : "error"}
              </span>
              <span>{feedback.text}</span>
            </div>
          )}

          <form onSubmit={handleSend} className="space-y-4">
            {/* Target Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-on-surface uppercase tracking-wider block">
                Destinatari della Notifica
              </label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
                  <input
                    type="radio"
                    name="target"
                    checked={inviatoATutti}
                    onChange={() => setInviatoATutti(true)}
                    className="text-primary focus:ring-primary h-4 w-4"
                  />
                  <span>Tutti i Pazienti ({pazienti.length})</span>
                </label>
                <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
                  <input
                    type="radio"
                    name="target"
                    checked={!inviatoATutti}
                    onChange={() => setInviatoATutti(false)}
                    className="text-primary focus:ring-primary h-4 w-4"
                  />
                  <span>Seleziona da Elenco</span>
                </label>
              </div>

              {!inviatoATutti && (
                <div className="mt-3 p-3 rounded-2xl bg-surface-container-low border border-surface-variant/40 max-h-48 overflow-y-auto space-y-1">
                  {pazienti.map((p) => {
                    const checked = selectedIds.includes(p.id);
                    return (
                      <label
                        key={p.id}
                        className={`flex items-center justify-between p-2 rounded-xl text-xs cursor-pointer ${
                          checked
                            ? "bg-primary-container/30 font-bold text-primary"
                            : "hover:bg-surface-container text-on-surface"
                        }`}
                      >
                        <span>{p.cognome} {p.nome} ({p.codiceFiscale})</span>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => togglePatient(p.id)}
                          className="rounded text-primary focus:ring-primary h-4 w-4"
                        />
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Titolo */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-on-surface uppercase tracking-wider block">
                Oggetto Notifica *
              </label>
              <input
                type="text"
                required
                value={titolo}
                onChange={(e) => setTitolo(e.target.value)}
                placeholder="es. Promemoria Misurazione Serale"
                className="w-full h-11 px-3 bg-surface-container-low rounded-xl text-sm border border-surface-variant/50 focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>

            {/* Messaggio */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-on-surface uppercase tracking-wider block">
                Testo del Messaggio *
              </label>
              <textarea
                required
                rows={4}
                value={messaggio}
                onChange={(e) => setMessaggio(e.target.value)}
                placeholder="es. Si ricorda di registrare la pressione prima di cena come concordato..."
                className="w-full p-3 bg-surface-container-low rounded-xl text-sm border border-surface-variant/50 focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={sending}
              className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-on-primary text-sm font-bold shadow-sm flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-base">send</span>
              <span>{sending ? "Trasmissione in corso..." : "Invia Notifica Push"}</span>
            </button>
          </form>
        </div>

        {/* Info Column */}
        <div className="space-y-6">
          <div className="bg-secondary-container/40 p-6 rounded-3xl border border-secondary/20 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-surface-container-lowest text-tertiary flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined text-2xl">schedule</span>
            </div>
            <h3 className="font-headline font-bold text-base text-on-surface">
              Promemoria Automatici (Cutoff)
            </h3>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Il sistema invia automaticamente notifiche push ai pazienti con slot non ancora compilati nei seguenti orari:
            </p>
            <ul className="text-xs space-y-1 font-semibold text-on-surface">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary"></span>
                <strong>Ore 11:00</strong> — Promemoria Mattina
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-tertiary"></span>
                <strong>Ore 16:00</strong> — Promemoria Pomeriggio
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-error"></span>
                <strong>Ore 22:00</strong> — Promemoria Sera
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
