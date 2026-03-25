"use client";

import { Plus } from "lucide-react";

interface TopBarProps {
  clinicName?: string;
}

export function TopBar({ clinicName = "Clinica del Sureste" }: TopBarProps) {
  const today = new Date().toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <header
      className="h-12 flex items-center justify-between px-6 border-b"
      style={{
        background: "var(--bg-card)",
        borderColor: "var(--border)",
      }}
    >
      <div className="flex items-center gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
        <Plus className="h-4 w-4" style={{ color: "var(--primary)" }} />
        <span className="font-medium" style={{ color: "var(--text-primary)" }}>
          {clinicName}
        </span>
      </div>
      <div className="text-sm" style={{ color: "var(--text-muted)" }}>
        {today}
      </div>
    </header>
  );
}
