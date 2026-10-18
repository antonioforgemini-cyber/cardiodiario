"use client";

import React, { useEffect, useState } from "react";
import { getProfiloMedico, changePasswordMedico } from "@/db/actions";
import { StethoscopeLoader } from "@/components/StethoscopeLoader";
import { GestioneBiometriaModal } from "@/components/modals/GestioneBiometriaModal";
import { dimenticaBiometria } from "@/lib/biometria-client";

export default function StaffPage() {
  const [medico, setMedico] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Password Change Modal state
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isBiometriaModalOpen, setIsBiometriaModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [revocaPasskey, setRevocaPasskey] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  const loadProfilo = async () => {
    try {
      const res = await getProfiloMedico();
      if (res) {
        setMedico(res);
      } else {
        setMedico({
          id: "med-1",
          nome: "Ivana",
          cognome: "Pariggiano",
          specializzazione: "Specialista in Cardiologia",
          email: "ivana.pariggiano@libero.it",
          telefono: "—",
          passkeyCount: 0,
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfilo();
  }, []);

  const handleOpenPasswordModal = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setRevocaPasskey(false);
    setPasswordError("");
    setPasswordSuccess("");
    setIsPasswordModalOpen(true);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (newPassword.length < 8) {
      setPasswordError("La nuova password deve contenere almeno 8 caratteri.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("La conferma della password non coincide.");
      return;
    }

    setSavingPassword(true);
    try {
      const res = await changePasswordMedico({
        currentPassword,
        newPassword,
        revocaPasskey,
      });

      if (!res.success) {
        setPasswordError(res.error || "Errore durante l'aggiornamento della password.");
        return;
      }

      if (revocaPasskey) {
        dimenticaBiometria();
      }

      setPasswordSuccess(
        revocaPasskey
          ? "Password aggiornata con successo e dispositivi biometrici scollegati."
          : "Password aggiornata con successo. La tua sessione attuale resta attiva."
      );
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      await loadProfilo();
    } catch (err) {
      console.error(err);
      setPasswordError("Errore imprevisto durante l'aggiornamento della password.");
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <StethoscopeLoader text="Caricamento profilo medico..." />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="border-b border-surface-variant/40 pb-5 sm:pb-6">
        <span className="text-[11px] sm:text-xs font-bold text-primary tracking-wider uppercase">
          Amministrazione Profilo & Sicurezza
        </span>
        <h1 className="text-2xl sm:text-3xl font-headline font-bold text-on-surface tracking-tight mt-1">
          Gestione Staff & Medici
        </h1>
        <p className="text-xs sm:text-sm text-on-surface-variant">
          Amministrazione delle credenziali di accesso, sicurezza e dispositivi biometrici (Passkey) del medico.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {medico && (
          <div className="bg-surface-container-lowest p-5 sm:p-6 rounded-3xl border border-surface-variant/50 shadow-sm space-y-5">
            <div className="flex items-center gap-3.5 sm:gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-primary-container/30 text-primary flex items-center justify-center font-bold font-headline text-base sm:text-lg shrink-0">
                {medico.nome.charAt(0)}{medico.cognome.charAt(0)}
              </div>
              <div className="min-w-0">
                <h3 className="font-headline font-bold text-base sm:text-lg text-on-surface truncate">
                  Dott.ssa {medico.nome} {medico.cognome}
                </h3>
                <span className="text-xs font-bold text-primary block">
                  Dirigente Medico Cardiologia
                </span>
                <span className="text-xs text-secondary">
                  {medico.specializzazione && !medico.specializzazione.includes("Caserta")
                    ? medico.specializzazione
                    : "Specialista in Cardiologia"}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-surface-container-low text-xs space-y-2 text-on-surface-variant">
              <div className="flex justify-between">
                <span className="text-secondary">Email di Accesso:</span>
                <span className="font-semibold text-on-surface">{medico.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary">Telefono:</span>
                <span className="font-semibold text-on-surface">{medico.telefono || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary">Accesso Biometrico (Passkey):</span>
                <span className="font-semibold text-on-surface">
                  {medico.passkeyCount > 0
                    ? `${medico.passkeyCount} dispositiv${medico.passkeyCount === 1 ? "o attivo" : "i attivi"}`
                    : "Non configurato"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary">Stato Account:</span>
                <span className="text-primary font-bold">Attivo</span>
              </div>
            </div>

            <div className="pt-2 border-t border-surface-variant/30 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              <button
                type="button"
                onClick={() => setIsBiometriaModalOpen(true)}
                className="px-3.5 py-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <span className="material-symbols-outlined text-base text-primary">fingerprint</span>
                <span>Gestisci Passkey</span>
              </button>

              <button
                type="button"
                onClick={handleOpenPasswordModal}
                className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-on-primary text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-colors"
              >
                <span className="material-symbols-outlined text-base">lock_reset</span>
                <span>Cambia Password</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Cambio Password Medico */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-inverse-surface/40 backdrop-blur-xs animate-in fade-in duration-200">
          {savingPassword && <StethoscopeLoader overlay text="Aggiornamento password e sessione..." />}

          <div className="bg-surface-container-lowest w-full max-w-md rounded-3xl shadow-2xl border border-surface-variant/50 p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-surface-variant/40 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-primary-container/30 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined">key</span>
                </div>
                <div>
                  <h2 className="text-lg font-headline font-bold text-on-surface">
                    Cambia Password Medico
                  </h2>
                  <p className="text-xs text-on-surface-variant">
                    Aggiorna la password di accesso al portale.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-secondary"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              {passwordError && (
                <div className="p-3 rounded-xl bg-error-container/50 border border-error/30 text-error text-xs font-semibold flex items-center gap-2">
                  <span className="material-symbols-outlined text-base shrink-0">error</span>
                  <span>{passwordError}</span>
                </div>
              )}

              {passwordSuccess && (
                <div className="p-3 rounded-xl bg-primary-container/30 border border-primary/30 text-primary text-xs font-semibold flex items-center gap-2">
                  <span className="material-symbols-outlined text-base shrink-0">check_circle</span>
                  <span>{passwordSuccess}</span>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-on-surface-variant block mb-1">
                  Password Attuale *
                </label>
                <input
                  required
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Inserisci la password corrente"
                  className="w-full h-11 px-3.5 rounded-xl bg-surface-container-low border border-surface-variant/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-on-surface-variant block mb-1">
                  Nuova Password (min. 8 caratteri) *
                </label>
                <input
                  required
                  type="password"
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-11 px-3.5 rounded-xl bg-surface-container-low border border-surface-variant/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-on-surface-variant block mb-1">
                  Conferma Nuova Password *
                </label>
                <input
                  required
                  type="password"
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-11 px-3.5 rounded-xl bg-surface-container-low border border-surface-variant/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-surface-container-low border border-surface-variant/40 space-y-2">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={revocaPasskey}
                    onChange={(e) => setRevocaPasskey(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-primary focus:ring-primary"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-on-surface block">
                      Revoca anche le Passkey / Biometria registrate
                    </span>
                    <span className="text-on-surface-variant leading-relaxed">
                      Il cambio password disconnette automaticamente eventuali altri dispositivi collegati ma mantiene attiva la tua sessione corrente. Se lasci questa casella deselezionata, le tue Passkey (Face ID / Impronta) continueranno a funzionare.
                    </span>
                  </div>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-surface-variant/40">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-secondary hover:bg-surface-container"
                >
                  Chiudi
                </button>
                <button
                  type="submit"
                  disabled={savingPassword}
                  className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-on-primary text-xs font-bold shadow-sm transition-all disabled:opacity-50"
                >
                  {savingPassword ? "Aggiornamento..." : "Salva Nuova Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <GestioneBiometriaModal
        isOpen={isBiometriaModalOpen}
        onClose={() => {
          setIsBiometriaModalOpen(false);
          loadProfilo();
        }}
      />
    </div>
  );
}
