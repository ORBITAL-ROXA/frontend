// ═══ Faceit matches storage (MySQL) ═══

import { dbPool } from "./tournaments-db";
import type { MappedMatch } from "./faceit-mapper";

let tableEnsured = false;

async function ensureFaceitTable() {
  if (tableEnsured) return;
  try {
    await dbPool.execute(`
      CREATE TABLE IF NOT EXISTS faceit_match (
        faceit_match_id VARCHAR(128) PRIMARY KEY,
        tournament_id VARCHAR(64) DEFAULT NULL,
        g5_match_id INT DEFAULT NULL,
        data JSON NOT NULL,
        status VARCHAR(32) NOT NULL DEFAULT 'pending',
        demo_downloaded TINYINT(1) DEFAULT 0,
        highlights_processed TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
  } catch { /* table may already exist */ }
  tableEnsured = true;
}

export async function saveFaceitMatch(match: MappedMatch, tournamentId?: string): Promise<boolean> {
  try {
    await ensureFaceitTable();
    await dbPool.execute(
      `INSERT INTO faceit_match (faceit_match_id, tournament_id, data, status)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE data = VALUES(data), status = VALUES(status), updated_at = NOW()`,
      [match.faceit_match_id, tournamentId || null, JSON.stringify(match), match.status]
    );
    return true;
  } catch (err) {
    console.error("[FACEIT DB SAVE]", err);
    return false;
  }
}

export async function getFaceitMatchFromDB(faceitMatchId: string): Promise<MappedMatch | null> {
  try {
    await ensureFaceitTable();
    const [rows] = await dbPool.execute(
      "SELECT data FROM faceit_match WHERE faceit_match_id = ?",
      [faceitMatchId]
    );
    const arr = rows as { data: string }[];
    if (arr.length === 0) return null;
    return typeof arr[0].data === "string" ? JSON.parse(arr[0].data) : arr[0].data;
  } catch (err) {
    console.error("[FACEIT DB GET]", err);
    return null;
  }
}

export async function getAllFaceitMatches(tournamentId?: string): Promise<MappedMatch[]> {
  try {
    await ensureFaceitTable();
    const query = tournamentId
      ? "SELECT data FROM faceit_match WHERE tournament_id = ? ORDER BY updated_at DESC"
      : "SELECT data FROM faceit_match ORDER BY updated_at DESC";
    const params = tournamentId ? [tournamentId] : [];
    const [rows] = await dbPool.execute(query, params);
    return (rows as { data: string }[]).map((row) =>
      typeof row.data === "string" ? JSON.parse(row.data) : row.data
    );
  } catch (err) {
    console.error("[FACEIT DB LIST]", err);
    return [];
  }
}

export async function linkFaceitToG5Match(faceitMatchId: string, g5MatchId: number): Promise<boolean> {
  try {
    await ensureFaceitTable();
    await dbPool.execute(
      "UPDATE faceit_match SET g5_match_id = ? WHERE faceit_match_id = ?",
      [g5MatchId, faceitMatchId]
    );
    return true;
  } catch (err) {
    console.error("[FACEIT DB LINK]", err);
    return false;
  }
}

export async function markDemoDownloaded(faceitMatchId: string): Promise<boolean> {
  try {
    await dbPool.execute(
      "UPDATE faceit_match SET demo_downloaded = 1 WHERE faceit_match_id = ?",
      [faceitMatchId]
    );
    return true;
  } catch {
    return false;
  }
}

export async function markHighlightsProcessed(faceitMatchId: string): Promise<boolean> {
  try {
    await dbPool.execute(
      "UPDATE faceit_match SET highlights_processed = 1 WHERE faceit_match_id = ?",
      [faceitMatchId]
    );
    return true;
  } catch {
    return false;
  }
}

export async function getPendingDemoMatches(): Promise<{ faceit_match_id: string; data: MappedMatch }[]> {
  try {
    await ensureFaceitTable();
    const [rows] = await dbPool.execute(
      "SELECT faceit_match_id, data FROM faceit_match WHERE status = 'finished' AND demo_downloaded = 0"
    );
    return (rows as { faceit_match_id: string; data: string }[]).map((row) => ({
      faceit_match_id: row.faceit_match_id,
      data: typeof row.data === "string" ? JSON.parse(row.data) : row.data,
    }));
  } catch {
    return [];
  }
}
