import { NextRequest, NextResponse } from "next/server";
import { dbPool } from "@/lib/tournaments-db";
import { ensureBrandTables } from "../init-db";
import { checkAdmin } from "../auth";

export async function GET(req: NextRequest) {
  const authError = await checkAdmin(req);
  if (authError) return authError;

  try {
    await ensureBrandTables();
    const section_key = req.nextUrl.searchParams.get("section_key");

    if (section_key) {
      const [rows] = await dbPool.execute(
        "SELECT * FROM brand_notes WHERE section_key = ?",
        [section_key]
      );
      const arr = rows as { id: number; section_key: string; content: string | null }[];
      return NextResponse.json({ note: arr[0] || null });
    }

    const [rows] = await dbPool.execute("SELECT * FROM brand_notes ORDER BY section_key");
    return NextResponse.json({ notes: rows });
  } catch (err) {
    console.error("[BRAND NOTES GET]", err);
    return NextResponse.json({ notes: [] });
  }
}

export async function PUT(req: NextRequest) {
  const authError = await checkAdmin(req);
  if (authError) return authError;

  try {
    await ensureBrandTables();
    const { section_key, content } = await req.json();

    const [existing] = await dbPool.execute(
      "SELECT id FROM brand_notes WHERE section_key = ?",
      [section_key]
    );
    const rows = existing as { id: number }[];

    if (rows.length > 0) {
      await dbPool.execute(
        "UPDATE brand_notes SET content = ? WHERE section_key = ?",
        [content, section_key]
      );
    } else {
      await dbPool.execute(
        "INSERT INTO brand_notes (section_key, content) VALUES (?, ?)",
        [section_key, content]
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[BRAND NOTES PUT]", err);
    return NextResponse.json({ error: "Erro ao salvar nota" }, { status: 500 });
  }
}
