"use client";

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

type ToastVariant = "info" | "success" | "error";

interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  showToast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      showToast: () => {},
    };
  }
  return ctx;
}

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [liveAnnouncement, setLiveAnnouncement] = useState("");
  const regionRef = useRef<HTMLDivElement>(null);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const hoveredRef = useRef(false);

  const removeToast = useCallback((id: string) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const scheduleDismiss = useCallback(
    (id: string) => {
      const existing = timersRef.current.get(id);
      if (existing) clearTimeout(existing);
      const timer = setTimeout(() => {
        if (!hoveredRef.current) {
          removeToast(id);
        } else {
          scheduleDismiss(id);
        }
      }, 5000);
      timersRef.current.set(id, timer);
    },
    [removeToast]
  );

  const showToast = useCallback(
    (message: string, variant: ToastVariant = "info") => {
      // Do not surface background toasts while a modal dialog makes background inert
      if (typeof document !== "undefined" && document.querySelector("dialog:modal")) {
        // Still announce via ariaNotify or live region only if needed; skip visual toast overlay
        return;
      }

      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev.slice(-2), { id, message, variant }]);
      scheduleDismiss(id);

      const docAny = document as Document & { ariaNotify?: (msg: string) => void };
      if (typeof docAny.ariaNotify === "function") {
        docAny.ariaNotify(message);
      } else {
        setLiveAnnouncement("");
        setTimeout(() => setLiveAnnouncement(message), 40);
      }
    },
    [scheduleDismiss]
  );

  // Manage native popover="manual" top-layer visibility for the toast stack
  useEffect(() => {
    const el = regionRef.current as (HTMLDivElement & { showPopover?: () => void; hidePopover?: () => void }) | null;
    if (!el || typeof el.showPopover !== "function") return;

    try {
      if (toasts.length > 0) {
        if (!el.matches(":popover-open")) el.showPopover();
      } else if (el.matches(":popover-open")) {
        el.hidePopover();
      }
    } catch {
      // Ignore if popover API not ready
    }
  }, [toasts.length]);

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((t) => clearTimeout(t));
      timers.clear();
    };
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      <p className="visually-hidden">Annunci di stato</p>
      <div aria-live="polite" aria-atomic="true" className="visually-hidden">
        {liveAnnouncement}
      </div>

      <div
        ref={regionRef}
        role="region"
        aria-label="Notifiche di sistema"
        {...({ popover: "manual" } as Record<string, string>)}
        onMouseEnter={() => {
          hoveredRef.current = true;
        }}
        onMouseLeave={() => {
          hoveredRef.current = false;
        }}
        onFocusCapture={() => {
          hoveredRef.current = true;
        }}
        onBlurCapture={() => {
          hoveredRef.current = false;
        }}
        className="app-toast-region"
      >
        {toasts.map((toast) => {
          const styles =
            toast.variant === "error"
              ? "bg-error-container text-on-error-container border-error/40"
              : toast.variant === "success"
              ? "bg-surface-container-lowest text-on-surface border-primary/40"
              : "bg-surface-container-lowest text-on-surface border-surface-variant";

          const Icon =
            toast.variant === "error"
              ? AlertCircle
              : toast.variant === "success"
              ? CheckCircle2
              : Info;

          const iconColor =
            toast.variant === "error"
              ? "text-error"
              : toast.variant === "success"
              ? "text-primary"
              : "text-tertiary";

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-2xl border shadow-terra-lg text-sm leading-snug ${styles}`}
            >
              <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${iconColor}`} aria-hidden="true" />
              <span className="flex-1 font-medium">{toast.message}</span>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                aria-label="Chiudi notifica"
                className="min-w-[32px] min-h-[32px] rounded-lg flex items-center justify-center text-secondary hover:bg-surface-container transition-colors shrink-0"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};
