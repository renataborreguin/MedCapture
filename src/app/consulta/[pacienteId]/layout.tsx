"use client";

import { useState, useEffect } from "react";
import { usePathname, useParams } from "next/navigation";
import Link from "next/link";
import { PatientInfo } from "@/components/patient-info";
import { formatSexo, formatDate } from "@/lib/format";

interface PatientData {
  id: string;
  nombre_completo: string;
  sexo: string;
  fecha_nacimiento: string;
  domicilio: string;
  telefono: string | null;
  email: string | null;
  curp: string | null;
}

const TABS = [
  { label: "Antecedentes", suffix: "" },
  { label: "Laboratorios", suffix: "/laboratorios" },
  { label: "Historial", suffix: "/historial" },
  { label: "Nueva consulta", suffix: "/nueva-consulta" },
];

export default function PatientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const pacienteId = params.pacienteId as string;
  const basePath = `/consulta/${pacienteId}`;

  const [patient, setPatient] = useState<PatientData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/patients?id=${encodeURIComponent(pacienteId)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.patient) {
          setPatient(data.patient);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [pacienteId]);

  const patientInfoProps = patient
    ? {
        nombre: patient.nombre_completo,
        sexo: formatSexo(patient.sexo),
        fechaNacimiento: formatDate(patient.fecha_nacimiento),
        domicilio: patient.domicilio || "Sin domicilio",
        telefono: patient.telefono || "Sin teléfono",
        curp: patient.curp || "—",
      }
    : {
        nombre: "Cargando...",
        sexo: "",
        fechaNacimiento: "",
        domicilio: "",
        telefono: "",
        curp: "",
      };

  return (
    <div className="flex gap-6">
      <div
        className="shrink-0 self-start sticky top-20 p-5"
        style={{
          width: 280,
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--shadow-card)",
          opacity: loading ? 0.6 : 1,
          transition: "opacity 200ms ease",
        }}
      >
        <PatientInfo {...patientInfoProps} />
      </div>

      <div className="flex-1 min-w-0">
        <div
          className="flex mb-6"
          style={{ borderBottom: "2px solid var(--border)" }}
        >
          {TABS.map((tab) => {
            const href = `${basePath}${tab.suffix}`;
            const isActive =
              tab.suffix === ""
                ? pathname === basePath
                : pathname.startsWith(href);
            return (
              <Link
                key={tab.label}
                href={href}
                className="no-underline"
                style={{
                  padding: "12px 24px",
                  fontSize: "14px",
                  fontWeight: 500,
                  color: isActive ? "var(--primary)" : "var(--text-secondary)",
                  borderBottom: isActive
                    ? "2px solid var(--primary)"
                    : "2px solid transparent",
                  marginBottom: "-2px",
                  transition: "all 150ms ease",
                }}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>

        {children}
      </div>
    </div>
  );
}
