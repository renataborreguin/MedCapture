"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Zap,
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  Search,
  Hash,
  Tag,
} from "lucide-react";
import { useToast } from "@/components/toast";
import type { SnippetPersonalizado } from "@/types/expediente";

const CATEGORIAS = [
  { value: "general", label: "General" },
  { value: "exploracion", label: "Exploración física" },
  { value: "indicaciones", label: "Indicaciones" },
  { value: "signos_vitales", label: "Signos vitales" },
  { value: "diagnostico", label: "Diagnóstico" },
  { value: "tratamiento", label: "Tratamiento" },
];

const CATEGORIA_COLORS: Record<string, { bg: string; text: string }> = {
  general: { bg: "#f0f4f5", text: "#5a6e72" },
  exploracion: { bg: "#e8f5f2", text: "#2a7a6f" },
  indicaciones: { bg: "#fef9e7", text: "#9a7b0a" },
  signos_vitales: { bg: "#edf0ff", text: "#4a5ab9" },
  diagnostico: { bg: "#fdf0ed", text: "#b5553a" },
  tratamiento: { bg: "#f3edfd", text: "#6b4fa0" },
};

function getCategoriaLabel(value: string) {
  return CATEGORIAS.find((cat) => cat.value === value)?.label ?? value;
}

interface FormState {
  id?: string;
  atajo: string;
  texto: string;
  categoria: string;
}

const EMPTY_FORM: FormState = { atajo: "", texto: "", categoria: "general" };

export default function SnippetsPage() {
  const { showToast } = useToast();
  const [snippets, setSnippets] = useState<SnippetPersonalizado[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<string>("all");

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const isEditing = !!form.id;

  const fetchSnippets = useCallback(async () => {
    try {
      const res = await fetch("/api/snippets");
      if (res.ok) {
        const data = await res.json();
        setSnippets(data.snippets);
      }
    } catch {
      showToast("Error al cargar snippets", "warning");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchSnippets();
  }, [fetchSnippets]);

  const handleSave = async () => {
    if (!form.atajo.trim() || !form.texto.trim()) {
      showToast("El atajo y el texto son requeridos", "warning");
      return;
    }

    setSaving(true);
    try {
      const method = isEditing ? "PUT" : "POST";
      const res = await fetch("/api/snippets", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        showToast(
          isEditing ? "Snippet actualizado" : "Snippet creado",
          "success"
        );
        setShowForm(false);
        setForm(EMPTY_FORM);
        fetchSnippets();
      } else {
        const data = await res.json();
        showToast(data.error || "Error al guardar", "warning");
      }
    } catch {
      showToast("Error de conexión", "warning");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este snippet?")) return;
    try {
      const res = await fetch(`/api/snippets?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        showToast("Snippet eliminado", "success");
        fetchSnippets();
      }
    } catch {
      showToast("Error al eliminar", "warning");
    }
  };

  const startEdit = (s: SnippetPersonalizado) => {
    setForm({
      id: s.id,
      atajo: s.atajo,
      texto: s.texto,
      categoria: s.categoria,
    });
    setShowForm(true);
  };

  const filtered = snippets.filter((snippet) => {
    const matchesSearch =
      !search ||
      snippet.atajo.toLowerCase().includes(search.toLowerCase()) ||
      snippet.texto.toLowerCase().includes(search.toLowerCase());
    const matchesCat = filterCat === "all" || snippet.categoria === filterCat;
    return matchesSearch && matchesCat;
  });

  const grouped = filtered.reduce<Record<string, SnippetPersonalizado[]>>(
    (acc, snippet) => {
      const cat = snippet.categoria || "general";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(snippet);
      return acc;
    },
    {}
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1
            className="text-xl font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            Mis Snippets
          </h1>
          <p
            className="text-sm mt-1"
            style={{ color: "var(--text-muted)" }}
          >
            Crea atajos de texto personalizados. Escribe el atajo (ej.{" "}
            <code
              className="px-1.5 py-0.5 rounded text-xs font-mono"
              style={{
                background: "var(--keyword-bg)",
                color: "var(--keyword-text)",
              }}
            >
              #normal
            </code>
            ) en cualquier campo y se expandirá automáticamente al texto
            que definas.
          </p>
        </div>
        <button
          onClick={() => {
            setForm(EMPTY_FORM);
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium shrink-0"
          style={{
            background: "var(--primary)",
            color: "white",
          }}
        >
          <Plus className="h-4 w-4" />
          Nuevo snippet
        </button>
      </div>

      <div
        className="rounded-xl p-4 flex items-start gap-3 text-sm"
        style={{
          background: "var(--primary-light)",
          color: "var(--primary)",
        }}
      >
        <Zap className="h-4 w-4 shrink-0 mt-0.5" />
        <div>
          Los snippets se activan cuando escribes el atajo seguido de un
          espacio. Usa el prefijo <strong>#</strong> para diferenciarlos del
          texto normal. Por ejemplo: <strong>#abdomen</strong> insertará tu
          texto de exploración abdominal.
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
            style={{ color: "var(--text-muted)" }}
          />
          <input
            type="text"
            placeholder="Buscar por atajo o texto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full"
            style={{ paddingLeft: "36px" }}
          />
        </div>
        <select
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value)}
          style={{ width: "auto", minWidth: "160px" }}
        >
          <option value="all">Todas las categorías</option>
          {CATEGORIAS.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
      </div>

      {showForm && (
        <div
          className="rounded-xl p-5 space-y-4"
          style={{
            background: "var(--bg-card)",
            border: "1.5px solid var(--primary)",
            boxShadow: "0 0 0 3px rgba(61,155,143,0.1)",
          }}
        >
          <div className="flex items-center justify-between">
            <h2
              className="text-sm font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              {isEditing ? "Editar snippet" : "Nuevo snippet"}
            </h2>
            <button
              onClick={() => {
                setShowForm(false);
                setForm(EMPTY_FORM);
              }}
              className="p-1 rounded-md hover:bg-gray-100"
            >
              <X className="h-4 w-4" style={{ color: "var(--text-muted)" }} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: "var(--text-secondary)" }}
              >
                <Hash className="inline h-3 w-3 mr-1" />
                Atajo
              </label>
              <input
                type="text"
                placeholder="#misnippet"
                value={form.atajo}
                onChange={(e) =>
                  setForm((f) => ({ ...f, atajo: e.target.value }))
                }
              />
              <div
                className="text-xs mt-1"
                style={{ color: "var(--text-muted)" }}
              >
                La palabra clave que dispara la expansión
              </div>
            </div>

            <div>
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: "var(--text-secondary)" }}
              >
                <Tag className="inline h-3 w-3 mr-1" />
                Categoría
              </label>
              <select
                value={form.categoria}
                onChange={(e) =>
                  setForm((f) => ({ ...f, categoria: e.target.value }))
                }
              >
                {CATEGORIAS.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label
              className="block text-xs font-medium mb-1.5"
              style={{ color: "var(--text-secondary)" }}
            >
              Texto expandido
            </label>
            <textarea
              rows={4}
              placeholder="El texto que se insertará al usar el atajo..."
              value={form.texto}
              onChange={(e) =>
                setForm((f) => ({ ...f, texto: e.target.value }))
              }
            />
          </div>

          {form.atajo && form.texto && (
            <div
              className="rounded-lg p-3 text-sm"
              style={{
                background: "var(--ai-bg)",
                border: "1px solid var(--ai-border)",
              }}
            >
              <div
                className="text-xs font-medium mb-1"
                style={{ color: "var(--text-muted)" }}
              >
                Vista previa
              </div>
              <span className="keyword-badge mr-2">
                {form.atajo.startsWith("#") ? form.atajo : `#${form.atajo}`}
              </span>
              <span style={{ color: "var(--text-primary)" }}>
                {form.texto}
              </span>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              onClick={() => {
                setShowForm(false);
                setForm(EMPTY_FORM);
              }}
              className="px-4 py-2 rounded-xl text-sm font-medium"
              style={{
                border: "1px solid var(--border)",
                color: "var(--text-secondary)",
              }}
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
              style={{
                background: "var(--primary)",
                color: "white",
                opacity: saving ? 0.7 : 1,
              }}
            >
              <Check className="h-4 w-4" />
              {saving
                ? "Guardando..."
                : isEditing
                  ? "Guardar cambios"
                  : "Crear snippet"}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div
          className="text-center py-12 text-sm"
          style={{ color: "var(--text-muted)" }}
        >
          Cargando snippets...
        </div>
      ) : filtered.length === 0 ? (
        <div
          className="text-center py-12 rounded-xl"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
          }}
        >
          <Zap
            className="h-8 w-8 mx-auto mb-3"
            style={{ color: "var(--text-muted)" }}
          />
          <div
            className="text-sm font-medium"
            style={{ color: "var(--text-secondary)" }}
          >
            {search || filterCat !== "all"
              ? "No se encontraron snippets con ese filtro"
              : "Aún no tienes snippets"}
          </div>
          <div
            className="text-xs mt-1"
            style={{ color: "var(--text-muted)" }}
          >
            {search || filterCat !== "all"
              ? "Intenta con otros términos de búsqueda"
              : "Crea tu primer snippet para agilizar tus notas clínicas"}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([cat, items]) => (
            <div key={cat}>
              <h2
                className="text-xs font-semibold uppercase tracking-wider mb-3"
                style={{ color: "var(--text-muted)" }}
              >
                {getCategoriaLabel(cat)} ({items.length})
              </h2>
              <div className="space-y-2">
                {items.map((snippet) => {
                  const colors =
                    CATEGORIA_COLORS[snippet.categoria] ?? CATEGORIA_COLORS.general;
                  return (
                    <div
                      key={snippet.id}
                      className="rounded-xl p-4 flex items-start gap-4 group"
                      style={{
                        background: "var(--bg-card)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      <div className="shrink-0 pt-0.5">
                        <span
                          className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-mono font-semibold"
                          style={{
                            background: colors.bg,
                            color: colors.text,
                          }}
                        >
                          {snippet.atajo}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <p
                          className="text-sm leading-relaxed"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {snippet.texto}
                        </p>
                        <div
                          className="text-xs mt-1.5"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {getCategoriaLabel(snippet.categoria)}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => startEdit(snippet)}
                          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                          title="Editar"
                        >
                          <Pencil
                            className="h-3.5 w-3.5"
                            style={{ color: "var(--text-muted)" }}
                          />
                        </button>
                        <button
                          onClick={() => handleDelete(snippet.id)}
                          className="p-2 rounded-lg hover:bg-red-50 transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-red-400" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && snippets.length > 0 && (
        <div
          className="text-center text-xs py-2"
          style={{ color: "var(--text-muted)" }}
        >
          {snippets.length} snippet{snippets.length !== 1 ? "s" : ""} en total
        </div>
      )}
    </div>
  );
}
