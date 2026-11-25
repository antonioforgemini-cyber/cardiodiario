import Link from "next/link";
import { ArrowRight, ShieldCheck, Stethoscope, UserRound } from "lucide-react";
import { Logo } from "@/components/Logo";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background flex flex-col justify-between p-6 md:p-12">
      <header className="max-w-5xl mx-auto w-full flex items-center justify-between pb-8 border-b border-surface-variant/40">
        <Logo size={44} showText={true} subtitle="Salute Cardiovascolare" />
        <div className="hidden sm:flex items-center gap-2 text-xs font-semibold px-3.5 py-1.5 rounded-full bg-secondary-container text-on-secondary-container">
          <ShieldCheck className="w-4 h-4 text-primary" aria-hidden="true" />
          <span>Linee Guida ESC/ESH 2026</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto w-full my-auto py-12 flex flex-col items-center text-center space-y-10">
        <div className="space-y-4 max-w-2xl">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-container/30 text-primary text-xs font-bold tracking-wide uppercase">
            <span className="w-2 h-2 rounded-full bg-primary" aria-hidden="true" />
            <span>Monitoraggio Domiciliare Connesso</span>
          </span>
          <h1 className="text-4xl md:text-5xl font-headline font-bold text-on-surface tracking-tight leading-tight">
            Il tuo diario pressorio, sempre vicino al tuo medico.
          </h1>
          <p className="text-base md:text-lg text-on-surface-variant font-body leading-relaxed">
            Una piattaforma clinica progettata per registrare le misurazioni con semplicità e consentire al tuo specialista di seguire l&apos;andamento della terapia in tempo reale.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl text-left">
          <Link
            href="/login/paziente"
            className="group relative bg-surface-container-lowest hover:bg-surface-container-low p-6 md:p-8 rounded-3xl border border-surface-variant/50 shadow-terra hover:shadow-terra-lg hover:border-primary/40 transition-all duration-300 flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-primary-container/40 text-primary flex items-center justify-center group-hover:scale-105 transition-transform">
                <UserRound className="w-7 h-7" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-xl font-headline font-bold text-on-surface group-hover:text-primary transition-colors">
                  Area Paziente
                </h2>
                <p className="text-sm text-on-surface-variant mt-1 leading-relaxed">
                  Accedi con il tuo Codice Fiscale e il PIN a 6 cifre rilasciato dal medico per compilare il tuo diario.
                </p>
              </div>
            </div>
            <div className="mt-8 flex items-center gap-2 text-sm font-bold text-primary">
              <span>Entra nel Diario</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
            </div>
          </Link>

          <Link
            href="/login/medico"
            className="group relative bg-surface-container-lowest hover:bg-surface-container-low p-6 md:p-8 rounded-3xl border border-surface-variant/50 shadow-terra hover:shadow-terra-lg hover:border-primary/40 transition-all duration-300 flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-secondary-container text-tertiary flex items-center justify-center group-hover:scale-105 transition-transform">
                <Stethoscope className="w-7 h-7" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-xl font-headline font-bold text-on-surface group-hover:text-primary transition-colors">
                  Area Medico
                </h2>
                <p className="text-sm text-on-surface-variant mt-1 leading-relaxed">
                  Accedi con le tue credenziali di studio per seguire i pazienti, consultare i grafici e inviare comunicazioni.
                </p>
              </div>
            </div>
            <div className="mt-8 flex items-center gap-2 text-sm font-bold text-primary">
              <span>Accesso Specialista</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
            </div>
          </Link>
        </div>
      </main>

      <footer className="max-w-5xl mx-auto w-full pt-8 border-t border-surface-variant/40 flex flex-col sm:flex-row items-center justify-between text-xs text-secondary gap-4">
        <p>© 2026 CardioDiario — Monitoraggio Pressorio Clinico Domiciliare.</p>
        <p className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-primary" aria-hidden="true" />
          <span>Conforme alle linee guida per la telemedicina cardiologica</span>
        </p>
      </footer>
    </div>
  );
}
