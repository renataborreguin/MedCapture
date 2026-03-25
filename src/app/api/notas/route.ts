import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import crypto from "crypto";
import { MEDICO_ID } from "@/lib/constants";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const db = getDb();
    const id = crypto.randomUUID();

    const pacienteId = body.paciente_id;
    if (!pacienteId) {
      return NextResponse.json(
        { error: "paciente_id es obligatorio" },
        { status: 400 }
      );
    }

    db.prepare(
      `INSERT INTO notas_evolucion
       (id, paciente_id, keywords_originales, padecimiento_actual, exploracion_fisica,
        signos_vitales, diagnosticos, pronostico, indicaciones_terapeuticas,
        nota_narrativa, nom004_porcentaje, generado_por_ia, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      pacienteId,
      body.keywords_originales || "",
      body.padecimiento_actual || "",
      body.exploracion_fisica || "",
      JSON.stringify(body.signos_vitales || {}),
      JSON.stringify(body.diagnosticos || []),
      body.pronostico || "",
      JSON.stringify(body.indicaciones_terapeuticas || []),
      body.nota_narrativa || "",
      body.nom004_porcentaje || 0,
      1,
      MEDICO_ID
    );

    return NextResponse.json({ id, paciente_id: pacienteId, saved: true });
  } catch (error) {
    console.error("Error saving nota:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const pacienteId = searchParams.get("paciente_id");

    let notas;
    if (pacienteId) {
      notas = db
        .prepare(
          `SELECT n.*, p.nombre_completo as paciente_nombre
           FROM notas_evolucion n
           LEFT JOIN pacientes p ON n.paciente_id = p.id
           WHERE n.paciente_id = ?
           ORDER BY n.created_at DESC
           LIMIT 50`
        )
        .all(pacienteId);
    } else {
      notas = db
        .prepare(
          `SELECT n.*, p.nombre_completo as paciente_nombre
           FROM notas_evolucion n
           LEFT JOIN pacientes p ON n.paciente_id = p.id
           ORDER BY n.created_at DESC
           LIMIT 50`
        )
        .all();
    }

    return NextResponse.json({ notas });
  } catch (error) {
    console.error("Error fetching notas:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
