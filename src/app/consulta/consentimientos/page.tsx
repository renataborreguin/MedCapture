"use client";

import { Shield, Plus } from "lucide-react";
import { useToast } from "@/components/toast";

const CONSENTIMIENTOS = [
  { nombre: "Consentimiento para endoscopia", desc: "Endoscopia, colonoscopia, gastroscopia", usos: 12 },
  { nombre: "Consentimiento para cirugia general", desc: "Procedimientos quirúrgicos generales", usos: 8 },
  { nombre: "Consentimiento para anestesia", desc: "Anestesia local, regional o general", usos: 15 },
  { nombre: "Consentimiento para biopsia", desc: "Toma de muestra de tejido", usos: 3 },
  { nombre: "Consentimiento para transfusion", desc: "Transfusión de sangre o hemoderivados", usos: 1 },
];

export default function ConsentimientosPage() {
  const { showToast } = useToast();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
            Plantillas de Consentimiento Informado
          </h1>
          <span
            className="text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap"
            style={{ background: "var(--warning-bg)", color: "var(--warning)" }}
          >
            En desarrollo
          </span>
        </div>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          Administra las plantillas de consentimiento para cada procedimiento. Se anexan
          automaticamente al expediente cuando se indica el procedimiento en la consulta.
        </p>
      </div>

      <div
        className="rounded-xl p-4 flex items-center gap-3 text-sm"
        style={{ background: "var(--primary-light)", color: "var(--primary)" }}
      >
        <Shield className="h-4 w-4 shrink-0" />
        Cuando durante una consulta se registre un procedimiento, el sistema detecta
        automaticamente que consentimiento aplica y lo adjunta al expediente.
      </div>

      <div className="grid grid-cols-2 gap-4">
        {CONSENTIMIENTOS.map((consent) => (
          <div
            key={consent.nombre}
            className="p-4 rounded-xl"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
          >
            <div className="text-sm font-semibold">{consent.nombre}</div>
            <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              {consent.desc}
            </div>
            <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              Usado {consent.usos} {consent.usos === 1 ? "vez" : "veces"}
            </div>
            <div className="flex gap-4 mt-3">
              <button
                className="text-xs font-medium"
                style={{ color: "var(--primary)" }}
                onClick={() => showToast("Editor de plantillas disponible próximamente", "info")}
              >
                Editar plantilla
              </button>
              <button
                className="text-xs font-medium"
                style={{ color: "var(--primary)" }}
                onClick={() => showToast("Vista previa del consentimiento informado generada", "success")}
              >
                Vista previa
              </button>
            </div>
          </div>
        ))}

        <button
          className="p-4 rounded-xl flex items-center justify-center gap-2 text-sm"
          style={{ border: "1.5px dashed var(--border)", color: "var(--text-muted)" }}
          onClick={() => showToast("Función disponible próximamente", "info")}
        >
          <Plus className="h-4 w-4" />
          Agregar nueva plantilla
        </button>
      </div>
    </div>
  );
}
