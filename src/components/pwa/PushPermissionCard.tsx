"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Bell, BellOff, BellRing, CheckCircle2, Send, Smartphone } from "lucide-react";
import {
  getCurrentPushSubscription,
  getPushSupportState,
  subscribeCurrentDevice,
  unsubscribeCurrentDevice,
  type PushSupportState,
} from "@/lib/push-client";
import {
  formatMuteUntilItalian,
  type NotificationMuteState,
} from "@/lib/push-mute";
import { NotificationMuteControl } from "./NotificationMuteControl";

interface PushPermissionCardProps {
  variant?: "banner" | "inline" | "compact" | "settings";
  onSubscribed?: () => void;
  onMuteChange?: (mute: NotificationMuteState) => void;
}

interface PushServerStatus {
  configured: boolean;
  vapidPublicKey: string | null;
  activeDevices: number;
  mute?: NotificationMuteState;
}

const DEFAULT_MUTE_STATE: NotificationMuteState = {
  mode: "active",
  muteUntil: null,
  isMuted: false,
};

export const PushPermissionCard: React.FC<PushPermissionCardProps> = ({
  variant = "banner",
  onSubscribed,
  onMuteChange,
}) => {
  const [supportState, setSupportState] = useState<PushSupportState>("default");
  const [serverStatus, setServerStatus] = useState<PushServerStatus | null>(null);
  const [mute, setMute] = useState<NotificationMuteState>(DEFAULT_MUTE_STATE);
  const [isSubscribedThisDevice, setIsSubscribedThisDevice] = useState(false);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const onMuteChangeRef = useRef(onMuteChange);
  onMuteChangeRef.current = onMuteChange;

  const refreshState = useCallback(async () => {
    setSupportState(getPushSupportState());
    const [sub, statusRes] = await Promise.all([
      getCurrentPushSubscription(),
      fetch("/api/push/subscribe", { cache: "no-store" })
        .then((r) => (r.ok ? (r.json() as Promise<PushServerStatus>) : null))
        .catch(() => null),
    ]);
    setIsSubscribedThisDevice(Boolean(sub));
    if (statusRes) {
      setServerStatus(statusRes);
      if (statusRes.mute) {
        setMute(statusRes.mute);
        onMuteChangeRef.current?.(statusRes.mute);
      }
    }
  }, []);

  useEffect(() => {
    void refreshState();
  }, [refreshState]);

  const handleMuteChange = (nextMute: NotificationMuteState) => {
    setMute(nextMute);
    setFeedback(null);
    onMuteChangeRef.current?.(nextMute);
  };

  const handleEnable = async () => {
    if (!serverStatus?.vapidPublicKey) return;
    setBusy(true);
    setFeedback(null);
    const res = await subscribeCurrentDevice(serverStatus.vapidPublicKey);
    if (res.ok) {
      setFeedback({ type: "ok", text: "Promemoria attivati su questo dispositivo!" });
      await refreshState();
      onSubscribed?.();
    } else {
      setFeedback({ type: "err", text: res.error || "Impossibile attivare le notifiche." });
      setSupportState(getPushSupportState());
    }
    setBusy(false);
  };

  const handleTest = async () => {
    setBusy(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/push/test", { method: "POST" });
      const data = (await res.json()) as {
        sent?: number;
        muted?: boolean;
        error?: string;
      };
      if (data.muted) {
        setFeedback({
          type: "err",
          text:
            data.error ||
            "Notifiche silenziate: seleziona 'Suoneria attiva' per inviare una prova.",
        });
      } else if (res.ok && (data.sent ?? 0) > 0) {
        setFeedback({ type: "ok", text: "Notifica di prova inviata! Controlla il dispositivo." });
      } else {
        setFeedback({
          type: "err",
          text: data.error || "Nessuna notifica consegnata. Prova a riattivare i permessi.",
        });
      }
    } catch {
      setFeedback({ type: "err", text: "Errore di rete durante l'invio della prova." });
    } finally {
      setBusy(false);
    }
  };

  const handleDisable = async () => {
    setBusy(true);
    setFeedback(null);
    await unsubscribeCurrentDevice();
    setFeedback({ type: "ok", text: "Notifiche disattivate su questo dispositivo." });
    await refreshState();
    setBusy(false);
  };

  const showMuteControls = variant === "settings" || variant === "compact";
  const isActive = supportState === "granted" && isSubscribedThisDevice;

  if (variant === "banner") {
    if (serverStatus && !serverStatus.configured) return null;
    if (supportState === "unsupported") return null;
    if (isActive || mute.isMuted) return null;
  }

  const wrapperClass =
    variant === "compact"
      ? "p-3.5 rounded-2xl bg-surface-container-low border border-surface-variant/50 space-y-3"
      : variant === "inline"
      ? "p-4 rounded-2xl bg-primary-container/20 border border-primary/25 space-y-3 text-left"
      : variant === "settings"
      ? "p-4 rounded-2xl bg-surface-container-low border border-surface-variant/60 space-y-3.5"
      : "p-4 rounded-2xl bg-secondary-container/45 border border-secondary/30 shadow-sm space-y-3";

  const renderPushSection = () => {
    if (serverStatus && !serverStatus.configured) {
      return (
        <div className="text-xs text-on-surface-variant flex items-start gap-2.5">
          <Bell className="w-4 h-4 text-secondary shrink-0 mt-0.5" aria-hidden="true" />
          <span>
            Le notifiche push sul telefono non sono ancora configurate sul server; i messaggi del medico restano sempre visibili qui nell&apos;app.
          </span>
        </div>
      );
    }

    if (supportState === "ios-needs-install") {
      return (
        <div className="p-3 rounded-xl bg-secondary-container/50 border border-secondary/30 space-y-1 text-xs">
          <p className="font-bold text-on-surface flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-tertiary shrink-0" aria-hidden="true" />
            <span>Su iPhone/iPad serve prima l&apos;installazione su Home</span>
          </p>
          <p className="text-on-surface-variant leading-relaxed">
            Tocca <strong>Condividi → Aggiungi alla schermata Home</strong> in Safari, poi apri CardioDiario dall&apos;icona creata per attivare i promemoria push.
          </p>
        </div>
      );
    }

    if (supportState === "unsupported") {
      return (
        <div className="text-xs text-on-surface-variant flex items-center gap-2">
          <BellOff className="w-4 h-4 text-secondary shrink-0" aria-hidden="true" />
          <span>Questo browser non supporta le notifiche push Web.</span>
        </div>
      );
    }

    if (supportState === "denied") {
      return (
        <div className="p-3 rounded-xl bg-error-container/35 border border-error/30 space-y-1 text-xs text-on-error-container">
          <p className="font-bold flex items-center gap-1.5">
            <BellOff className="w-4 h-4 text-error shrink-0" aria-hidden="true" />
            <span>Notifiche bloccate sul browser</span>
          </p>
          <p className="leading-relaxed">
            Hai bloccato le notifiche per CardioDiario. Riabilitale dalle impostazioni del sito nel browser o del telefono per ricevere i promemoria.
          </p>
        </div>
      );
    }

    const mutedSubtitle =
      mute.mode === "forever"
        ? "Silenziate per sempre: nessun avviso push verrà inviato al dispositivo."
        : mute.muteUntil
        ? `In pausa fino a ${formatMuteUntilItalian(mute.muteUntil)}.`
        : "";

    return (
      <>
        <div className="flex items-start gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              mute.isMuted
                ? "bg-secondary-container text-tertiary"
                : isActive
                ? "bg-primary-container/40 text-primary"
                : "bg-primary text-on-primary"
            }`}
          >
            {mute.isMuted ? (
              <BellOff className="w-5 h-5" aria-hidden="true" />
            ) : isActive ? (
              <BellRing className="w-5 h-5" aria-hidden="true" />
            ) : (
              <Bell className="w-5 h-5" aria-hidden="true" />
            )}
          </div>
          <div className="flex-1 min-w-0 space-y-1">
            <p className="text-sm font-headline font-bold text-on-surface leading-snug">
              {mute.isMuted
                ? "Notifiche silenziate"
                : isActive
                ? "Promemoria Push attivi su questo dispositivo"
                : "Attiva i promemoria delle misurazioni"}
            </p>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              {mute.isMuted
                ? mutedSubtitle
                : isActive
                ? "Riceverai un avviso alle 11:00, 16:00 e 22:00 se non hai ancora inserito la misurazione, oltre ai messaggi del medico."
                : "Ricevi un promemoria alle 11:00, 16:00 e 22:00 se dimentichi uno slot e gli avvisi diretti del tuo medico."}
            </p>
          </div>
        </div>

        {feedback && (
          <p
            role="status"
            className={`text-xs font-semibold flex items-center gap-1.5 ${
              feedback.type === "ok" ? "text-primary" : "text-error"
            }`}
          >
            {feedback.type === "ok" && <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />}
            <span>{feedback.text}</span>
          </p>
        )}

        {isActive ? (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleTest}
              disabled={busy}
              className="min-h-[40px] px-3.5 py-2 rounded-xl bg-surface-container-lowest hover:bg-surface-container border border-surface-variant/60 text-xs font-bold text-primary inline-flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{busy ? "Invio..." : "Invia notifica di prova"}</span>
            </button>
            <button
              type="button"
              onClick={handleDisable}
              disabled={busy}
              className="min-h-[40px] px-3 py-2 rounded-xl text-xs font-semibold text-secondary hover:text-error hover:bg-error-container/20 transition-colors disabled:opacity-50"
            >
              Disattiva su questo telefono
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleEnable}
            disabled={busy || !serverStatus?.vapidPublicKey}
            className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-on-primary text-xs font-bold shadow-sm inline-flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            <BellRing className="w-4 h-4" aria-hidden="true" />
            <span>{busy ? "Attivazione..." : "Attiva Notifiche Push"}</span>
          </button>
        )}
      </>
    );
  };

  return (
    <div className={wrapperClass}>
      {renderPushSection()}
      {showMuteControls && (
        <NotificationMuteControl
          mute={mute}
          onChange={handleMuteChange}
          compact={variant === "compact"}
        />
      )}
    </div>
  );
};
