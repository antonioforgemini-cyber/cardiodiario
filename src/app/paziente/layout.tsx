import React from "react";

export default function PazienteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-surface font-body text-on-surface antialiased min-h-screen flex flex-col">
      {children}
    </div>
  );
}
