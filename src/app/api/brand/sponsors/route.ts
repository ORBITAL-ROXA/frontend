import { NextRequest, NextResponse } from "next/server";
import { dbPool } from "@/lib/tournaments-db";
import { checkAdmin } from "../auth";

let tableReady = false;
async function ensureTable() {
  if (tableReady) return;
  await dbPool.execute(`
    CREATE TABLE IF NOT EXISTS brand_sponsors (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      type VARCHAR(100),
      contact_name VARCHAR(255),
      contact_email VARCHAR(255),
      contact_phone VARCHAR(100),
      estimated_value VARCHAR(100),
      status ENUM('prospect','contact','nego','closed','lost') DEFAULT 'prospect',
      notes TEXT,
      package_tier VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  tableReady = true;
}

export async function GET(req: NextRequest) {
  const authError = await checkAdmin(req);
  if (authError) return authError;
  await ensureTable();
  const [rows] = await dbPool.query("SELECT * FROM brand_sponsors ORDER BY created_at DESC");
  return NextResponse.json({ sponsors: rows });
}

export async function POST(req: NextRequest) {
  const authError = await checkAdmin(req);
  if (authError) return authError;
  await ensureTable();
  const { name, type, contact_name, contact_email, contact_phone, estimated_value } = await req.json();
  if (!name) return NextResponse.json({ error: "name obrigatório" }, { status: 400 });
  const [result] = await dbPool.query(
    "INSERT INTO brand_sponsors (name, type, contact_name, contact_email, contact_phone, estimated_value) VALUES (?, ?, ?, ?, ?, ?)",
    [name, type || "local", contact_name, contact_email, contact_phone, estimated_value]
  ) as [{ insertId: number }, unknown];
  return NextResponse.json({ id: result.insertId }, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const authError = await checkAdmin(req);
  if (authError) return authError;
  await ensureTable();
  const body = await req.json();
  const { id, ...fields } = body;
  if (!id) return NextResponse.json({ error: "id obrigatório" }, { status: 400 });
  const allowed = ["name", "type", "contact_name", "contact_email", "contact_phone", "estimated_value", "status", "notes", "package_tier"];
  const updates: string[] = [];
  const params: (string | number)[] = [];
  for (const key of allowed) {
    if (fields[key] !== undefined) { updates.push(`${key} = ?`); params.push(fields[key]); }
  }
  if (updates.length === 0) return NextResponse.json({ error: "Nada pra atualizar" }, { status: 400 });
  params.push(id);
  await dbPool.query(`UPDATE brand_sponsors SET ${updates.join(", ")} WHERE id = ?`, params);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const authError = await checkAdmin(req);
  if (authError) return authError;
  await ensureTable();
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id obrigatório" }, { status: 400 });
  await dbPool.query("DELETE FROM brand_sponsors WHERE id = ?", [id]);
  return NextResponse.json({ ok: true });
}
