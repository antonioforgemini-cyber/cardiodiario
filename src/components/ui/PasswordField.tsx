"use client";

import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface PasswordFieldProps {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: "current-password" | "new-password";
  placeholder?: string;
  required?: boolean;
  minLength?: number;
  hint?: string;
  enterKeyHint?: "done" | "next" | "enter";
  error?: string | null;
}

export const PasswordField: React.FC<PasswordFieldProps> = ({
  id,
  name,
  label,
  value,
  onChange,
  autoComplete,
  placeholder = "••••••••••••",
  required = true,
  minLength,
  hint,
  enterKeyHint = "done",
  error,
}) => {
  const [visible, setVisible] = useState(false);
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="text-xs font-bold text-on-surface uppercase tracking-wider block"
      >
        {label}
      </label>

      {hint && (
        <p id={hintId} className="text-xs text-on-surface-variant leading-snug">
          {hint}
        </p>
      )}

      <div className="relative">
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          required={required}
          minLength={minLength}
          enterKeyHint={enterKeyHint}
          placeholder={placeholder}
          aria-describedby={describedBy}
          aria-invalid={error ? "true" : "false"}
          className="w-full min-h-[48px] pl-4 pr-12 bg-surface-container-low rounded-xl text-sm font-medium focus:bg-surface-bright focus:outline-none border border-surface-variant/60 transition-colors"
        />
        <button
          type="button"
          onClick={() => setVisible((prev) => !prev)}
          aria-pressed={visible}
          aria-label={visible ? "Nascondi password" : "Mostra password"}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 min-w-[40px] min-h-[40px] rounded-lg flex items-center justify-center text-secondary hover:text-on-surface hover:bg-surface-container transition-colors"
        >
          {visible ? (
            <EyeOff className="w-5 h-5" aria-hidden="true" />
          ) : (
            <Eye className="w-5 h-5" aria-hidden="true" />
          )}
        </button>
      </div>

      {error && (
        <p id={errorId} className="text-xs font-semibold text-error">
          {error}
        </p>
      )}
    </div>
  );
};
