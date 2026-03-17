import { NextRequest, NextResponse } from "next/server";
import { getFaceitMatchFromDB } from "@/lib/faceit-db";
import { getFaceitMatch, getFaceitMatchStats } from "@/lib/faceit";
import { mapFaceitMatch, enrichStatsWithSteamIds } from "@/lib/faceit-mapper";

// GET — buscar uma partida Faceit específica (DB primeiro, fallback pra API)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    // Tentar do banco primeiro
    const cached = await getFaceitMatchFromDB(id);
    if (cached) {
      return NextResponse.json({ match: cached });
    }

    // Fallback: buscar direto da Faceit API
    const faceitMatch = await getFaceitMatch(id);
    let faceitStats = null;
    if (faceitMatch.status === "FINISHED") {
      try {
        faceitStats = await getFaceitMatchStats(id);
      } catch { /* stats may not be ready */ }
    }

    const mapped = mapFaceitMatch(faceitMatch, faceitStats ?? undefined);
    const enriched = enrichStatsWithSteamIds(mapped);

    return NextResponse.json({ match: enriched });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Match não encontrada";
    return NextResponse.json({ error: message }, { status: 404 });
  }
}
