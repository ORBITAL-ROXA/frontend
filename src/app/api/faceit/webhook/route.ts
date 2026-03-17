import { NextRequest, NextResponse } from "next/server";
import { getFaceitMatch, getFaceitMatchStats, type FaceitWebhookEvent } from "@/lib/faceit";
import { mapFaceitMatch, enrichStatsWithSteamIds } from "@/lib/faceit-mapper";
import { saveFaceitMatch } from "@/lib/faceit-db";

const WEBHOOK_SECRET = process.env.FACEIT_WEBHOOK_SECRET || "";

export async function POST(req: NextRequest) {
  // Verificar secret se configurado (header ou query param)
  if (WEBHOOK_SECRET) {
    const headerSecret = req.headers.get("x-webhook-secret") || req.headers.get("authorization");
    const urlSecret = req.nextUrl.searchParams.get("secret");
    if (headerSecret !== WEBHOOK_SECRET && urlSecret !== WEBHOOK_SECRET) {
      console.warn("[FACEIT WEBHOOK] Invalid secret");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const event: FaceitWebhookEvent = await req.json();
    const eventType = event.event;
    const matchId = event.payload?.id;

    console.log(`[FACEIT WEBHOOK] ${eventType} — match: ${matchId}`);

    switch (eventType) {
      case "match_status_ready":
      case "match_status_configuring":
        await handleMatchReady(matchId);
        break;

      case "match_status_finished":
        await handleMatchFinished(matchId);
        break;

      case "match_status_cancelled":
      case "match_status_aborted":
        await handleMatchCancelled(matchId);
        break;

      case "match_demo_ready":
        await handleDemoReady(matchId);
        break;

      default:
        console.log(`[FACEIT WEBHOOK] Evento ignorado: ${eventType}`);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook error";
    console.error("[FACEIT WEBHOOK ERROR]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ── Match pronta/ao vivo ──

async function handleMatchReady(matchId: string) {
  try {
    const faceitMatch = await getFaceitMatch(matchId);
    const mapped = mapFaceitMatch(faceitMatch);
    const enriched = enrichStatsWithSteamIds(mapped);

    const tournamentId = faceitMatch.competition_id || undefined;
    await saveFaceitMatch(enriched, tournamentId);

    console.log(`[FACEIT] Match READY: ${enriched.team1_name} vs ${enriched.team2_name}`);
  } catch (err) {
    console.error("[FACEIT] Error handling match ready:", err);
  }
}

// ── Match finalizada — buscar stats completos ──

async function handleMatchFinished(matchId: string) {
  try {
    const [faceitMatch, faceitStats] = await Promise.all([
      getFaceitMatch(matchId),
      getFaceitMatchStats(matchId),
    ]);

    const mapped = mapFaceitMatch(faceitMatch, faceitStats);
    const enriched = enrichStatsWithSteamIds(mapped);

    const tournamentId = faceitMatch.competition_id || undefined;
    await saveFaceitMatch(enriched, tournamentId);

    console.log(
      `[FACEIT] Match FINISHED: ${enriched.team1_name} ${enriched.team1_score}-${enriched.team2_score} ${enriched.team2_name}`
    );

    // TODO: Auto-advance tournament bracket se a partida pertence a um campeonato ORBITAL ROXA
    // TODO: Disparar notificação Discord webhook
  } catch (err) {
    console.error("[FACEIT] Error handling match finished:", err);
  }
}

// ── Match cancelada ──

async function handleMatchCancelled(matchId: string) {
  try {
    const faceitMatch = await getFaceitMatch(matchId);
    const mapped = mapFaceitMatch(faceitMatch);
    const enriched = enrichStatsWithSteamIds(mapped);

    const tournamentId = faceitMatch.competition_id || undefined;
    await saveFaceitMatch(enriched, tournamentId);

    console.log(`[FACEIT] Match CANCELLED: ${matchId}`);
  } catch (err) {
    console.error("[FACEIT] Error handling match cancelled:", err);
  }
}

// ── Demo disponível ──

async function handleDemoReady(matchId: string) {
  try {
    const faceitMatch = await getFaceitMatch(matchId);
    const mapped = mapFaceitMatch(faceitMatch);
    const enriched = enrichStatsWithSteamIds(mapped);

    await saveFaceitMatch(enriched);

    if (enriched.demo_urls.length > 0) {
      console.log(`[FACEIT] Demo READY for ${matchId}: ${enriched.demo_urls.length} demo(s)`);
      // TODO: Disparar pipeline de highlights (download demo → parse → record → upload)
    }
  } catch (err) {
    console.error("[FACEIT] Error handling demo ready:", err);
  }
}
