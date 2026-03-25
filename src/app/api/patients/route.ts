import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import crypto from "crypto";
import { MEDICO_ID } from "@/lib/constants";

const SEXO_MAP: Record<string, string> = {
  M: "masculino",
  F: "femenino",
  O: "otro",
};

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const q = searchParams.get("q");

    if (id) {
      const patient = db
        .prepare(
          `SELECT * FROM pacientes WHERE id = ? AND created_by = ?`
        )
        .get(id, MEDICO_ID);

      if (!patient) {
        return NextResponse.json(
          { error: "Paciente no encontrado" },
          { status: 404 }
        );
      }
      return NextResponse.json({ patient });
    }

    if (q && q.trim()) {
      const term = `%${q.trim()}%`;
      const patients = db
        .prepare(
          `SELECT * FROM pacientes
           WHERE created_by = ?
              AND (nombre_completo LIKE ? OR telefono LIKE ? OR curp LIKE ?)
           ORDER BY updated_at DESC
           LIMIT 50`
        )
        .all(MEDICO_ID, term, term, term);

      return NextResponse.json({ patients });
    }

    const patients = db
      .prepare(
        `SELECT * FROM pacientes
         WHERE created_by = ?
         ORDER BY updated_at DESC
         LIMIT 100`
      )
      .all(MEDICO_ID);

    return NextResponse.json({ patients });
  } catch (error) {
    console.error("Error fetching patients:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const db = getDb();
    const id = crypto.randomUUID();

    const nombre_completo = body.nombre_completo
      ? body.nombre_completo
      : [body.nombre, body.apellidoPaterno, body.apellidoMaterno]
          .filter(Boolean)
          .join(" ")
          .trim();

    if (!nombre_completo) {
      return NextResponse.json(
        { error: "El nombre del paciente es obligatorio" },
        { status: 400 }
      );
    }

    const sexo = SEXO_MAP[body.sexo] || body.sexo || "otro";
    const fecha_nacimiento = body.fechaNacimiento || body.fecha_nacimiento || "2000-01-01";
    const domicilio = body.domicilio || "";
    const telefono = body.telefono || null;
    const email = body.correo || body.email || null;
    const curp = body.curp || null;
    const alergias = body.alergias || "";
    const antecedentes_heredofamiliares = body.antecedentes_heredofamiliares || "";
    const antecedentes_patologicos = body.antecedentes_patologicos || "";
    const antecedentes_no_patologicos = body.antecedentes_no_patologicos || "";
    const antecedentes_quirurgicos = body.antecedentes_quirurgicos || "";
    const contacto_emergencia = body.contacto_emergencia || "";
    const telefono_emergencia = body.telefono_emergencia || "";

    db.prepare(
      `INSERT INTO pacientes (id, nombre_completo, sexo, fecha_nacimiento, domicilio, curp, telefono, email,
        alergias, antecedentes_heredofamiliares, antecedentes_patologicos,
        antecedentes_no_patologicos, antecedentes_quirurgicos,
        contacto_emergencia, telefono_emergencia, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(id, nombre_completo, sexo, fecha_nacimiento, domicilio, curp, telefono, email,
      alergias, antecedentes_heredofamiliares, antecedentes_patologicos,
      antecedentes_no_patologicos, antecedentes_quirurgicos,
      contacto_emergencia, telefono_emergencia, MEDICO_ID);

    const patient = db.prepare(`SELECT * FROM pacientes WHERE id = ?`).get(id);

    return NextResponse.json({ patient }, { status: 201 });
  } catch (error) {
    console.error("Error creating patient:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const db = getDb();

    const id = body.id;
    if (!id) {
      return NextResponse.json(
        { error: "El id del paciente es obligatorio" },
        { status: 400 }
      );
    }

    const existing = db
      .prepare(`SELECT id FROM pacientes WHERE id = ? AND created_by = ?`)
      .get(id, MEDICO_ID);

    if (!existing) {
      return NextResponse.json(
        { error: "Paciente no encontrado" },
        { status: 404 }
      );
    }

    const allowedFields = [
      "nombre_completo", "sexo", "fecha_nacimiento", "domicilio",
      "telefono", "email", "curp",
      "alergias", "antecedentes_heredofamiliares", "antecedentes_patologicos",
      "antecedentes_no_patologicos", "antecedentes_quirurgicos",
      "contacto_emergencia", "telefono_emergencia",
    ];

    const setClauses: string[] = [];
    const values: unknown[] = [];

    for (const field of allowedFields) {
      if (field in body) {
        setClauses.push(`${field} = ?`);
        values.push(body[field]);
      }
    }

    if (setClauses.length === 0) {
      return NextResponse.json(
        { error: "No hay campos para actualizar" },
        { status: 400 }
      );
    }

    setClauses.push("updated_at = datetime('now')");
    values.push(id);

    db.prepare(
      `UPDATE pacientes SET ${setClauses.join(", ")} WHERE id = ?`
    ).run(...values);

    const patient = db.prepare(`SELECT * FROM pacientes WHERE id = ?`).get(id);

    return NextResponse.json({ patient });
  } catch (error) {
    console.error("Error updating patient:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
