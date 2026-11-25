"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Fingerprint,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  Stethoscope,
  Users,
  X,
} from "lucide-react";
import { Logo } from "./Logo";
import { getProfiloMedico, logout } from "@/db/actions";
import { GestioneBiometriaModal } from "./modals/GestioneBiometriaModal";

interface MedicoSummary {
  nome: string;
  cognome: string;
  specializzazione: string;
}

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isBioOpen, setIsBioOpen] = useState(false);
  const [medico, setMedico] = useState<MedicoSummary>({
    nome: "Ivana",
    cognome: "Pariggiano",
    specializzazione: "Specialista in Cardiologia",
  });

  const drawerRef = useRef<HTMLDialogElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const hasBeenVisibleRef = useRef(false);

  useEffect(() => {
    let active = true;
    getProfiloMedico()
      .then((res) => {
        if (active && res) {
          setMedico({
            nome: res.nome,
            cognome: res.cognome,
            specializzazione: res.specializzazione,
          });
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const initials = `${medico.nome.charAt(0)}${medico.cognome.charAt(0)}`.toUpperCase() || "MD";
  const fullName = `Dott.ssa ${medico.nome} ${medico.cognome}`;
  const shortName = `Dott.ssa ${medico.cognome}`;

  const closeDrawer = useCallback(() => {
    const drawer = drawerRef.current;
    const scroller = scrollerRef.current;
    if (!drawer?.open) {
      setIsOpen(false);
      return;
    }
    if (scroller && scroller.offsetWidth > 0) {
      scroller.scrollTo({ left: scroller.offsetWidth, behavior: "auto" });
      // Safety fallback if IntersectionObserver doesn't fire (e.g. reduced motion or test env)
      setTimeout(() => {
        if (drawerRef.current?.open && !hasBeenVisibleRef.current) {
          drawerRef.current.close();
          setIsOpen(false);
        }
      }, 450);
    } else {
      drawer.close();
      setIsOpen(false);
    }
  }, []);

  const openDrawer = useCallback(async () => {
    const drawer = drawerRef.current;
    const scroller = scrollerRef.current;
    if (!drawer || !scroller) return;

    hasBeenVisibleRef.current = false;
    if (!drawer.open) {
      drawer.showModal();
    }
    setIsOpen(true);

    if (!CSS.supports("scroll-initial-target", "nearest")) {
      scroller.scrollTo({ left: scroller.offsetWidth, behavior: "instant" as ScrollBehavior });
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      );
    }

    if (drawer.open) {
      scroller.scrollTo({ left: 0, behavior: "auto" });
    }
  }, []);

  // Close drawer cleanly on route navigation
  useEffect(() => {
    if (drawerRef.current?.open) {
      drawerRef.current.close();
    }
    hasBeenVisibleRef.current = false;
    setIsOpen(false);
  }, [pathname]);

  // IntersectionObserver + scroll backdrop fallback + native cancel/click-outside handling
  useEffect(() => {
    const drawer = drawerRef.current;
    const scroller = scrollerRef.current;
    const sheet = sheetRef.current;
    if (!drawer || !scroller || !sheet) return;

    const visibleThreshold = 1 / Math.max(window.innerWidth, 320);

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries.at(-1);
        if (!entry || !drawer.open) return;

        if (entry.intersectionRatio >= 0.95) {
          hasBeenVisibleRef.current = true;
          setIsOpen(true);
        } else if (entry.intersectionRatio >= visibleThreshold) {
          hasBeenVisibleRef.current = true;
        } else if (hasBeenVisibleRef.current && entry.intersectionRatio < visibleThreshold) {
          hasBeenVisibleRef.current = false;
          drawer.close();
          setIsOpen(false);
        }
      },
      { root: drawer, threshold: [visibleThreshold, 0.95] }
    );

    observer.observe(sheet);

    const supportsScrollTimeline = CSS.supports("animation-timeline", "scroll()");
    const onScroll = () => {
      if (!supportsScrollTimeline && sheet.offsetWidth > 0) {
        const ratio = Math.max(0, Math.min(1, 1 - scroller.scrollLeft / sheet.offsetWidth));
        drawer.style.setProperty("--drawer-backdrop", String(ratio));
      }
    };
    if (!supportsScrollTimeline) {
      scroller.addEventListener("scroll", onScroll, { passive: true });
    }

    const onDrawerClick = (event: MouseEvent) => {
      if (!sheet.contains(event.target as Node)) {
        closeDrawer();
      }
    };

    const onCancel = (event: Event) => {
      event.preventDefault();
      closeDrawer();
    };

    drawer.addEventListener("click", onDrawerClick);
    drawer.addEventListener("cancel", onCancel);

    return () => {
      observer.disconnect();
      if (!supportsScrollTimeline) {
        scroller.removeEventListener("scroll", onScroll);
      }
      drawer.removeEventListener("click", onDrawerClick);
      drawer.removeEventListener("cancel", onCancel);
    };
  }, [closeDrawer]);

  const handleLogout = async () => {
    if (drawerRef.current?.open) drawerRef.current.close();
    setIsOpen(false);
    try {
      localStorage.removeItem("medico_user");
    } catch {}
    await logout();
    router.push("/login/medico");
  };

  const navItems = [
    { href: "/medico/dashboard", label: "Dashboard", Icon: LayoutDashboard },
    { href: "/medico/pazienti", label: "Elenco Pazienti", Icon: Users },
    { href: "/medico/comunicazioni", label: "Centro Notifiche", Icon: Megaphone },
    { href: "/medico/staff", label: "Gestione Studio", Icon: Stethoscope },
  ];

  const renderNavContent = (isMobile: boolean) => (
    <>
      <div className="p-6 pb-4 flex items-center justify-between">
        <Logo size={42} showText={true} subtitle="Portale Medico" />
        {isMobile && (
          <button
            type="button"
            autoFocus
            onClick={closeDrawer}
            aria-label="Chiudi menu di navigazione"
            className="min-w-[40px] min-h-[40px] rounded-xl flex items-center justify-center text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        )}
      </div>

      <nav
        aria-label={isMobile ? "Navigazione principale mobile" : "Navigazione principale studio"}
        className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto"
      >
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/medico/dashboard" && pathname.startsWith(item.href));
          const Icon = item.Icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              onClick={() => {
                if (isMobile) closeDrawer();
              }}
              className={`flex items-center gap-3.5 px-4 min-h-[46px] py-2.5 rounded-xl font-medium text-sm transition-colors ${
                isActive
                  ? "bg-primary text-on-primary font-semibold shadow-sm"
                  : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          );
        })}

        <button
          type="button"
          onClick={() => {
            if (isMobile) {
              if (drawerRef.current?.open) drawerRef.current.close();
              setIsOpen(false);
            }
            setIsBioOpen(true);
          }}
          className="w-full flex items-center gap-3.5 px-4 min-h-[46px] py-2.5 rounded-xl font-medium text-sm text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors text-left"
        >
          <Fingerprint className="w-5 h-5 shrink-0" aria-hidden="true" />
          <span>Accesso Rapido</span>
        </button>
      </nav>

      <div className="p-4 m-4 rounded-2xl bg-surface-container/70 border border-surface-variant/50 space-y-3">
        <div className="flex items-center gap-3">
          <div
            aria-hidden="true"
            className="w-10 h-10 rounded-full bg-primary-container/45 text-primary flex items-center justify-center font-bold text-sm shrink-0"
          >
            {initials}
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-sm font-semibold text-on-surface truncate">
              {fullName}
            </span>
            <span className="text-xs text-secondary truncate">
              {medico.specializzazione}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-surface-variant/40 text-xs">
          <span className="flex items-center gap-1.5 text-primary font-semibold">
            <span className="w-2 h-2 rounded-full bg-primary" aria-hidden="true" />
            Studio Attivo
          </span>
          <button
            type="button"
            onClick={handleLogout}
            className="text-error hover:underline flex items-center gap-1 font-semibold min-h-[36px] px-1.5"
          >
            <LogOut className="w-4 h-4" aria-hidden="true" />
            <span>Esci</span>
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Top Header Bar */}
      <header className="lg:hidden sticky top-0 left-0 right-0 h-16 bg-surface-container-low/95 backdrop-blur-md border-b border-surface-variant/40 px-4 flex items-center justify-between z-30 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => void openDrawer()}
            aria-label="Apri menu di navigazione"
            aria-expanded={isOpen}
            aria-controls="mobile-nav-drawer"
            className="min-w-[44px] min-h-[44px] rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface flex items-center justify-center transition-colors"
          >
            <Menu className="w-5 h-5" aria-hidden="true" />
          </button>
          <Logo size={28} showText={true} />
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex flex-col text-right">
            <span className="text-xs font-bold text-on-surface leading-tight">{shortName}</span>
            <span className="text-[11px] text-primary font-semibold flex items-center justify-end gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" aria-hidden="true" />
              Studio Attivo
            </span>
          </div>
          <div
            aria-hidden="true"
            className="w-8 h-8 rounded-full bg-primary-container/45 text-primary flex items-center justify-center font-bold text-xs"
          >
            {initials}
          </div>
        </div>
      </header>

      {/* Native Mobile Scroll-Snap Drawer */}
      <dialog
        ref={drawerRef}
        id="mobile-nav-drawer"
        aria-label="Menu di navigazione"
        className="app-drawer lg:hidden"
      >
        <div ref={scrollerRef} className="app-drawer-scroller">
          <div
            ref={sheetRef}
            className="app-drawer-sheet w-full bg-surface-container-low flex flex-col border-r border-surface-variant/40 shadow-terra-lg"
          >
            {renderNavContent(true)}
          </div>
        </div>
      </dialog>

      {/* Fixed Desktop Sidebar */}
      <aside
        aria-label="Menu studio medico"
        className="hidden lg:flex fixed left-0 top-0 h-full w-72 bg-surface-container-low flex-col z-40 shadow-terra border-r border-surface-variant/40"
      >
        {renderNavContent(false)}
      </aside>

      <GestioneBiometriaModal isOpen={isBioOpen} onClose={() => setIsBioOpen(false)} />
    </>
  );
};
