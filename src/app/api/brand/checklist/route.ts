import { NextRequest, NextResponse } from "next/server";
import { dbPool } from "@/lib/tournaments-db";
import { ensureBrandTables } from "../init-db";
import { checkAdmin } from "../auth";

export async function GET(req: NextRequest) {
  const authError = await checkAdmin(req);
  if (authError) return authError;

  try {
    await ensureBrandTables();
    const [rows] = await dbPool.execute("SELECT * FROM brand_checklist ORDER BY sort_order, id");
    return NextResponse.json({ checklist: rows });
  } catch (err) {
    console.error("[BRAND CHECKLIST GET]", err);
    return NextResponse.json({ checklist: [] });
  }
}

export async function POST(req: NextRequest) {
  const authError = await checkAdmin(req);
  if (authError) return authError;

  try {
    await ensureBrandTables();
    const { title, description, category, priority } = await req.json();
    const [maxOrder] = await dbPool.execute("SELECT MAX(sort_order) as mx FROM brand_checklist");
    const nextOrder = ((maxOrder as { mx: number | null }[])[0].mx || 0) + 1;
    const [result] = await dbPool.execute(
      "INSERT INTO brand_checklist (title, description, category, priority, sort_order) VALUES (?, ?, ?, ?, ?)",
      [title, description || null, category || "visual", priority || "med", nextOrder]
    );
    const insertId = (result as { insertId: number }).insertId;
    return NextResponse.json({ id: insertId }, { status: 201 });
  } catch (err) {
    console.error("[BRAND CHECKLIST POST]", err);
    return NextResponse.json({ error: "Erro ao criar item" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const authError = await checkAdmin(req);
  if (authError) return authError;

  try {
    await ensureBrandTables();
    const { id, done } = await req.json();
    if (typeof done === "boolean") {
      await dbPool.execute(
        "UPDATE brand_checklist SET done = ?, done_at = ? WHERE id = ?",
        [done, done ? new Date() : null, id]
      );
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[BRAND CHECKLIST PUT]", err);
    return NextResponse.json({ error: "Erro ao atualizar item" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const authError = await checkAdmin(req);
  if (authError) return authError;

  try {
    const { id } = await req.json();
    await dbPool.execute("DELETE FROM brand_checklist WHERE id = ?", [id]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[BRAND CHECKLIST DELETE]", err);
    return NextResponse.json({ error: "Erro ao deletar item" }, { status: 500 });
  }
}
