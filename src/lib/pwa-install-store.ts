"use client";

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export interface InstallStoreSnapshot {
  hasPrompt: boolean;
  installed: boolean;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let installed = false;
let snapshot: InstallStoreSnapshot = { hasPrompt: false, installed: false };
const listeners = new Set<() => void>();

function notify() {
  snapshot = {
    hasPrompt: Boolean(deferredPrompt),
    installed,
  };
  listeners.forEach((cb) => cb());
}

export function setDeferredInstallPrompt(ev: BeforeInstallPromptEvent | null) {
  deferredPrompt = ev;
  if (ev) {
    installed = false;
  }
  notify();
}

/**
 * Restituisce e azzera immediatamente l'evento monouso prima dell'await.
 */
export function consumeDeferredInstallPrompt(): BeforeInstallPromptEvent | null {
  const current = deferredPrompt;
  deferredPrompt = null;
  notify();
  return current;
}

export function markAppInstalled() {
  deferredPrompt = null;
  installed = true;
  notify();
}

export function getInstallStoreSnapshot(): InstallStoreSnapshot {
  return snapshot;
}

export function subscribeInstallStore(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}
