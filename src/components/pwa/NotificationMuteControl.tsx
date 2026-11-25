"use client";

import React, { useId, useState } from "react";
import { Clock, Moon, Volume2, VolumeX } from "lucide-react";
import {
  formatMuteUntilItalian,
  type NotificationMuteMode,
  type NotificationMuteState,
} from "@/lib/push-mute";

interface NotificationMuteControlProps {
  mute: NotificationMuteState;
  onChange: (next: NotificationMuteState) => void;
  compact?: boolean;
}

const MUTE_OPTIONS: Array<{
  mode: NotificationMuteMode;
  label: string;
  subtitle: string;
  Icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" }>;
}> = [
  {
    mode: "active",
    label: "Suoneria attiva",
    subtitle: "Avvisi con suono",
    Icon: Volume2,
  },
  {
    mode: "8h",
    label: "Silenzia 8 ore",
    subtitle: "Pausa temporanea",
    Icon: Clock,
  },
  {
    mode: "24h",
    label: "Silenzia 24 ore",
    subtitle: "Tutto il giorno",
    Icon: Moon,
  },
  {
    mode: "forever",
    label: "Silenzia sempre",
    subtitle: "Nessun avviso push",
    Icon: VolumeX,
  },
];

export const NotificationMuteControl: React.FC<NotificationMuteControlProps> = ({
  mute,
  onChange,
  compact = false,
}) => {
  const groupId = useId();
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSelect = async (mode: NotificationMuteMode) => {
    if (saving || mute.mode === mode) return;
    setSaving(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/push/subscribe", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        mute?: NotificationMuteState;
        error?: string;
      };
      if (!res.ok || !data.ok || !data.mute) {
        setErrorMsg(data.error || "Impossibile aggiornare la preferenza.");
        return;
      }
      onChange(data.mute);
    } catch {
      setErrorMsg("Errore di rete durante il salvataggio della preferenza.");
    } finally {
      setSaving(false);
    }
  };

  let statusText =
    "Suoneria attiva: riceverai i promemoria delle 11:00, 16:00 e 22:00 e gli avvisi del medico.";
  if (mute.mode === "forever") {
    statusText =
      "Notifiche silenziate per sempre. I messaggi del medico restano sempre consultabili qui nel Centro Notifiche.";
  } else if ((mute.mode === "8h" || mute.mode === "24h") && mute.muteUntil) {
    statusText = `Notifiche silenziate fino a ${formatMuteUntilItalian(
      mute.muteUntil
    )}. Si riattiveranno automaticamente al termine.`;
  }

  return (
    <fieldset
      aria-busy={saving ? "true" : undefined}
      className={`border-t border-surface-variant/40 ${compact ? "pt-3 space-y-2.5" : "pt-3.5 space-y-3"}`}
    >
      <legend className="text-[11px] font-bold text-on-surface uppercase tracking-wider px-0.5">
        Suoneria e modalità silenziosa
      </legend>

      <div className="grid grid-cols-2 gap-2">
        {MUTE_OPTIONS.map((opt) => {
          const inputId = `${groupId}-${opt.mode}`;
          const isSelected = mute.mode === opt.mode;
          const Icon = opt.Icon;
          const isMuteOption = opt.mode !== "active";

          const cardStyle = isSelected
            ? isMuteOption
              ? "bg-secondary-container border-tertiary/50 text-on-secondary-container shadow-xs"
              : "bg-primary-container/30 border-primary/50 text-on-surface shadow-xs"
            : "bg-surface-container-lowest border-surface-variant/60 text-on-surface-variant hover:bg-surface-container";

          const iconStyle = isSelected
            ? isMuteOption
              ? "text-tertiary"
              : "text-primary"
            : "text-secondary";

          return (
            <div key={opt.mode} className="relative">
              <input
                id={inputId}
                type="radio"
                name={groupId}
                value={opt.mode}
                checked={isSelected}
                onChange={() => void handleSelect(opt.mode)}
                className="sr-only peer"
              />
              <label
                htmlFor={inputId}
                className={`min-h-[48px] px-3 py-2 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-colors select-none peer-focus-visible:outline peer-focus-visible:outline-[3px] peer-focus-visible:outline-primary peer-focus-visible:outline-offset-2 ${cardStyle}`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${iconStyle}`} aria-hidden="true" />
                <div className="min-w-0 leading-tight">
                  <span className="text-xs font-bold block truncate">{opt.label}</span>
                  <span className="text-[10px] opacity-80 block truncate">{opt.subtitle}</span>
                </div>
              </label>
            </div>
          );
        })}
      </div>

      <p
        role="status"
        className={`text-[11px] leading-relaxed ${
          errorMsg ? "text-error font-semibold" : "text-on-surface-variant"
        }`}
      >
        {errorMsg || statusText}
      </p>
    </fieldset>
  );
};
