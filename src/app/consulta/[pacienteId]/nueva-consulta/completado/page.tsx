"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Download, User, UserPlus } from "lucide-react";
import { downloadTextFile } from "@/lib/download";

export default function CompletadoPage() {
  const params = useParams();

  const handleDownload = () => {
    let content = "EXPEDIENTE CLÍNICO - Consulta Completada\n";
    content += "=".repeat(45) + "\n\n";
    try {
      const raw = sessionStorage.getItem("consultaData");
      if (raw) {
        const data = JSON.parse(raw);
        if (data.tipo) content += `Tipo de consulta: ${data.tipo}\n`;
        if (data.fecha) content += `Fecha: ${data.fecha}\n`;
        if (data.hora) content += `Hora: ${data.hora}\n`;
        content += "\n";

        const s = data.sections || {};
        if (s.motivo) content += `MOTIVO DE CONSULTA:\n${s.motivo}\n\n`;
        if (data.peso || data.altura) {
          content += "EXPLORACIÓN FÍSICA:\n";
          if (data.peso) content += `  Peso: ${data.peso}\n`;
          if (data.altura) content += `  Altura: ${data.altura}\n`;
        }
        if (s.signos_vitales) content += `  Signos vitales: ${s.signos_vitales}\n`;
        if (s.hallazgos) content += `  Hallazgos: ${s.hallazgos}\n`;
        if (s.signos_vitales || s.hallazgos || data.peso) content += "\n";

        if (data.diagnosticos?.length > 0) {
          content += "DIAGNÓSTICO:\n";
          for (const d of data.diagnosticos) {
            content += `  ${d.codigo} — ${d.descripcion}\n`;
          }
          content += "\n";
        }
        if (s.tratamiento) content += `TRATAMIENTO:\n${s.tratamiento}\n\n`;
        if (s.estudios) content += `ESTUDIOS SOLICITADOS:\n${s.estudios}\n\n`;
        if (s.pronostico) content += `PRONÓSTICO:\n${s.pronostico}\n\n`;
        if (s.notas) content += `NOTAS:\n${s.notas}\n\n`;
      } else {
        content += "No se encontraron datos de consulta almacenados.\n\n";
      }
    } catch {
      content += "No se pudieron leer los datos de consulta.\n\n";
    }
    content += "-".repeat(45) + "\n";
    content += `Paciente ID: ${params.pacienteId}\n`;
    content += `Generado: ${new Date().toLocaleString("es-MX")}\n`;
    content += "MedCapture - NOM-004-SSA3-2012";

    downloadTextFile(content, `consulta-${params.pacienteId}-${new Date().toISOString().slice(0, 10)}.txt`);
  };

  return (
    <div className="flex items-center justify-center" style={{ minHeight: "calc(100vh - 280px)" }}>
      <div className="text-center space-y-6 max-w-md">
        <div
          className="h-20 w-20 rounded-full flex items-center justify-center mx-auto"
          style={{ background: "var(--success-bg)" }}
        >
          <CheckCircle2 className="h-10 w-10" style={{ color: "var(--success)" }} />
        </div>

        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            Haz terminado con la consulta!
          </h1>
          <p className="text-sm mt-2" style={{ color: "var(--text-muted)" }}>
            El expediente ha sido firmado y guardado exitosamente.
          </p>
        </div>

        <div className="space-y-3 pt-4">
          <button
            className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl text-sm font-medium text-white"
            style={{ background: "var(--primary)" }}
            onClick={handleDownload}
          >
            <Download className="h-4 w-4" />
            Descargar expediente
          </button>

          <Link
            href={`/consulta/${params.pacienteId}/nueva-consulta`}
            className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl text-sm font-medium no-underline"
            style={{ background: "var(--bg-card)", color: "var(--primary)", border: "1px solid var(--primary)" }}
          >
            <User className="h-4 w-4" />
            Continuar con mismo paciente
          </Link>

          <Link
            href="/consulta"
            className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl text-sm font-medium text-white no-underline"
            style={{ background: "var(--danger)" }}
          >
            <UserPlus className="h-4 w-4" />
            Empezar con nuevo paciente
          </Link>
        </div>
      </div>
    </div>
  );
}
