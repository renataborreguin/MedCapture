"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { FileText, FlaskConical } from "lucide-react";

interface Nota {
  id: string;
  created_at: string;
  keywords_originales: string;
  padecimiento_actual: string;
}

export default function LaboratoriosPage() {
  const params = useParams();
  const [estudios, setEstudios] = useState<{ texto: string; fecha: string; motivo: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/notas?paciente_id=${params.pacienteId}`)
      .then((res) => res.json())
      .then((data) => {
        const notas: Nota[] = data.notas || [];
        const parsed = notas
          .filter((n) => {
            const kw = n.keywords_originales || "";
            return kw.toLowerCase().includes("estudio") || kw.toLowerCase().includes("bh") || kw.toLowerCase().includes("qs") || kw.toLowerCase().includes("usg") || kw.toLowerCase().includes("rx") || kw.toLowerCase().includes("lab");
          })
          .map((n) => ({
            texto: extractEstudios(n.keywords_originales),
            fecha: formatDate(n.created_at),
            motivo: n.padecimiento_actual || "Consulta",
          }));
        setEstudios(parsed);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [params.pacienteId]);

  if (loading) {
    return (
      <div className="text-center py-12 text-sm" style={{ color: "var(--text-muted)" }}>
        Cargando estudios...
      </div>
    );
  }

  if (estudios.length === 0) {
    return (
      <div
        className="text-center py-16 rounded-xl"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
      >
        <FlaskConical className="h-8 w-8 mx-auto mb-3" style={{ color: "var(--text-muted)" }} />
        <div className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
          No hay estudios registrados
        </div>
        <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
          Los estudios solicitados durante una consulta aparecerán aquí.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {estudios.map((estudio, i) => (
        <div
          key={i}
          className="card flex items-center gap-4 px-4 py-3"
        >
          <div
            className="shrink-0"
            style={{ background: "var(--primary)", width: 4, height: "100%", minHeight: 32, borderRadius: 2 }}
          />
          <FileText className="h-5 w-5 shrink-0" style={{ color: "var(--text-muted)" }} />
          <div className="flex-1">
            <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
              {estudio.texto}
            </div>
            <div className="text-xs" style={{ color: "var(--text-muted)" }}>
              {estudio.fecha} · {estudio.motivo}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function extractEstudios(keywords: string): string {
  const parts = keywords.split("|").map((p) => p.trim());
  const match = parts.find((p) => p.toLowerCase().includes("estudio") || p.toLowerCase().includes("bh") || p.toLowerCase().includes("qs") || p.toLowerCase().includes("usg") || p.toLowerCase().includes("rx") || p.toLowerCase().includes("lab"));
  return match || keywords.slice(0, 80);
}

function formatDate(iso: string): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch {
    return iso;
  }
}
