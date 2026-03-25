"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { AlertTriangle, Pencil, Save, Loader2 } from "lucide-react";
import { useToast } from "@/components/toast";

interface AntecedentesData {
  alergias: string;
  antecedentes_heredofamiliares: string;
  antecedentes_patologicos: string;
  antecedentes_no_patologicos: string;
  antecedentes_quirurgicos: string;
}

const EMPTY_DATA: AntecedentesData = {
  alergias: "",
  antecedentes_heredofamiliares: "",
  antecedentes_patologicos: "",
  antecedentes_no_patologicos: "",
  antecedentes_quirurgicos: "",
};

const FIELD_LABELS: Record<keyof Omit<AntecedentesData, "alergias">, string> = {
  antecedentes_heredofamiliares: "Enfermedades en la familia:",
  antecedentes_patologicos: "Antecedentes personales patologicos:",
  antecedentes_no_patologicos: "Antecedentes personales no patologicos:",
  antecedentes_quirurgicos: "Antecedentes quirurgicos:",
};

export default function AntecedentesPage() {
  const { pacienteId } = useParams<{ pacienteId: string }>();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [data, setData] = useState<AntecedentesData>(EMPTY_DATA);
  const [draft, setDraft] = useState<AntecedentesData>(EMPTY_DATA);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/patients?id=${pacienteId}`);
      if (!res.ok) throw new Error("No se pudo cargar el paciente");
      const json = await res.json();
      const p = json.patient;
      const loaded: AntecedentesData = {
        alergias: p.alergias || "",
        antecedentes_heredofamiliares: p.antecedentes_heredofamiliares || "",
        antecedentes_patologicos: p.antecedentes_patologicos || "",
        antecedentes_no_patologicos: p.antecedentes_no_patologicos || "",
        antecedentes_quirurgicos: p.antecedentes_quirurgicos || "",
      };
      setData(loaded);
      setDraft(loaded);
    } catch {
      showToast("Error al cargar antecedentes", "warning");
    } finally {
      setLoading(false);
    }
  }, [pacienteId, showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleEdit = () => {
    setDraft(data);
    setEditing(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await fetch("/api/patients", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: pacienteId,
          alergias: draft.alergias,
          antecedentes_heredofamiliares: draft.antecedentes_heredofamiliares,
          antecedentes_patologicos: draft.antecedentes_patologicos,
          antecedentes_no_patologicos: draft.antecedentes_no_patologicos,
          antecedentes_quirurgicos: draft.antecedentes_quirurgicos,
        }),
      });
      if (!res.ok) throw new Error("No se pudo guardar");
      setData(draft);
      setEditing(false);
      showToast("Antecedentes actualizados correctamente", "success");
    } catch {
      showToast("Error al guardar antecedentes", "warning");
    } finally {
      setSaving(false);
    }
  };

  const updateDraft = (field: keyof AntecedentesData) => (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDraft((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const fields = Object.keys(FIELD_LABELS) as (keyof typeof FIELD_LABELS)[];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--primary)" }} />
        <span className="ml-2 text-sm" style={{ color: "var(--text-muted)" }}>
          Cargando antecedentes...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          Antecedentes del Paciente
        </div>
        {editing ? (
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-90"
            style={{ background: "var(--primary)", color: "white", opacity: saving ? 0.7 : 1 }}
          >
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            {saving ? "Guardando..." : "Guardar"}
          </button>
        ) : (
          <button
            onClick={handleEdit}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-90"
            style={{ border: "1px solid var(--border)", color: "var(--text-secondary)" }}
          >
            <Pencil className="h-3.5 w-3.5" />
            Editar
          </button>
        )}
      </div>

      <div className="warning-banner">
        <AlertTriangle className="h-4 w-4 shrink-0" style={{ color: "var(--warning)" }} />
        <div>
          <span className="font-semibold" style={{ color: "var(--warning)" }}>Alergias: </span>
          {editing ? (
            <textarea
              value={draft.alergias}
              onChange={updateDraft("alergias")}
              rows={1}
              className="w-full mt-1 text-sm"
              style={{
                padding: "6px 10px",
                borderRadius: 8,
                border: "1px solid var(--border)",
                background: "var(--bg-card)",
                color: "var(--text-primary)",
                resize: "vertical",
                fontSize: 14,
              }}
            />
          ) : (
            <span>{data.alergias || "Sin alergias registradas"}</span>
          )}
        </div>
      </div>

      {fields.map((field) => (
        <div
          key={field}
          className="py-3 border-b"
          style={{ borderColor: "var(--border)" }}
        >
          <div className="text-sm" style={{ color: "var(--text-muted)" }}>
            {FIELD_LABELS[field]}
          </div>
          {editing ? (
            <textarea
              value={draft[field]}
              onChange={updateDraft(field)}
              rows={2}
              className="w-full mt-1 text-sm"
              style={{
                padding: "6px 10px",
                borderRadius: 8,
                border: "1px solid var(--border)",
                background: "var(--bg-card)",
                color: "var(--text-primary)",
                resize: "vertical",
                fontSize: 14,
              }}
            />
          ) : (
            <div className="text-sm font-medium mt-0.5">{data[field] || "—"}</div>
          )}
        </div>
      ))}
    </div>
  );
}
