import React from "react";
import { Sidebar } from "@/components/Sidebar";

export default function MedicoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background text-on-surface">
      <Sidebar />
      <main className="flex-1 ml-72 min-h-screen bg-background">
        {children}
      </main>
    </div>
  );
}
