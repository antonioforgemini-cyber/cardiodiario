"use client";

import React, { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";
import {
  markAppInstalled,
  setDeferredInstallPrompt,
  type BeforeInstallPromptEvent,
} from "@/lib/pwa-install-store";

export const PwaManager: React.FC = () => {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    setIsOffline(!navigator.onLine);
    const onOnline = () => setIsOffline(false);
    const onOffline = () => setIsOffline(true);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    const navProto =
      typeof Navigator !== "undefined"
        ? (Navigator.prototype as Navigator & { install?: () => Promise<void> })
        : null;
    const supportsWebInstall = Boolean(navProto && typeof navProto.install === "function");

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      if (!supportsWebInstall) {
        setDeferredInstallPrompt(event as BeforeInstallPromptEvent);
      }
    };

    const onAppInstalled = () => {
      markAppInstalled();
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);

    let registration: ServiceWorkerRegistration | undefined;
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/", updateViaCache: "none" })
        .then((reg) => {
          registration = reg;
        })
        .catch(() => {
          // Silent failure in restricted/private environments
        });
    }

    const onVisibility = () => {
      if (document.visibilityState === "visible" && registration) {
        registration.update().catch(() => {});
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-3 left-1/2 -translate-x-1/2 z-[110] max-w-[calc(100vw-2rem)] bg-inverse-surface text-inverse-on-surface px-4 py-2.5 rounded-2xl shadow-terra-lg flex items-center gap-2.5 text-xs font-semibold"
    >
      <WifiOff className="w-4 h-4 text-primary-fixed shrink-0" aria-hidden="true" />
      <span>Connessione assente — ricollegati per salvare le misurazioni.</span>
    </div>
  );
};
