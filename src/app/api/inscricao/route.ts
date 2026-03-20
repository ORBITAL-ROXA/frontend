import { NextRequest, NextResponse } from "next/server";
import { dbPool } from "@/lib/tournaments-db";
import { checkAdmin } from "../brand/auth";

let tableReady = false;

async function ensureTable() {
  if (tableReady) return;
  const pool = dbPool;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS inscricoes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      tournament_id VARCHAR(36),
      team_name VARCHAR(255) NOT NULL,
      team_tag VARCHAR(20) NOT NULL,
      captain_name VARCHAR(100) NOT NULL,
      captain_steam_id VARCHAR(20) NOT NULL,
      captain_whatsapp VARCHAR(20) NOT NULL,
      players JSON NOT NULL,
      logo_url VARCHAR(512),
      pix_comprovante_url VARCHAR(512),
      status ENUM('pendente','aprovado','rejeitado','pago') DEFAULT 'pendente',
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  tableReady = true;
}

// GET — listar inscrições (admin) ou verificar vaga
export async function GET(req: NextRequest) {
  await ensureTable();
  const pool = dbPool;

  const tournamentId = req.nextUrl.searchParams.get("tournament_id");
  const checkSlots = req.nextUrl.searchParams.get("check_slots");

  // Público: verificar vagas
  if (checkSlots && tournamentId) {
    const [rows] = await pool.query(
      "SELECT COUNT(*) as c FROM inscricoes WHERE tournament_id = ? AND status IN ('pendente','aprovado','pago')",
      [tournamentId]
    ) as [{ c: number }[], unknown];
    return NextResponse.json({ count: rows[0].c });
  }

  // Admin: listar todas
  const admin = await checkAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let query = "SELECT * FROM inscricoes ORDER BY created_at DESC";
  const params: string[] = [];
  if (tournamentId) {
    query = "SELECT * FROM inscricoes WHERE tournament_id = ? ORDER BY created_at DESC";
    params.push(tournamentId);
  }

  const [rows] = await pool.query(query, params);
  return NextResponse.json({ inscricoes: rows });
}

// POST — nova inscrição (público)
export async function POST(req: NextRequest) {
  await ensureTable();
  const pool = dbPool;

  try {
    const body = await req.json();
    const { tournament_id, team_name, team_tag, captain_name, captain_steam_id, captain_whatsapp, players, logo_url, pix_comprovante_url } = body;

    if (!team_name || !team_tag || !captain_name || !captain_steam_id || !captain_whatsapp || !players) {
      return NextResponse.json({ error: "Campos obrigatórios faltando" }, { status: 400 });
    }

    if (!Array.isArray(players) || players.length < 5) {
      return NextResponse.json({ error: "Mínimo 5 jogadores" }, { status: 400 });
    }

    // Validar Steam IDs
    for (const p of players) {
      if (!p.steam_id || !p.name) {
        return NextResponse.json({ error: "Cada jogador precisa de steam_id e name" }, { status: 400 });
      }
    }

    // Verificar duplicata (mesmo capitão ou mesmo nome de time)
    const [existing] = await pool.query(
      "SELECT id FROM inscricoes WHERE (captain_steam_id = ? OR team_name = ?) AND tournament_id = ? AND status != 'rejeitado'",
      [captain_steam_id, team_name, tournament_id || null]
    ) as [{ id: number }[], unknown];

    if (existing.length > 0) {
      return NextResponse.json({ error: "Time ou capitão já inscrito neste campeonato" }, { status: 409 });
    }

    const [result] = await pool.query(
      `INSERT INTO inscricoes (tournament_id, team_name, team_tag, captain_name, captain_steam_id, captain_whatsapp, players, logo_url, pix_comprovante_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [tournament_id || null, team_name, team_tag, captain_name, captain_steam_id, captain_whatsapp, JSON.stringify(players), logo_url || null, pix_comprovante_url || null]
    ) as [{ insertId: number }, unknown];

    return NextResponse.json({ id: result.insertId, status: "pendente" }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao inscrever";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PUT — atualizar status (admin)
export async function PUT(req: NextRequest) {
  const admin = await checkAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await ensureTable();
  const pool = dbPool;

  try {
    const { id, status, notes } = await req.json();
    if (!id) return NextResponse.json({ error: "id obrigatório" }, { status: 400 });

    const updates: string[] = [];
    const params: (string | number)[] = [];

    if (status) { updates.push("status = ?"); params.push(status); }
    if (notes !== undefined) { updates.push("notes = ?"); params.push(notes); }

    if (updates.length === 0) return NextResponse.json({ error: "Nada pra atualizar" }, { status: 400 });

    params.push(id);
    await pool.query(`UPDATE inscricoes SET ${updates.join(", ")} WHERE id = ?`, params);

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE — remover inscrição (admin)
export async function DELETE(req: NextRequest) {
  const admin = await checkAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await ensureTable();
  const pool = dbPool;

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id obrigatório" }, { status: 400 });

  await pool.query("DELETE FROM inscricoes WHERE id = ?", [id]);
  return NextResponse.json({ ok: true });
}
