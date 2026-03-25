"use client";

import { User, Download, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/toast";
import { calcAge } from "@/lib/format";
import { downloadTextFile } from "@/lib/download";

interface PatientInfoProps {
  nombre: string;
  sexo: string;
  fechaNacimiento: string;
  domicilio: string;
  telefono: string;
  curp: string;
  isNew?: boolean;
}

export function PatientInfo({
  nombre,
  sexo,
  fechaNacimiento,
  domicilio,
  telefono,
  curp,
  isNew,
}: PatientInfoProps) {
  const { showToast } = useToast();
  const age = calcAge(fechaNacimiento);
  const handleDownload = () => {
    const content = [
      `EXPEDIENTE CLÍNICO`,
      `==================`,
      ``,
      `Nombre: ${nombre}`,
      `Sexo: ${sexo}`,
      `Edad: ${age !== null ? `${age} años` : "N/A"}`,
      `Fecha de Nacimiento: ${fechaNacimiento}`,
      `Domicilio: ${domicilio}`,
      `Teléfono: ${telefono}`,
      `CURP: ${curp}`,
      ``,
      `Generado por MedCapture - NOM-004-SSA3-2012`,
      `Fecha de generación: ${new Date().toLocaleDateString("es-MX")}`,
    ].join("\n");
    downloadTextFile(content, `expediente-${nombre.replace(/\s+/g, "-").toLowerCase()}.txt`);
    showToast("Expediente descargado", "success");
  };

  return (
    <div className="w-full max-w-[280px] shrink-0 space-y-4">
      <div className="flex flex-col items-center text-center gap-2 pt-2">
        {isNew && (
          <span
            className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
            style={{ background: "var(--primary)", color: "white" }}
          >
            Nuevo
          </span>
        )}
        <div
          className="h-16 w-16 rounded-full flex items-center justify-center"
          style={{ background: "var(--primary-light)", color: "var(--primary)" }}
        >
          <User className="h-7 w-7" />
        </div>
        <div>
          <div className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
            {nombre}
          </div>
          <div className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Sexo: {sexo}
          </div>
          {age !== null && (
            <div className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Edad: {age} años
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3 text-sm">
        <div>
          <div className="text-xs" style={{ color: "var(--text-muted)" }}>Fecha de Nacimiento</div>
          <div className="font-medium">{fechaNacimiento}</div>
        </div>
        <div>
          <div className="text-xs" style={{ color: "var(--text-muted)" }}>Domicilio</div>
          <div className="font-medium">{domicilio}</div>
        </div>
        <div>
          <div className="text-xs" style={{ color: "var(--text-muted)" }}>Telefono</div>
          <div className="font-medium">{telefono}</div>
        </div>
        <div>
          <div className="text-xs" style={{ color: "var(--text-muted)" }}>CURP</div>
          <div className="font-medium font-mono text-xs">{curp}</div>
        </div>
      </div>

      <button
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium cursor-pointer hover:opacity-90 transition-opacity"
        style={{ background: "var(--primary)", color: "white" }}
        onClick={handleDownload}
      >
        <Download className="h-4 w-4" />
        Descargar expediente
      </button>
      <Link
        href="/consulta"
        className="flex items-center gap-1.5 text-sm justify-center"
        style={{ color: "var(--primary)" }}
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Regresar
      </Link>
    </div>
  );
}
