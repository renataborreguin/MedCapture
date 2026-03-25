import { NextRequest, NextResponse } from "next/server";
import { generateNotaMedica } from "@/lib/gemini";
import { validateNOM004 } from "@/lib/nom004-validator";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { keywords, contexto_previo } = body;

    if (!keywords || typeof keywords !== "string" || keywords.trim() === "") {
      return NextResponse.json(
        { error: "Se requieren keywords para generar la nota médica" },
        { status: 400 }
      );
    }

    if (!process.env.GCP_PROJECT_ID) {
      return NextResponse.json(
        { error: "GCP_PROJECT_ID no configurado. Agrega tu config en .env" },
        { status: 500 }
      );
    }

    const notaGenerada = await generateNotaMedica(keywords, contexto_previo);
    const validacion = validateNOM004(notaGenerada);

    return NextResponse.json({
      nota: notaGenerada,
      validacion,
      keywords_originales: keywords,
      generado_en: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error generating medical note:", error);
    const message =
      error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { error: `Error al generar nota médica: ${message}` },
      { status: 500 }
    );
  }
}
