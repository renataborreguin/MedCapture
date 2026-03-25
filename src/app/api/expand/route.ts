import { NextRequest, NextResponse } from "next/server";
import { expandSection } from "@/lib/gemini";

const SECTION_PROMPTS: Record<string, string> = {
  motivo:
    "Expande estas keywords del médico en un motivo de consulta claro en lenguaje técnico-médico. Solo el texto expandido, sin encabezados.",
  signos_vitales:
    "Expande estas abreviaciones de signos vitales en texto clínico completo con unidades de medida. Solo el texto expandido.",
  exploracion:
    "Expande estas keywords en una descripción de exploración física en lenguaje técnico-médico. Solo el texto expandido.",
  estudios:
    "Expande estas abreviaciones de estudios médicos en nombres completos. Solo la lista expandida.",
  tratamiento:
    "Expande estas keywords en indicaciones terapéuticas estructuradas: medicamento genérico, dosis, vía de administración, periodicidad y duración. Formato de lista numerada. Solo el texto expandido.",
  pronostico:
    "Expande estas keywords en un pronóstico médico formal. Solo el texto expandido.",
  notas:
    "Expande estas keywords en notas de evolución en lenguaje técnico-médico. Solo el texto expandido.",
};

const REFERENCE_SECTIONS = ["tratamiento", "signos_vitales", "motivo"];

const REFERENCE_PROMPT = `Basándote en las keywords médicas proporcionadas, genera 1-2 referencias clínicas breves y relevantes que serían útiles para el médico. Pueden ser:
- Alertas de interacciones medicamentosas
- Contraindicaciones relevantes
- Rangos normales de signos vitales si están alterados
- Dosis recomendadas o precauciones
- Guías clínicas relevantes

Responde en formato JSON como un array de objetos: [{"tipo": "alerta"|"info"|"precaucion", "texto": "..."}]
Si no hay referencias relevantes, responde con un array vacío: []
Solo el JSON, sin markdown, sin explicaciones.`;

export async function POST(request: NextRequest) {
  try {
    const { keywords, section } = await request.json();

    if (!keywords?.trim()) {
      return NextResponse.json({ expansion: "", referencias: [] });
    }

    if (!process.env.GCP_PROJECT_ID) {
      return NextResponse.json(
        { error: "GCP_PROJECT_ID no configurado" },
        { status: 500 }
      );
    }

    const sectionPrompt =
      SECTION_PROMPTS[section] ||
      "Expande estas keywords médicas en texto clínico formal. Solo el texto expandido.";

    const shouldFetchRefs = REFERENCE_SECTIONS.includes(section);

    const [expansion, refResult] = await Promise.all([
      expandSection(keywords, sectionPrompt),
      shouldFetchRefs
        ? expandSection(keywords, REFERENCE_PROMPT).catch(() => "[]")
        : Promise.resolve("[]"),
    ]);

    let referencias: { tipo: string; texto: string }[] = [];
    try {
      // Clean potential markdown wrapping
      const cleaned = refResult.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      referencias = JSON.parse(cleaned);
      if (!Array.isArray(referencias)) referencias = [];
    } catch {
      referencias = [];
    }

    return NextResponse.json({ expansion, referencias });
  } catch (error) {
    console.error("Expansion error:", error);
    return NextResponse.json(
      { expansion: "", referencias: [], error: "Error al expandir" },
      { status: 500 }
    );
  }
}
