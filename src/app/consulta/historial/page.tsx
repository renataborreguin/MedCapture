"use client";

import { useState, useEffect, useMemo } from "react";
import { Clock } from "lucide-react";
import Link from "next/link";
import { getInitials } from "@/lib/format";

interface Nota {
  id: string;
  paciente_id: string;
  paciente_nombre: string | null;
  fecha: string;
  hora: string;
  padecimiento_actual: string;
  diagnosticos: string;
  created_at: string;
}

export default function HistorialGlobalPage() {
  const [notas, setNotas] = useState<Nota[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/notas")
      .then((res) => res.json())
      .then((data) => setNotas(data.notas || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - mondayOffset);
    weekStart.setHours(0, 0, 0, 0);
    const weekStartStr = weekStart.toISOString().slice(0, 10);

    const monthStartStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

    let today = 0;
    let week = 0;
    let month = 0;

    for (const n of notas) {
      const noteDate = (n.created_at || n.fecha || "").slice(0, 10);
      if (noteDate >= monthStartStr) month++;
      if (noteDate >= weekStartStr) week++;
      if (noteDate === todayStr) today++;
    }

    return { today, week, month };
  }, [notas]);

  const formatHora = (hora: string) => {
    if (!hora) return "";
    return hora.slice(0, 5); // "HH:MM"
  };

  const getMotivo = (nota: Nota): string => {
    try {
      const diags = JSON.parse(nota.diagnosticos || "[]");
      if (Array.isArray(diags) && diags.length > 0) {
        const first = diags[0];
        return typeof first === "string" ? first : first.descripcion || first.codigo || "";
      }
    } catch {}
    const pa = nota.padecimiento_actual || "";
    return pa.length > 50 ? pa.slice(0, 50) + "..." : pa || "Consulta";
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
        Historial de Consultas
      </h1>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Hoy", value: stats.today },
          { label: "Esta semana", value: stats.week },
          { label: "Este mes", value: stats.month },
        ].map((s) => (
          <div
            key={s.label}
            className="p-4 rounded-xl"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
          >
            <div className="text-2xl font-bold" style={{ color: "var(--primary)" }}>
              {loading ? "-" : s.value}
            </div>
            <div className="text-sm" style={{ color: "var(--text-muted)" }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      <div>
        <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--text-secondary)" }}>
          Consultas recientes
        </h2>

        {loading ? (
          <div className="text-sm py-8 text-center" style={{ color: "var(--text-muted)" }}>
            Cargando historial...
          </div>
        ) : notas.length === 0 ? (
          <div className="text-sm py-8 text-center" style={{ color: "var(--text-muted)" }}>
            No hay consultas registradas aún.
          </div>
        ) : (
          <div className="space-y-2">
            {notas.map((n) => (
              <Link
                key={n.id}
                href={`/consulta/${n.paciente_id}`}
                className="flex items-center gap-4 p-4 rounded-xl no-underline transition-colors hover:opacity-90"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
              >
                <div
                  className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-medium shrink-0"
                  style={{ background: "var(--primary-light)", color: "var(--primary)" }}
                >
                  {getInitials(n.paciente_nombre || "??")}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">
                    {n.paciente_nombre || "Paciente desconocido"}
                  </div>
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {getMotivo(n)}
                  </div>
                </div>
                <div className="text-sm" style={{ color: "var(--text-muted)" }}>
                  {formatHora(n.hora)}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
