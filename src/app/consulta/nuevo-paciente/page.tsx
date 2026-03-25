"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/toast";

export default function NuevoPacientePage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    nombre: "",
    apellidoPaterno: "",
    apellidoMaterno: "",
    curp: "",
    fechaNacimiento: "",
    sexo: "",
    telefono: "",
    correo: "",
    domicilio: "",
    contactoEmergencia: "",
    telefonoEmergencia: "",
    alergias: "",
    heredofamiliares: "",
    patologicos: "",
    noPatologicos: "",
    quirurgicos: "",
  });

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const canSubmit =
    form.nombre.trim() &&
    form.apellidoPaterno.trim() &&
    form.fechaNacimiento &&
    form.sexo &&
    form.telefono.trim() &&
    form.domicilio.trim() &&
    !submitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: form.nombre,
          apellidoPaterno: form.apellidoPaterno,
          apellidoMaterno: form.apellidoMaterno,
          sexo: form.sexo,
          fechaNacimiento: form.fechaNacimiento,
          domicilio: form.domicilio,
          telefono: form.telefono,
          correo: form.correo,
          curp: form.curp || undefined,
          alergias: form.alergias || undefined,
          antecedentes_heredofamiliares: form.heredofamiliares || undefined,
          antecedentes_patologicos: form.patologicos || undefined,
          antecedentes_no_patologicos: form.noPatologicos || undefined,
          antecedentes_quirurgicos: form.quirurgicos || undefined,
          contacto_emergencia: form.contactoEmergencia || undefined,
          telefono_emergencia: form.telefonoEmergencia || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || "Error al registrar paciente", "warning");
        return;
      }

      showToast("Paciente registrado exitosamente", "success");
      router.push(`/consulta/${data.patient.id}`);
    } catch {
      showToast("Error de conexión al registrar paciente", "warning");
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid var(--border)",
    fontSize: 14,
    background: "var(--bg-card)",
    color: "var(--text-primary)",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 13,
    fontWeight: 500,
    color: "var(--text-secondary)",
    marginBottom: 4,
  };

  const sectionHeaderStyle = (color: string): React.CSSProperties => ({
    fontSize: 14,
    fontWeight: 700,
    color,
    marginBottom: 12,
    paddingBottom: 8,
    borderBottom: `2px solid ${color}`,
  });

  return (
    <div style={{ maxWidth: 640, margin: "0 auto" }}>
      <Link
        href="/consulta"
        className="inline-flex items-center gap-1.5 text-sm mb-6"
        style={{ color: "var(--text-muted)" }}
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a búsqueda
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <div
          className="h-10 w-10 rounded-full flex items-center justify-center"
          style={{ background: "var(--primary-light)" }}
        >
          <UserPlus className="h-5 w-5" style={{ color: "var(--primary)" }} />
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
            Registrar Nuevo Paciente
          </h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Complete los datos del paciente. Los campos con * son obligatorios.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <section>
          <div style={sectionHeaderStyle("var(--primary)")}>Datos Personales</div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label style={labelStyle}>Nombre(s) *</label>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={update("nombre")}
                  placeholder="Ej: Maria Elena"
                  style={inputStyle}
                  required
                />
              </div>
              <div>
                <label style={labelStyle}>Apellido Paterno *</label>
                <input
                  type="text"
                  value={form.apellidoPaterno}
                  onChange={update("apellidoPaterno")}
                  placeholder="Ej: García"
                  style={inputStyle}
                  required
                />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Apellido Materno</label>
              <input
                type="text"
                value={form.apellidoMaterno}
                onChange={update("apellidoMaterno")}
                placeholder="Ej: López"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>CURP</label>
              <input
                type="text"
                value={form.curp}
                onChange={update("curp")}
                placeholder="Ej: GALE830315MYNRPN09"
                style={{ ...inputStyle, fontFamily: "monospace", textTransform: "uppercase" }}
                maxLength={18}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label style={labelStyle}>Fecha de Nacimiento *</label>
                <input
                  type="date"
                  value={form.fechaNacimiento}
                  onChange={update("fechaNacimiento")}
                  style={inputStyle}
                  required
                />
              </div>
              <div>
                <label style={labelStyle}>Sexo *</label>
                <select
                  value={form.sexo}
                  onChange={update("sexo")}
                  style={inputStyle}
                  required
                >
                  <option value="">Seleccionar...</option>
                  <option value="M">Masculino</option>
                  <option value="F">Femenino</option>
                  <option value="O">Otro</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        <section>
          <div style={sectionHeaderStyle("var(--primary)")}>Contacto y Domicilio</div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label style={labelStyle}>Teléfono *</label>
                <input
                  type="tel"
                  value={form.telefono}
                  onChange={update("telefono")}
                  placeholder="Ej: 999 123 4567"
                  style={inputStyle}
                  required
                />
              </div>
              <div>
                <label style={labelStyle}>Correo electrónico</label>
                <input
                  type="email"
                  value={form.correo}
                  onChange={update("correo")}
                  placeholder="Ej: paciente@correo.com"
                  style={inputStyle}
                />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Domicilio completo *</label>
              <input
                type="text"
                value={form.domicilio}
                onChange={update("domicilio")}
                placeholder="Calle, número, colonia, ciudad, estado, C.P."
                style={inputStyle}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label style={labelStyle}>Contacto de emergencia</label>
                <input
                  type="text"
                  value={form.contactoEmergencia}
                  onChange={update("contactoEmergencia")}
                  placeholder="Nombre del contacto"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Teléfono de emergencia</label>
                <input
                  type="tel"
                  value={form.telefonoEmergencia}
                  onChange={update("telefonoEmergencia")}
                  placeholder="Ej: 999 987 6543"
                  style={inputStyle}
                />
              </div>
            </div>
          </div>
        </section>

        <section>
          <div style={sectionHeaderStyle("var(--primary)")}>Antecedentes Médicos</div>
          <div className="space-y-4">
          <div>
            <label style={labelStyle}>Alergias</label>
            <textarea
              value={form.alergias}
              onChange={update("alergias")}
              placeholder="Ej: Penicilina, sulfas, mariscos..."
              rows={3}
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </div>
          <div>
            <label style={labelStyle}>Antecedentes heredofamiliares</label>
            <textarea
              value={form.heredofamiliares}
              onChange={update("heredofamiliares")}
              placeholder="Ej: Diabetes en padre, hipertensión en madre..."
              rows={3}
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </div>
          <div>
            <label style={labelStyle}>Antecedentes personales patológicos</label>
            <textarea
              value={form.patologicos}
              onChange={update("patologicos")}
              placeholder="Ej: Diabetes tipo 2 desde 2018, hipertensión..."
              rows={3}
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </div>
          <div>
            <label style={labelStyle}>Antecedentes personales no patológicos</label>
            <textarea
              value={form.noPatologicos}
              onChange={update("noPatologicos")}
              placeholder="Ej: No fuma, alcohol ocasional..."
              rows={3}
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </div>
          <div>
            <label style={labelStyle}>Antecedentes quirúrgicos</label>
            <textarea
              value={form.quirurgicos}
              onChange={update("quirurgicos")}
              placeholder="Ej: Apendicectomía 2015..."
              rows={3}
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </div>
          </div>
        </section>

        <div className="flex justify-end gap-3 pt-2 pb-8">
          <Link
            href="/consulta"
            className="py-3 px-6 rounded-xl text-sm font-medium transition-colors"
            style={{ color: "var(--text-muted)", border: "1px solid var(--border)" }}
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={!canSubmit}
            className="flex items-center gap-2 py-3 px-6 rounded-xl text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            style={{ background: "var(--primary)" }}
          >
            <UserPlus className="h-4 w-4" />
            {submitting ? "Registrando..." : "Registrar paciente"}
          </button>
        </div>
      </form>
    </div>
  );
}
