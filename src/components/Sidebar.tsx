"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./Logo";

export const Sidebar: React.FC = () => {
  const pathname = usePathname();

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
    <aside className="fixed left-0 top-0 h-full w-72 bg-surface-container-low flex flex-col z-50 shadow-[0_1px_12px_rgba(46,50,48,0.05)] border-r border-surface-variant/40">
      {/* Brand Header */}
      <div className="p-6 pb-4">
        <Logo size={42} showText={true} subtitle="Executive Analytics" />
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/medico/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
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
              Cardiologia • A.O. Caserta
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-surface-variant/40 text-xs">
          <span className="flex items-center gap-1 text-primary font-semibold">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            Studio Attivo
          </span>
          <Link
            href="/login/medico"
            className="text-error hover:underline flex items-center gap-1 font-medium"
          >
            <span className="material-symbols-outlined text-[16px]">logout</span>
            Esci
          </Link>
        </div>
      </div>
    </aside>
  );
};
