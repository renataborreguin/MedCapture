"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { Loader2, FileX } from "lucide-react";
import { useToast } from "@/components/toast";

interface Nota {
  id: string;
  paciente_id: string;
  padecimiento_actual: string;
  diagnosticos: string;
  created_at: string;
  created_by: string;
  paciente_nombre?: string;
}

export default function HistorialPage() {
  const { pacienteId } = useParams<{ pacienteId: string }>();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [notas, setNotas] = useState<Nota[]>([]);

  const fetchNotas = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/notas?paciente_id=${pacienteId}`);
      if (!res.ok) throw new Error("No se pudieron cargar las notas");
      const json = await res.json();
      setNotas(json.notas || []);
    } catch {
      showToast("Error al cargar historial", "warning");
    } finally {
      setLoading(false);
    }
  }, [pacienteId, showToast]);

  useEffect(() => {
    fetchNotas();
  }, [fetchNotas]);

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" });
    } catch {
      return iso;
    }
  };

  const parseDiagnosticos = (raw: string): string => {
    try {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr) && arr.length > 0) {
        return arr.map((d: { nombre?: string }) => d.nombre || d).join(", ");
      }
      return "Sin diagnostico";
    } catch {
      return raw || "Sin diagnostico";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--primary)" }} />
        <span className="ml-2 text-sm" style={{ color: "var(--text-muted)" }}>
          Cargando historial...
        </span>
      </div>
    );
  }

  if (notas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <FileX className="h-10 w-10" style={{ color: "var(--text-muted)" }} />
        <div className="text-sm" style={{ color: "var(--text-muted)" }}>
          No hay consultas registradas para este paciente.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {notas.map((nota) => (
        <div key={nota.id} className="card flex items-center gap-4 px-4 py-3">
          <div
            className="h-3 w-3 rounded-full shrink-0"
            style={{ background: "var(--primary)" }}
          />
          <div className="flex-1">
            <div className="text-sm font-medium">
              {nota.padecimiento_actual || parseDiagnosticos(nota.diagnosticos)}
            </div>
            <div className="text-xs" style={{ color: "var(--text-muted)" }}>
              {formatDate(nota.created_at)} · {nota.created_by}
            </div>
          </div>
          <button
            className="text-sm font-medium"
            style={{ color: "var(--primary)" }}
            onClick={() =>
              showToast(
                `${nota.padecimiento_actual || "Consulta"} — ${formatDate(nota.created_at)}`,
                "info"
              )
            }
          >
            Ver Expediente
          </button>
        </div>
      ))}
    </div>
  );
}
