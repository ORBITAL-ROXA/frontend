import { NextRequest, NextResponse } from "next/server";
import { dbPool } from "@/lib/tournaments-db";
import { ensureBrandTables } from "../init-db";
import { checkAdmin } from "../auth";

export async function GET(req: NextRequest) {
  const authError = await checkAdmin(req);
  if (authError) return authError;

  try {
    await ensureBrandTables();
    const [rows] = await dbPool.execute("SELECT * FROM brand_sponsors ORDER BY created_at DESC");
    return NextResponse.json({ sponsors: rows });
  } catch (err) {
    console.error("[BRAND SPONSORS GET]", err);
    return NextResponse.json({ sponsors: [] });
  }
}

export async function POST(req: NextRequest) {
  const authError = await checkAdmin(req);
  if (authError) return authError;

  try {
    await ensureBrandTables();
    const { name, type, contact_name, contact_email, contact_phone, estimated_value, status, notes, package_tier } = await req.json();
    const [result] = await dbPool.execute(
      "INSERT INTO brand_sponsors (name, type, contact_name, contact_email, contact_phone, estimated_value, status, notes, package_tier) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [name, type || null, contact_name || null, contact_email || null, contact_phone || null, estimated_value || null, status || "prospect", notes || null, package_tier || null]
    );
    const insertId = (result as { insertId: number }).insertId;
    return NextResponse.json({ id: insertId }, { status: 201 });
  } catch (err) {
    console.error("[BRAND SPONSORS POST]", err);
    return NextResponse.json({ error: "Erro ao criar sponsor" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const authError = await checkAdmin(req);
  if (authError) return authError;

  try {
    await ensureBrandTables();
    const { id, name, type, contact_name, contact_email, contact_phone, estimated_value, actual_value, status, notes, package_tier } = await req.json();

    const fields: string[] = [];
    const values: (string | number | null)[] = [];

    if (name !== undefined) { fields.push("name = ?"); values.push(name); }
    if (type !== undefined) { fields.push("type = ?"); values.push(type); }
    if (contact_name !== undefined) { fields.push("contact_name = ?"); values.push(contact_name || null); }
    if (contact_email !== undefined) { fields.push("contact_email = ?"); values.push(contact_email || null); }
    if (contact_phone !== undefined) { fields.push("contact_phone = ?"); values.push(contact_phone || null); }
    if (estimated_value !== undefined) { fields.push("estimated_value = ?"); values.push(estimated_value || null); }
    if (actual_value !== undefined) { fields.push("actual_value = ?"); values.push(actual_value); }
    if (status !== undefined) {
      fields.push("status = ?"); values.push(status);
      if (status === "contact") { fields.push("contacted_at = ?"); values.push(new Date().toISOString().slice(0, 19).replace("T", " ")); }
      if (status === "closed") { fields.push("closed_at = ?"); values.push(new Date().toISOString().slice(0, 19).replace("T", " ")); }
    }
    if (notes !== undefined) { fields.push("notes = ?"); values.push(notes || null); }
    if (package_tier !== undefined) { fields.push("package_tier = ?"); values.push(package_tier || null); }

    if (fields.length > 0) {
      values.push(id);
      await dbPool.execute(`UPDATE brand_sponsors SET ${fields.join(", ")} WHERE id = ?`, values);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[BRAND SPONSORS PUT]", err);
    return NextResponse.json({ error: "Erro ao atualizar sponsor" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const authError = await checkAdmin(req);
  if (authError) return authError;

  try {
    const { id } = await req.json();
    await dbPool.execute("DELETE FROM brand_sponsors WHERE id = ?", [id]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[BRAND SPONSORS DELETE]", err);
    return NextResponse.json({ error: "Erro ao deletar sponsor" }, { status: 500 });
  }
}
