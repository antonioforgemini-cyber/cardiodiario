"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

let cachedDisplayTransition: boolean | undefined;

function canTransitionDisplay(): boolean {
  if (cachedDisplayTransition !== undefined) return cachedDisplayTransition;
  if (typeof window === "undefined" || !window.CSS?.supports?.("transition-behavior", "allow-discrete") || !document.body) {
    return false;
  }
  const probe = document.createElement("div");
  probe.style.cssText = "transition: display 1s allow-discrete !important; display: block;";
  document.body.appendChild(probe);
  void getComputedStyle(probe).display;
  probe.style.display = "none";
  cachedDisplayTransition = getComputedStyle(probe).display === "block";
  probe.remove();
  return cachedDisplayTransition;
}

function supportsTopLayerExit(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(window.CSS?.supports?.("overlay", "auto")) && canTransitionDisplay();
}

export async function closeDialogWithAnimation(dialog: HTMLDialogElement) {
  if (!dialog.open) return;
  if (!supportsTopLayerExit()) {
    dialog.setAttribute("data-closing", "");
    const animations = dialog.getAnimations?.({ subtree: true }) ?? [];
    if (animations.length > 0) {
      await Promise.race([
        Promise.allSettled(animations.map((a) => a.finished)),
        new Promise<void>((resolve) => setTimeout(resolve, 400)),
      ]);
    }
    if (!dialog.hasAttribute("data-closing")) return;
    dialog.removeAttribute("data-closing");
  }
  if (dialog.open) {
    dialog.close();
  }
}

interface AppDialogProps {
  isOpen: boolean;
  onClose: () => void;
  labelledBy?: string;
  ariaLabel?: string;
  dismissible?: boolean;
  variant?: "center" | "sheet" | "fullscreen-print";
  maxWidthClassName?: string;
  panelClassName?: string;
  portalId?: string;
  children: React.ReactNode;
}

/**
 * Dialogo modale nativo (<dialog>.showModal()) accessibile e top-layer:
 * - gestisce Esc, inert automatico sul documento, ritorno del focus,
 * - fallback light-dismiss su Safari (quando HTMLDialogElement.closedBy manca),
 * - fallback animazione d'uscita su Safari/Firefox via data-closing.
 */
export const AppDialog: React.FC<AppDialogProps> = ({
  isOpen,
  onClose,
  labelledBy,
  ariaLabel,
  dismissible = true,
  variant = "sheet",
  maxWidthClassName = "max-w-lg",
  panelClassName = "",
  portalId,
  children,
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const requestClose = useCallback(async () => {
    if (!dismissible) return;
    const dialog = dialogRef.current;
    if (dialog && dialog.open) {
      await closeDialogWithAnimation(dialog);
    }
    onClose();
  }, [dismissible, onClose]);

  // Sync isOpen prop with native top-layer <dialog>
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !mounted) return;

    if (isOpen) {
      dialog.removeAttribute("data-closing");
      if (!dialog.open) {
        dialog.showModal();
      }
    } else if (dialog.open) {
      void closeDialogWithAnimation(dialog);
    }
  }, [isOpen, mounted]);

  // Intercept native cancel (Esc / Android back / closedby)
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !mounted) return;

    const handleCancel = (event: Event) => {
      event.preventDefault();
      if (dismissible) {
        void requestClose();
      }
    };

    const handleNativeClose = () => {
      if (isOpen && dismissible) {
        onClose();
      }
    };

    dialog.addEventListener("cancel", handleCancel);
    dialog.addEventListener("close", handleNativeClose);
    return () => {
      dialog.removeEventListener("cancel", handleCancel);
      dialog.removeEventListener("close", handleNativeClose);
    };
  }, [dismissible, isOpen, mounted, onClose, requestClose]);

  // Fallback light-dismiss (pointerdown + pointerup outside panel) for browsers without closedBy
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !isOpen || !dismissible || !mounted) return;

    const hasNativeClosedBy = "closedBy" in HTMLDialogElement.prototype;
    let pressedOutside = false;

    const isOutsidePanel = (clientX: number, clientY: number) => {
      const targetEl = panelRef.current;
      if (!targetEl) return false;
      const r = targetEl.getBoundingClientRect();
      return clientX < r.left || clientX > r.right || clientY < r.top || clientY > r.bottom;
    };

    const onPointerDown = (e: PointerEvent) => {
      pressedOutside = isOutsidePanel(e.clientX, e.clientY);
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!hasNativeClosedBy && pressedOutside && isOutsidePanel(e.clientX, e.clientY)) {
        void requestClose();
      }
      pressedOutside = false;
    };

    // For browsers supporting closedBy="any", clicking backdrop closes synchronously without exit transition;
    // intercepting backdrop pointerdown/up when !supportsTopLayerExit keeps exit animations consistent.
    const onNativeClosedByFallback = (e: PointerEvent) => {
      if (hasNativeClosedBy && !supportsTopLayerExit() && pressedOutside && isOutsidePanel(e.clientX, e.clientY)) {
        // Let closedBy handle or close gently; no extra handling needed when closedBy="any" is active
      }
      void e;
    };

    dialog.addEventListener("pointerdown", onPointerDown);
    dialog.addEventListener("pointerup", onPointerUp);
    dialog.addEventListener("pointerup", onNativeClosedByFallback);
    return () => {
      dialog.removeEventListener("pointerdown", onPointerDown);
      dialog.removeEventListener("pointerup", onPointerUp);
      dialog.removeEventListener("pointerup", onNativeClosedByFallback);
    };
  }, [dismissible, isOpen, mounted, requestClose]);

  if (!mounted || !isOpen) return null;

  const layoutClass =
    variant === "fullscreen-print"
      ? "app-dialog flex-col items-stretch justify-start overflow-y-auto"
      : variant === "center"
      ? "app-dialog items-center justify-center p-4"
      : "app-dialog items-end sm:items-center justify-center p-0 sm:p-4";

  const surfaceClass =
    variant === "fullscreen-print"
      ? `w-full min-h-full flex flex-col ${panelClassName}`
      : variant === "center"
      ? `bg-surface-container-lowest w-full ${maxWidthClassName} rounded-3xl shadow-2xl border border-surface-variant/50 max-h-[92vh] flex flex-col overflow-hidden ${panelClassName}`
      : `bg-surface-container-lowest w-full ${maxWidthClassName} rounded-t-3xl sm:rounded-3xl shadow-2xl border-t sm:border border-surface-variant/50 max-h-[90vh] flex flex-col overflow-hidden ${panelClassName}`;

  const dialogNode = (
    <dialog
      ref={dialogRef}
      id={portalId}
      className={layoutClass}
      aria-labelledby={labelledBy}
      aria-label={ariaLabel}
      {...({ closedby: dismissible ? "any" : "none" } as Record<string, string>)}
    >
      {variant === "fullscreen-print" ? (
        <div ref={panelRef} className={surfaceClass}>
          {children}
        </div>
      ) : (
        <div ref={panelRef} className={surfaceClass}>
          {variant === "sheet" && (
            <div className="sm:hidden pt-3 pb-1 flex justify-center flex-shrink-0 no-print" aria-hidden="true">
              <div className="w-12 h-1.5 bg-outline/25 rounded-full" />
            </div>
          )}
          {children}
        </div>
      )}
    </dialog>
  );

  if (portalId) {
    return createPortal(dialogNode, document.body);
  }

  return dialogNode;
};
