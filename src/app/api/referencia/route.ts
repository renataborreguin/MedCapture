import { NextRequest, NextResponse } from "next/server";
import { expandSection } from "@/lib/gemini";

const REFERENCE_SEARCH_PROMPT = `Eres una enciclopedia médica. El médico te hace una consulta rápida durante una consulta con paciente. Responde de forma concisa, precisa y en español.

Incluye cuando sea relevante:
- Dosis recomendadas (adulto/pediátrico)
- Contraindicaciones principales
- Interacciones medicamentosas importantes
- Efectos adversos comunes
- Rangos normales de laboratorio
- Guías de manejo resumidas

Responde en 2-4 oraciones máximo. Sé directo y útil. Solo texto plano, sin markdown.`;

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();

    if (!query?.trim()) {
      return NextResponse.json({ respuesta: "" });
    }

    if (!process.env.GCP_PROJECT_ID) {
      return NextResponse.json(
        { error: "GCP_PROJECT_ID no configurado" },
        { status: 500 }
      );
    }

    const respuesta = await expandSection(query, REFERENCE_SEARCH_PROMPT);

    return NextResponse.json({ respuesta });
  } catch (error) {
    console.error("Reference search error:", error);
    return NextResponse.json(
      { respuesta: "", error: "Error en búsqueda" },
      { status: 500 }
    );
  }
}
