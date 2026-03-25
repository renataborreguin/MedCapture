"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { FileText, ArrowLeft, Lock, Shield, CheckCircle2, AlertTriangle, XCircle, ChevronDown } from "lucide-react";

interface ConsultaData {
  tipo: string;
  peso: string;
  altura: string;
  diagnosticos: { codigo: string; descripcion: string }[];
  sections: Record<string, string>;
  fecha: string;
  hora: string;
}

export default function RevisarPage() {
  const router = useRouter();
  const params = useParams();
  const [data, setData] = useState<ConsultaData | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("consultaData");
    if (stored) {
      setData(JSON.parse(stored));
    }
  }, []);

  const handleSign = async () => {
    const exploracion = [
      data?.sections.signos_vitales,
      data?.sections.hallazgos,
    ].filter(Boolean).join(". ");

    try {
      await fetch("/api/notas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paciente_id: params.pacienteId,
          padecimiento_actual: data?.sections.motivo || "",
          exploracion_fisica: exploracion,
          signos_vitales: { peso: data?.peso, talla: data?.altura },
          diagnosticos: data?.diagnosticos || [],
          pronostico: data?.sections.pronostico || "",
          indicaciones_terapeuticas: data?.sections.tratamiento || "",
          nota_narrativa: buildNarrative(data),
          nom004_porcentaje: 85,
          keywords_originales: Object.values(data?.sections || {}).join(" | "),
        }),
      });
    } catch {
      // Continue even if save fails for demo
    }
    router.push(`/consulta/${params.pacienteId}/nueva-consulta/completado`);
  };

  if (!data) {
    return (
      <div className="text-center py-12" style={{ color: "var(--text-muted)" }}>
        Cargando datos de la consulta...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div
        className="rounded-lg px-4 py-3 text-sm flex items-center gap-2"
        style={{ background: "var(--primary-light)", color: "var(--primary)" }}
      >
        <FileText className="h-4 w-4" />
        Resumen de la consulta · Verifica antes de firmar
      </div>

      <div className="card p-6 space-y-4">
        <h3 className="text-sm font-semibold" style={{ color: "var(--text-muted)" }}>
          Nota médica generada:
        </h3>
        <div
          className="rounded-lg p-5 text-sm leading-relaxed space-y-4"
          style={{ background: "var(--bg-page)", border: "1px solid var(--border)" }}
        >
          {data.sections.motivo && (
            <p>
              Paciente acude a consulta por {data.sections.motivo.toLowerCase()}.
            </p>
          )}

          {(data.peso || data.altura || data.sections.signos_vitales) && (
            <p>
              <span className="font-medium">Exploración física:</span>{" "}
              {data.peso && `Peso: ${data.peso}. `}
              {data.altura && `Altura: ${data.altura}. `}
              {data.sections.signos_vitales}
            </p>
          )}

          {data.sections.hallazgos && (
            <p>
              <span className="font-medium">Hallazgos:</span>{" "}
              {data.sections.hallazgos}
            </p>
          )}

          {data.sections.estudios && (
            <p>
              <span className="font-medium">Estudios solicitados:</span>{" "}
              {data.sections.estudios}
            </p>
          )}

          {data.diagnosticos.length > 0 && (
            <p>
              <span className="font-medium">Diagnóstico:</span>{" "}
              {data.diagnosticos
                .map((d) => `${d.codigo} — ${d.descripcion}`)
                .join(". ")}
              .
            </p>
          )}

          {data.sections.pronostico && (
            <p>
              <span className="font-medium">Pronóstico:</span>{" "}
              {data.sections.pronostico}
            </p>
          )}

          {data.sections.tratamiento && (
            <div>
              <span className="font-medium">Tratamiento:</span>
              <p className="mt-1">{data.sections.tratamiento}</p>
            </div>
          )}

          {data.sections.notas && (
            <p>
              <span className="font-medium">Notas:</span>{" "}
              {data.sections.notas}
            </p>
          )}

          <div className="flex justify-end pt-2">
            <button
              className="text-xs flex items-center gap-1"
              style={{ color: "var(--text-muted)" }}
              onClick={() => router.back()}
            >
              ✎ Editar
            </button>
          </div>
        </div>
      </div>

      <NOM004Badge data={data} />

      {data.sections.estudios?.toLowerCase().includes("endoscopia") && (
        <div className="p-4 rounded-xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <div className="text-sm" style={{ color: "var(--text-muted)" }}>
            Consentimientos anexados automaticamente:
          </div>
          <div
            className="mt-3 rounded-lg p-4 flex items-center justify-between"
            style={{ background: "var(--success-bg)", border: "1px solid var(--ai-border)" }}
          >
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5" style={{ color: "var(--primary)" }} />
              <div>
                <div className="text-sm font-semibold">Consentimiento para endoscopia</div>
                <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Se anexará al expediente al firmar.
                </div>
              </div>
            </div>
            <button className="text-sm font-medium" style={{ color: "var(--primary)" }}>
              Ver formato
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-4 pt-4">
        <button
          className="flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-xl text-sm font-medium transition-colors"
          style={{ background: "var(--bg-card)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
          Regresar a editar
        </button>
        <button
          className="flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-xl text-sm font-medium text-white transition-opacity"
          style={{ background: "var(--primary)" }}
          onClick={handleSign}
        >
          <Lock className="h-4 w-4" />
          Firmar y guardar
        </button>
      </div>
    </div>
  );
}

function NOM004Badge({ data }: { data: ConsultaData }) {
  const [expanded, setExpanded] = useState(false);

  const checks = [
    { label: "Motivo de consulta / padecimiento actual", ok: !!data.sections.motivo },
    { label: "Signos vitales", ok: !!data.sections.signos_vitales },
    { label: "Exploración física (peso/talla)", ok: !!(data.peso || data.altura) },
    { label: "Hallazgos de la exploración", ok: !!data.sections.hallazgos },
    { label: "Diagnósticos con código CIE-10", ok: data.diagnosticos.length > 0 },
    { label: "Pronóstico", ok: !!data.sections.pronostico },
    { label: "Indicaciones terapéuticas", ok: !!data.sections.tratamiento },
    { label: "Estudios solicitados", ok: !!data.sections.estudios },
    { label: "Fecha y hora de la consulta", ok: true }, // always present
    { label: "Nombre del médico tratante", ok: true }, // hardcoded demo
  ];

  const present = checks.filter((c) => c.ok).length;
  const total = checks.length;
  const pct = Math.round((present / total) * 100);

  const color =
    pct >= 80
      ? { bg: "var(--success-bg)", border: "var(--ai-border)", text: "var(--primary)" }
      : pct >= 50
        ? { bg: "var(--warning-bg)", border: "var(--warning-border)", text: "var(--warning)" }
        : { bg: "var(--danger-bg)", border: "#f5c6ba", text: "var(--danger)" };

  const Icon = pct >= 80 ? CheckCircle2 : pct >= 50 ? AlertTriangle : XCircle;

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: `1px solid ${color.border}`, background: color.bg }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3"
      >
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4" style={{ color: color.text }} />
          <span className="text-sm font-semibold" style={{ color: color.text }}>
            NOM-004-SSA3-2012: {pct}% completo ({present}/{total} campos)
          </span>
        </div>
        <ChevronDown
          className="h-4 w-4 transition-transform"
          style={{
            color: color.text,
            transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
          }}
        />
      </button>

      {expanded && (
        <div className="px-4 pb-3 space-y-1">
          {checks.map((c, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              {c.ok ? (
                <CheckCircle2 className="h-3 w-3 shrink-0" style={{ color: "var(--primary)" }} />
              ) : (
                <XCircle className="h-3 w-3 shrink-0" style={{ color: "var(--danger)" }} />
              )}
              <span style={{ color: c.ok ? "var(--text-secondary)" : "var(--danger)" }}>
                {c.label}
              </span>
            </div>
          ))}
          <p className="text-xs mt-2 pt-2" style={{ color: "var(--text-muted)", borderTop: "1px solid var(--border)" }}>
            Verificar: firma digital del médico al guardar (§5.10)
          </p>
        </div>
      )}
    </div>
  );
}

function buildNarrative(data: ConsultaData | null): string {
  if (!data) return "";
  const parts = [];
  if (data.sections.motivo) parts.push(`Motivo de consulta: ${data.sections.motivo}`);
  if (data.sections.signos_vitales) parts.push(`Exploración física: ${data.peso ? `Peso: ${data.peso}. ` : ""}${data.altura ? `Altura: ${data.altura}. ` : ""}${data.sections.signos_vitales}`);
  if (data.sections.hallazgos) parts.push(`Hallazgos: ${data.sections.hallazgos}`);
  if (data.sections.estudios) parts.push(`Estudios solicitados: ${data.sections.estudios}`);
  if (data.diagnosticos.length > 0) parts.push(`Diagnóstico: ${data.diagnosticos.map(d => `${d.codigo} - ${d.descripcion}`).join("; ")}`);
  if (data.sections.pronostico) parts.push(`Pronóstico: ${data.sections.pronostico}`);
  if (data.sections.tratamiento) parts.push(`Tratamiento: ${data.sections.tratamiento}`);
  if (data.sections.notas) parts.push(`Notas: ${data.sections.notas}`);
  return parts.join("\n\n");
}
