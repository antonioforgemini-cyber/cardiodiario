import React from "react";
import { Sidebar } from "@/components/Sidebar";

export default function MedicoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-on-surface">
      <Sidebar />
      <main className="lg:ml-72 min-h-screen bg-background">
        {children}
      </main>
    </div>
  );
}
