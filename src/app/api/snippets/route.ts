import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import crypto from "crypto";
import { MEDICO_ID } from "@/lib/constants";

export async function GET() {
  try {
    const db = getDb();
    const snippets = db
      .prepare(
        `SELECT * FROM snippets_personalizados
         WHERE medico_id = ?
         ORDER BY categoria, atajo`
      )
      .all(MEDICO_ID);

    return NextResponse.json({ snippets });
  } catch (error) {
    console.error("Error fetching snippets:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { atajo, texto, categoria } = body;

    if (!atajo || !texto) {
      return NextResponse.json(
        { error: "Atajo y texto son requeridos" },
        { status: 400 }
      );
    }

    const db = getDb();
    const id = crypto.randomUUID();

    const atajoNorm = atajo.startsWith("#") ? atajo : `#${atajo}`;

    db.prepare(
      `INSERT INTO snippets_personalizados (id, medico_id, atajo, texto, categoria)
       VALUES (?, ?, ?, ?, ?)`
    ).run(id, MEDICO_ID, atajoNorm.toLowerCase(), texto, categoria || "general");

    const snippet = db
      .prepare("SELECT * FROM snippets_personalizados WHERE id = ?")
      .get(id);

    return NextResponse.json({ snippet }, { status: 201 });
  } catch (error) {
    console.error("Error creating snippet:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    // Handle unique constraint
    if (message.includes("UNIQUE")) {
      return NextResponse.json(
        { error: "Ya existe un snippet con ese atajo" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, atajo, texto, categoria } = body;

    if (!id) {
      return NextResponse.json({ error: "ID requerido" }, { status: 400 });
    }

    const db = getDb();
    const atajoNorm = atajo?.startsWith("#") ? atajo : `#${atajo}`;

    db.prepare(
      `UPDATE snippets_personalizados
       SET atajo = ?, texto = ?, categoria = ?, updated_at = datetime('now')
       WHERE id = ? AND medico_id = ?`
    ).run(atajoNorm.toLowerCase(), texto, categoria || "general", id, MEDICO_ID);

    const snippet = db
      .prepare("SELECT * FROM snippets_personalizados WHERE id = ?")
      .get(id);

    return NextResponse.json({ snippet });
  } catch (error) {
    console.error("Error updating snippet:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    if (message.includes("UNIQUE")) {
      return NextResponse.json(
        { error: "Ya existe un snippet con ese atajo" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID requerido" }, { status: 400 });
    }

    const db = getDb();
    db.prepare(
      "DELETE FROM snippets_personalizados WHERE id = ? AND medico_id = ?"
    ).run(id, MEDICO_ID);

    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error("Error deleting snippet:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
