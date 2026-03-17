import { Metadata } from "next";
import { getMatches, getTeams, getMapStats, parseMapStats, Match, Team, getStatusType } from "@/lib/api";
import { getAllFaceitMatches } from "@/lib/faceit-db";
import { PartidasContent } from "./partidas-content";
import type { MappedMatch } from "@/lib/faceit-mapper";

export const metadata: Metadata = {
  title: "Partidas | ORBITAL ROXA",
  description: "Todas as partidas de CS2 da ORBITAL ROXA. Acompanhe resultados, placares e estatísticas.",
};

export const revalidate = 30;

export default async function PartidasPage() {
  let matches: Match[] = [];
  let teams: Team[] = [];
  let faceitMatches: MappedMatch[] = [];

  try {
    const [matchesRes, teamsRes, faceitRes] = await Promise.all([
      getMatches(),
      getTeams().catch(() => ({ teams: [] })),
      getAllFaceitMatches().catch(() => []),
    ]);
    matches = matchesRes.matches || [];
    teams = teamsRes.teams || [];
    faceitMatches = faceitRes;
  } catch {
    // API offline
  }

  const teamsMap: Record<number, { name: string; logo: string | null }> = {};
  teams.forEach((t) => { teamsMap[t.id] = { name: t.name, logo: t.logo }; });

  // Fetch map stats for recent finished + live matches (limit to 16 for performance)
  const displayedMatches = [
    ...matches.filter(m => getStatusType(m) === "live"),
    ...matches.filter(m => getStatusType(m) === "finished").slice(0, 16),
  ];
  const mapScoresMap: Record<number, { team1_score: number; team2_score: number; map_name: string }[]> = {};
  await Promise.all(
    displayedMatches.map(async (m) => {
      try {
        const raw = await getMapStats(m.id) as Record<string, unknown>;
        const mapStats = parseMapStats(raw);
        if (mapStats?.length > 0) {
          mapScoresMap[m.id] = mapStats.map(ms => ({
            team1_score: ms.team1_score,
            team2_score: ms.team2_score,
            map_name: ms.map_name,
          }));
        }
      } catch { /* ignore */ }
    })
  );

  return <PartidasContent matches={matches} teamsMap={teamsMap} mapScoresMap={mapScoresMap} faceitMatches={faceitMatches} />;
}
