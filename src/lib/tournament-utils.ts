import { Tournament, advanceBracket } from "./tournament";

/**
 * G5API match data (subset relevant to auto-advance).
 */
interface G5Match {
  end_time: string | null;
  winner: number | null;
  team1_id: number;
  team2_id: number;
  team1_score: number;
  team2_score: number;
}

/**
 * Result of checking a single live bracket match against G5API.
 */
export interface MatchCheckResult {
  match_id: number;
  g5match: G5Match;
}

/**
 * Fetcher signature: given a G5API match id, return the match object.
 * Server-side can use getMatch(), client-side can use fetch().
 */
export type MatchFetcher = (matchId: number) => Promise<G5Match | null>;

/**
 * Core auto-advance logic shared between server and client components.
 *
 * Checks all live bracket matches against G5API. If a match has finished
 * (has end_time) and the bracket match has no winner yet, determines the
 * winner and advances the bracket.
 *
 * Returns { tournament, changed, results } where results contains the
 * G5API match data for each checked match (useful for side effects like
 * updating live scores).
 */
export async function autoAdvanceTournament(
  tournament: Tournament,
  fetchMatch: MatchFetcher,
): Promise<{ tournament: Tournament; changed: boolean; results: MatchCheckResult[] }> {
  if (tournament.status === "finished") {
    return { tournament, changed: false, results: [] };
  }

  const liveMatches = tournament.matches.filter(m => m.status === "live" && m.match_id);
  if (liveMatches.length === 0) {
    return { tournament, changed: false, results: [] };
  }

  let updated = { ...tournament, matches: tournament.matches.map(m => ({ ...m })) };
  let changed = false;
  const results: MatchCheckResult[] = [];

  for (const bm of liveMatches) {
    try {
      const g5match = await fetchMatch(bm.match_id!);
      if (!g5match) continue;

      results.push({ match_id: bm.match_id!, g5match });

      if (g5match.end_time && !bm.winner_id) {
        let winnerId = g5match.winner;
        if (!winnerId && g5match.team1_score !== g5match.team2_score) {
          winnerId = g5match.team1_score > g5match.team2_score
            ? g5match.team1_id
            : g5match.team2_id;
        }
        if (winnerId) {
          const tourTeam = updated.teams.find(t => t.id === winnerId);
          if (tourTeam) {
            updated = advanceBracket(updated, bm.id, tourTeam.id);
            changed = true;
          }
        }
      }
    } catch { /* ignore */ }
  }

  return { tournament: changed ? updated : tournament, changed, results };
}
