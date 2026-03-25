import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || "";
    const db = getDb();

    let results;
    if (q.trim()) {
      results = db
        .prepare(
          `SELECT * FROM catalogo_cie10
           WHERE codigo LIKE ? OR descripcion LIKE ?
           ORDER BY codigo
           LIMIT 20`
        )
        .all(`%${q}%`, `%${q}%`);
    } else {
      results = db.prepare("SELECT * FROM catalogo_cie10 ORDER BY codigo").all();
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Error searching CIE-10:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
