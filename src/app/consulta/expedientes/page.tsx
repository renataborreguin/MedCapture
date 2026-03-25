"use client";

import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import Link from "next/link";
import { formatSexo, formatDate, getInitials } from "@/lib/format";

interface Patient {
  id: string;
  nombre_completo: string;
  sexo: string;
  fecha_nacimiento: string;
  telefono: string | null;
  email: string | null;
  created_at: string;
  updated_at: string;
}

export default function ExpedientesPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/patients")
      .then((res) => res.json())
      .then((data) => setPatients(data.patients || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = search.trim()
    ? patients.filter(
        (p) =>
          p.nombre_completo.toLowerCase().includes(search.toLowerCase()) ||
          (p.telefono && p.telefono.includes(search))
      )
    : patients;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
        Todos mis expedientes
      </h1>

      <div className="relative">
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4"
          style={{ color: "var(--text-muted)" }}
        />
        <input
          type="search"
          placeholder="Buscar por nombre, teléfono..."
          className="w-full pl-11"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="text-sm py-8 text-center" style={{ color: "var(--text-muted)" }}>
          Cargando expedientes...
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-sm py-8 text-center" style={{ color: "var(--text-muted)" }}>
          {patients.length === 0
            ? "No hay pacientes registrados aún."
            : "No se encontraron resultados."}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((p) => (
            <Link
              key={p.id}
              href={`/consulta/${p.id}`}
              className="flex items-center gap-4 p-4 rounded-xl no-underline transition-colors hover:opacity-90"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
            >
              <div
                className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-medium shrink-0"
                style={{ background: "var(--primary-light)", color: "var(--primary)" }}
              >
                {getInitials(p.nombre_completo)}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium">{p.nombre_completo}</div>
                <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {formatSexo(p.sexo)} · {p.telefono || "Sin teléfono"}
                </div>
              </div>
              <div className="text-sm" style={{ color: "var(--text-muted)" }}>
                {formatDate(p.updated_at)}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
