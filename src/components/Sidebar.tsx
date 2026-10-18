"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Logo } from "./Logo";
import { logout } from "@/db/actions";
import { GestioneBiometriaModal } from "./modals/GestioneBiometriaModal";

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isBioOpen, setIsBioOpen] = useState(false);

  const handleLogout = async () => {
    setIsOpen(false);
    try {
      localStorage.removeItem("medico_user");
    } catch {}
    await logout();
    router.push("/login/medico");
  };

  // Close drawer on page navigation
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Handle ESC key and lock body scroll when mobile menu is open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const navItems = [
    {
      href: "/medico/dashboard",
      label: "Dashboard",
      icon: "dashboard",
    },
    {
      href: "/medico/pazienti",
      label: "Elenco Pazienti",
      icon: "group",
    },
    {
      href: "/medico/comunicazioni",
      label: "Centro Notifiche",
      icon: "campaign",
    },
    {
      href: "/medico/staff",
      label: "Gestione Studio",
      icon: "medical_services",
    },
  ];

  return (
    <>
      {/* Mobile Top Header Bar */}
      <header className="lg:hidden sticky top-0 left-0 right-0 h-16 bg-surface-container-low border-b border-surface-variant/40 px-4 flex items-center justify-between z-30 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            aria-label="Apri menu di navigazione"
            className="w-10 h-10 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <span className="material-symbols-outlined text-2xl">menu</span>
          </button>
          <div className="flex items-center gap-2">
            <Logo size={28} showText={true} />
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex flex-col text-right">
            <span className="text-xs font-bold text-on-surface leading-tight">Dott.ssa Pariggiano</span>
            <span className="text-[10px] text-primary font-semibold flex items-center justify-end gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
              Studio Attivo
            </span>
          </div>
          <div className="w-8 h-8 rounded-full bg-primary-container/40 text-primary flex items-center justify-center font-bold text-xs">
            IP
          </div>
        </div>
      </header>

      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-inverse-surface/40 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Drawer (Slide-Over on Mobile, Fixed on Desktop) */}
      <aside
        className={`fixed left-0 top-0 h-full w-72 bg-surface-container-low flex flex-col z-50 shadow-[0_1px_12px_rgba(46,50,48,0.05)] border-r border-surface-variant/40 transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Brand Header */}
        <div className="p-6 pb-4 flex items-center justify-between">
          <Logo size={42} showText={true} subtitle="Executive Analytics" />
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            aria-label="Chiudi menu"
            className="lg:hidden w-9 h-9 rounded-xl flex items-center justify-center text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/medico/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                  isActive
                    ? "bg-primary text-on-primary font-semibold shadow-sm shadow-primary/20"
                    : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                }`}
              >
                <span
                  className="material-symbols-outlined text-[22px]"
                  style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                >
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}

          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              setIsBioOpen(true);
            }}
            className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl font-medium text-sm text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-all duration-200"
          >
            <span className="material-symbols-outlined text-[22px]">fingerprint</span>
            <span>Accesso Rapido</span>
          </button>
        </nav>

        {/* Doctor User Footer */}
        <div className="p-4 m-4 rounded-2xl bg-surface-container/60 border border-surface-variant/50 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-container/40 text-primary flex items-center justify-center font-bold text-sm">
              IP
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-sm font-semibold text-on-surface truncate">
                Dott.ssa Ivana Pariggiano
              </span>
              <span className="text-xs text-secondary truncate">
                Specialista in Cardiologia
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-surface-variant/40 text-xs">
            <span className="flex items-center gap-1 text-primary font-semibold">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              Studio Attivo
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="text-error hover:underline flex items-center gap-1 font-medium"
            >
              <span className="material-symbols-outlined text-[16px]">logout</span>
              Esci
            </button>
          </div>
        </div>
      </aside>

      <GestioneBiometriaModal isOpen={isBioOpen} onClose={() => setIsBioOpen(false)} />
    </>
  );
};
