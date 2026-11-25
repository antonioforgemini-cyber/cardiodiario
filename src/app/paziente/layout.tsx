import type { Metadata } from "next";
import React from "react";
import { SkipLink } from "@/components/ui/SkipLink";

export const metadata: Metadata = {
  title: "Area Paziente",
};

export default function PazienteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-surface font-body text-on-surface antialiased min-h-screen flex flex-col">
      <SkipLink />
      {children}
    </div>
  );
}
