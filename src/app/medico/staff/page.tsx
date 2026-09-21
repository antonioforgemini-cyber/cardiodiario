"use client";

import React from "react";

export default function StaffPage() {
  const staffMembers = [
    {
      id: "med-1",
      nome: "Valerio",
      cognome: "Marchi",
      ruolo: "Medico Primario / Titolare",
      specializzazione: "Cardiologia e Malattie Vascolari",
      email: "dott.marchi@cardiodiario.it",
      telefono: "+39 06 88776655",
      stato: "Attivo",
    },
    {
      id: "med-2",
      nome: "Elena",
      cognome: "Sartori",
      ruolo: "Specialista Associato",
      specializzazione: "Medicina Interna & Ipertensione",
      email: "dott.ssa.sartori@cardiodiario.it",
      telefono: "+39 06 88776656",
      stato: "Attivo",
    },
  ];

  return (
    <div className="p-8 space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="border-b border-surface-variant/40 pb-6">
        <span className="text-xs font-bold text-primary tracking-wider uppercase">
          Studio Medico • Amministrazione Multi-Medico
        </span>
        <h1 className="text-3xl font-headline font-bold text-on-surface tracking-tight mt-1">
          Gestione Staff & Medici
        </h1>
        <p className="text-sm text-on-surface-variant">
          Amministrazione delle utenze mediche e isolamento clinico dei pazienti dello studio.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {staffMembers.map((m) => (
          <div
            key={m.id}
            className="bg-surface-container-lowest p-6 rounded-3xl border border-surface-variant/50 shadow-sm space-y-4"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary-container/30 text-primary flex items-center justify-center font-bold font-headline text-lg">
                {m.nome.charAt(0)}{m.cognome.charAt(0)}
              </div>
              <div>
                <h3 className="font-headline font-bold text-lg text-on-surface">
                  Dott. {m.nome} {m.cognome}
                </h3>
                <span className="text-xs font-bold text-primary block">{m.ruolo}</span>
                <span className="text-xs text-secondary">{m.specializzazione}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-surface-container-low text-xs space-y-1.5 text-on-surface-variant">
              <div className="flex justify-between">
                <span className="text-secondary">Email:</span>
                <span className="font-semibold text-on-surface">{m.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary">Telefono Studio:</span>
                <span className="font-semibold text-on-surface">{m.telefono}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary">Stato:</span>
                <span className="text-primary font-bold">{m.stato}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
