"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Stethoscope,
  Activity,
  FlaskConical,
  ClipboardList,
  Pill,
  MessageSquare,
  Clock,
  Info,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { KeywordField, type SnippetMatch } from "@/components/keyword-field";
import { ReferenceSearch } from "@/components/reference-search";
import { CIE10Autocomplete } from "@/components/cie10-autocomplete";
import { useToast } from "@/components/toast";
import type { SnippetPersonalizado } from "@/types/expediente";

/**
 * Mapeo: sección del formulario → categorías de snippets permitidas.
 * "general" siempre aplica en cualquier sección.
 */
const SECTION_CATEGORIES: Record<string, string[]> = {
  motivo:          ["general"],
  signos_vitales:  ["signos_vitales", "general"],
  hallazgos:       ["exploracion", "general"],
  tratamiento:     ["tratamiento", "indicaciones", "general"],
  estudios:        ["general"],
  pronostico:      ["diagnostico", "general"],
  notas:           ["indicaciones", "general"],
};

type ConsultationType = "general" | "seguimiento" | "urgencia" | "prenatal" | "estudios" | "certificado" | null;

const CONSULTATION_TYPES = [
  { id: "general" as const, label: "Consulta general", desc: "Exploración completa, diagnóstico, tratamiento", icon: Stethoscope },
  { id: "seguimiento" as const, label: "Seguimiento", desc: "Revisión de tratamiento previo, evolución", icon: Clock },
  { id: "urgencia" as const, label: "Urgencia", desc: "Triage rápido, signos vitales prioritarios", icon: Activity },
  { id: "prenatal" as const, label: "Control prenatal", desc: "Peso, TA, frecuencia fetal, semanas", icon: Info },
  { id: "estudios" as const, label: "Revisión de estudios", desc: "Interpretación de laboratorios/imagen", icon: FlaskConical },
  { id: "certificado" as const, label: "Certificado médico", desc: "Exploración básica, aptitud física", icon: ClipboardList },
];

type SectionId = "motivo" | "exploracion" | "diagnostico" | "tratamiento" | "estudios_sol" | "pronostico";

interface TypeConfig {
  /** Ordered list of sections to render */
  sections: SectionId[];
  /** Override section labels */
  labels: Partial<Record<string, string>>;
  /** Override KeywordField placeholders */
  placeholders: Partial<Record<string, string>>;
  /** Override section hint text */
  hints: Partial<Record<string, string>>;
  /** Show peso/altura fields inside exploración */
  showPesoAltura: boolean;
}

const TYPE_CONFIGS: Record<string, TypeConfig> = {
  general: {
    sections: ["motivo", "exploracion", "diagnostico", "tratamiento", "estudios_sol", "pronostico"],
    labels: {},
    placeholders: {},
    hints: {},
    showPesoAltura: true,
  },
  seguimiento: {
    sections: ["motivo", "exploracion", "diagnostico", "tratamiento", "pronostico"],
    labels: {
      motivo: "Evolución del paciente",
    },
    placeholders: {
      motivo: "¿Cómo ha evolucionado? Mejoría, igual, peor...",
      tratamiento: "Ajustar dosis, continuar, cambiar medicamento...",
      hallazgos: "Cambios respecto a la consulta anterior...",
    },
    hints: {},
    showPesoAltura: false,
  },
  urgencia: {
    sections: ["motivo", "exploracion", "diagnostico", "tratamiento", "pronostico"],
    labels: {},
    placeholders: {
      motivo: "Motivo de urgencia: dolor torácico, disnea, trauma...",
      signos_vitales: "TA, FC, FR, SpO2, temp, escala de Glasgow...",
      hallazgos: "Estado general, vía aérea, ventilación, circulación...",
    },
    hints: {
      signos_vitales: "· Triage: priorizar signos vitales",
    },
    showPesoAltura: false,
  },
  prenatal: {
    sections: ["motivo", "exploracion", "diagnostico", "pronostico"],
    labels: {
      motivo: "Control prenatal",
      hallazgos: "Hallazgos obstétricos",
    },
    placeholders: {
      motivo: "Semanas de gestación, síntomas, movimientos fetales...",
      signos_vitales: "TA, peso, FCF (frecuencia cardiaca fetal)...",
      hallazgos: "Altura uterina, presentación, FCF, edema...",
    },
    hints: {},
    showPesoAltura: true,
  },
  estudios: {
    sections: ["motivo", "diagnostico", "tratamiento", "pronostico"],
    labels: {
      motivo: "Estudio revisado",
    },
    placeholders: {
      motivo: "BH, QS, USG abdominal, Rx tórax... hallazgos relevantes",
    },
    hints: {},
    showPesoAltura: false,
  },
  certificado: {
    sections: ["motivo", "exploracion", "diagnostico", "pronostico"],
    labels: {
      motivo: "Motivo del certificado",
      pronostico_label: "Dictamen",
    },
    placeholders: {
      motivo: "Certificado para: trabajo, escuela, deporte, manejo...",
      hallazgos: "Exploración básica, estado general...",
      pronostico: "Apto / No apto para la actividad indicada",
    },
    hints: {},
    showPesoAltura: true,
  },
};

export default function NuevaConsultaPage() {
  const [selectedType, setSelectedType] = useState<ConsultationType>(null);
  const [started, setStarted] = useState(false);
  const [sections, setSections] = useState<Record<string, string>>({});
  const [peso, setPeso] = useState("");
  const [altura, setAltura] = useState("");
  const [selectedDx, setSelectedDx] = useState<{ codigo: string; descripcion: string }[]>([]);
  const [allSnippets, setAllSnippets] = useState<SnippetPersonalizado[]>([]);
  const router = useRouter();
  const params = useParams();
  const { showToast } = useToast();

  useEffect(() => {
    fetch("/api/snippets")
      .then((res) => res.ok ? res.json() : { snippets: [] })
      .then((data) => setAllSnippets(data.snippets ?? []))
      .catch(() => {});
  }, []);

  const snippetsForSection = useCallback(
    (section: string): SnippetMatch[] => {
      const allowedCats = SECTION_CATEGORIES[section] ?? ["general"];
      return allSnippets
        .filter((s) => allowedCats.includes(s.categoria))
        .map((s) => ({ atajo: s.atajo, texto: s.texto }));
    },
    [allSnippets]
  );

  const typeConfig = TYPE_CONFIGS[selectedType ?? "general"] ?? TYPE_CONFIGS.general;
  const visibleSections = typeConfig.sections;
  const isVisible = (id: SectionId) => visibleSections.includes(id);
  const getPlaceholder = (key: string, fallback: string) => typeConfig.placeholders[key] ?? fallback;
  const getLabel = (key: string, fallback: string) => typeConfig.labels[key] ?? fallback;

  const calcIMC = (): { value: number; label: string } | null => {
    const pesoNum = parseFloat(peso.replace(/[^0-9.]/g, ""));
    const alturaNum = parseFloat(altura.replace(/[^0-9.]/g, ""));
    if (!pesoNum || !alturaNum || pesoNum <= 0 || alturaNum <= 0) return null;
    const altM = alturaNum > 3 ? alturaNum / 100 : alturaNum;
    const imc = pesoNum / (altM * altM);
    let label = "Obesidad";
    if (imc < 18.5) label = "Bajo peso";
    else if (imc < 25) label = "Normal";
    else if (imc < 30) label = "Sobrepeso";
    return { value: Math.round(imc * 10) / 10, label };
  };
  const imc = calcIMC();

  const SECTION_KEYS: Record<SectionId, string[]> = {
    motivo: ["motivo"],
    exploracion: ["signos_vitales", "hallazgos"],
    diagnostico: ["diagnostico"],
    tratamiento: ["tratamiento"],
    estudios_sol: ["estudios"],
    pronostico: ["pronostico"],
  };
  const visibleKeys = visibleSections.flatMap((s) => SECTION_KEYS[s]);
  const TOTAL_SECTIONS = visibleKeys.length;
  const filledSections = visibleKeys.filter((k) => sections[k]?.trim()).length;

  const canReview = !!(sections.motivo || sections.hallazgos);

  const now = new Date();
  const dateStr = now.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const timeStr = now.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });

  const handleExpansion = (section: string) => (text: string) => {
    setSections((prev) => ({ ...prev, [section]: text }));
  };

  const handleReview = () => {
    const formData = {
      tipo: selectedType,
      peso,
      altura,
      diagnosticos: selectedDx,
      sections,
      fecha: dateStr,
      hora: timeStr,
    };
    sessionStorage.setItem("consultaData", JSON.stringify(formData));
    router.push(`/consulta/${params.pacienteId}/nueva-consulta/revisar`);
  };

  if (!started) {
    return (
      <div className="space-y-5">
        <div>
          <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
            ¿Qué tipo de consulta es?
          </h2>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            Selecciona para pre-cargar la estructura y sugerencias relevantes.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {CONSULTATION_TYPES.map((type) => {
            const Icon = type.icon;
            const isSelected = selectedType === type.id;
            return (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className="card p-4 text-left transition-all"
                style={{
                  borderColor: isSelected ? "var(--primary)" : "var(--border)",
                  borderWidth: isSelected ? 2 : 1,
                  background: isSelected ? "var(--primary-light)" : "var(--bg-card)",
                }}
              >
                <div className="flex items-start gap-3">
                  <Icon
                    className="h-5 w-5 mt-0.5 shrink-0"
                    style={{ color: isSelected ? "var(--primary)" : "var(--text-muted)" }}
                  />
                  <div>
                    <div
                      className="text-sm font-semibold"
                      style={{ color: isSelected ? "var(--primary)" : "var(--text-primary)" }}
                    >
                      {type.label}
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                      {type.desc}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex justify-end">
          <button
            className="flex items-center gap-2 py-3 px-6 rounded-xl text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            style={{ background: "var(--primary)" }}
            disabled={!selectedType}
            onClick={() => setStarted(true)}
          >
            <ArrowRight className="h-4 w-4" />
            Iniciar consulta
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setStarted(false)}
          className="flex items-center gap-1.5 text-sm font-medium"
          style={{ color: "var(--primary)" }}
        >
          <ArrowLeft className="h-4 w-4" />
          Cambiar tipo
        </button>
        <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
          <span>{filledSections}/{TOTAL_SECTIONS} secciones completadas</span>
          <div className="w-24 h-1.5 rounded-full" style={{ background: "var(--border)" }}>
            <div
              className="h-full rounded-full transition-all"
              style={{ background: "var(--primary)", width: `${(filledSections / TOTAL_SECTIONS) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div
        className="rounded-lg px-4 py-3 text-sm flex items-center gap-2"
        style={{ background: "var(--primary-light)", color: "var(--primary)" }}
      >
        <Info className="h-4 w-4" />
        Dicta palabras clave y la IA redactará el texto clinico.
      </div>

      <div className="flex items-center gap-2 text-sm" style={{ color: "var(--text-muted)" }}>
        <Clock className="h-4 w-4" />
        <span className="capitalize">{dateStr} · {timeStr} hrs · {CONSULTATION_TYPES.find(t => t.id === selectedType)?.label}</span>
      </div>

      {isVisible("motivo") && (
        <section>
          <div className="section-header">
            <Stethoscope className="h-4 w-4 icon" />
            {getLabel("motivo", "Motivo de la consulta")}
          </div>
          <KeywordField
            section="motivo"
            placeholder={getPlaceholder("motivo", "Dolor abdominal y fiebre...")}
            onExpansion={handleExpansion("motivo")}
            snippets={snippetsForSection("motivo")}
          />
        </section>
      )}

      {isVisible("exploracion") && (
        <section>
          <div className="section-header">
            <Activity className="h-4 w-4 icon" />
            Exploración física
          </div>

          {typeConfig.showPesoAltura && (
            <>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-sm mb-1 block" style={{ color: "var(--text-secondary)" }}>Peso</label>
                  <input
                    type="text"
                    value={peso}
                    onChange={(e) => setPeso(e.target.value)}
                    placeholder="72 kg"
                  />
                </div>
                <div>
                  <label className="text-sm mb-1 block" style={{ color: "var(--text-secondary)" }}>Altura</label>
                  <input
                    type="text"
                    value={altura}
                    onChange={(e) => setAltura(e.target.value)}
                    placeholder="1.65 m"
                  />
                </div>
              </div>
              {imc && (
                <div className="mb-4 text-sm font-medium" style={{ color: "var(--primary)" }}>
                  IMC: {imc.value} ({imc.label})
                </div>
              )}
            </>
          )}

          <label className="text-sm mb-1 block" style={{ color: "var(--text-secondary)" }}>
            Signos vitales
            {typeConfig.hints.signos_vitales && (
              <span className="ml-1 text-xs" style={{ color: "var(--text-muted)" }}>{typeConfig.hints.signos_vitales}</span>
            )}
          </label>
          <KeywordField
            section="signos_vitales"
            placeholder={getPlaceholder("signos_vitales", "temp 38, PA 140/90, FC 80, FR 18, SpO2 97")}
            onExpansion={handleExpansion("signos_vitales")}
            snippets={snippetsForSection("signos_vitales")}
          />

          <div className="mt-4">
            <label className="text-sm mb-1 block" style={{ color: "var(--text-secondary)" }}>
              {getLabel("hallazgos", "Hallazgos de la exploración")}
              <span className="ml-1 text-xs" style={{ color: "var(--text-muted)" }}>· Lo que se observó durante la revisión</span>
            </label>
            <KeywordField
              section="hallazgos"
              placeholder={getPlaceholder("hallazgos", "abdomen blando, no doloroso, faringe hiperémica...")}
              onExpansion={handleExpansion("hallazgos")}
              snippets={snippetsForSection("hallazgos")}
            />
          </div>
        </section>
      )}

      {isVisible("diagnostico") && (
        <section>
          <div className="section-header">
            <ClipboardList className="h-4 w-4 icon" />
            Diagnóstico
            <span className="section-hint">· Escribe el nombre y se sugiere CIE-10</span>
          </div>
          <CIE10Autocomplete
            selected={selectedDx}
            onSelect={setSelectedDx}
          />
        </section>
      )}

      {isVisible("tratamiento") && (
        <section>
          <div className="section-header">
            <Pill className="h-4 w-4 icon" />
            Tratamiento
            <span className="section-hint">· Ej: omeprazol 20 cada 12 por 14</span>
          </div>
          <KeywordField
            section="tratamiento"
            placeholder={getPlaceholder("tratamiento", "omeprazol 20 cada 12 por 14, dieta blanda, reposo")}
            onExpansion={handleExpansion("tratamiento")}
            snippets={snippetsForSection("tratamiento")}
          />
        </section>
      )}

      {isVisible("estudios_sol") && (
        <section>
          <div className="section-header">
            <FlaskConical className="h-4 w-4 icon" />
            Estudios
            <span className="section-hint">· Si se requiere solicitar algún estudio</span>
          </div>
          <KeywordField
            section="estudios"
            placeholder="BH, QS6, USG abdominal, Rx tórax..."
            onExpansion={handleExpansion("estudios")}
            snippets={snippetsForSection("estudios")}
          />
        </section>
      )}

      {isVisible("pronostico") && (
        <section>
          <div className="section-header">
            <MessageSquare className="h-4 w-4 icon" />
            {getLabel("pronostico_label", "Pronóstico y notas")}
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-sm mb-1 block" style={{ color: "var(--text-secondary)" }}>
                {getLabel("pronostico_label", "Pronóstico")}
              </label>
              <KeywordField
                section="pronostico"
                placeholder={getPlaceholder("pronostico", "Favorable, control en 2 semanas")}
                onExpansion={handleExpansion("pronostico")}
                snippets={snippetsForSection("pronostico")}
              />
            </div>
            <div>
              <label className="text-sm mb-1 block" style={{ color: "var(--text-secondary)" }}>Notas adicionales</label>
              <KeywordField
                section="notas"
                placeholder="Evitar irritantes y cafeína, datos de alarma explicados"
                onExpansion={handleExpansion("notas")}
                snippets={snippetsForSection("notas")}
              />
            </div>
          </div>
        </section>
      )}

      <section>
        <ReferenceSearch />
      </section>

      {allSnippets.length > 0 && (
        <div
          className="flex items-center gap-2 text-xs rounded-lg px-3 py-2"
          style={{ background: "var(--primary-light)", color: "var(--primary)" }}
        >
          <span>⚡</span>
          <span>
            Tienes <strong>{allSnippets.length} snippets</strong> activos.
            Escribe el atajo (ej. <code className="font-mono">#normal</code>) en el campo correspondiente y se expandirá automáticamente.
          </span>
        </div>
      )}

      <div className="flex justify-end pt-4">
        <button
          className="flex items-center gap-2 py-3 px-6 rounded-xl text-sm font-medium text-white transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: "var(--primary)" }}
          disabled={!canReview}
          onClick={handleReview}
        >
          <ArrowRight className="h-4 w-4" />
          Ver resumen y firmar
        </button>
      </div>
    </div>
  );
}
