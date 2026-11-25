import type { Metadata } from "next";
import React from "react";
import { Sidebar } from "@/components/Sidebar";
import { SkipLink } from "@/components/ui/SkipLink";

export const metadata: Metadata = {
  title: "Area Medico",
};

export default function MedicoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-on-surface">
      <SkipLink />
      <Sidebar />
      <main id="main-content" tabIndex={-1} className="lg:ml-72 min-h-screen bg-background">
        {children}
      </main>
    </div>
  );
}
