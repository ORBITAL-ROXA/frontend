import { getMatches, getTeams, getMatch, getMapStats, getLeaderboard, Match, Team, LeaderboardEntry, getStatusType } from "@/lib/api";
import { Tournament } from "@/lib/tournament";
import { autoAdvanceTournament } from "@/lib/tournament-utils";
import { getTournamentsFromDB, saveTournamentToDB } from "@/lib/tournaments-db";
import { HomeContent } from "./home-content";

export const revalidate = 30;

export default async function HomePage() {
  let matches: Match[] = [];
  let teams: Team[] = [];
  let tournaments: Tournament[] = [];

  const [tournamentsData, matchesData, teamsData] = await Promise.all([
    getTournamentsFromDB(),
    getMatches().catch(() => ({ matches: [] as Match[] })),
    getTeams().catch(() => ({ teams: [] as Team[] })),
  ]);

  tournaments = tournamentsData;
  matches = matchesData.matches || [];
  teams = teamsData.teams || [];

  const teamsMap: Record<number, { name: string; logo: string | null; players?: { name: string; steamId: string; captain: number }[] }> = {};
  teams.forEach((t) => {
    const players = t.auth_name ? Object.entries(t.auth_name).map(([steamId, val]) => ({
      steamId,
      name: typeof val === "string" ? val : val.name,
      captain: typeof val === "string" ? 0 : (val.captain || 0),
    })) : [];
    teamsMap[t.id] = { name: t.name, logo: t.logo, players };
  });

  const liveMatches = matches.filter((m) => getStatusType(m) === "live");
  const recentMatches = matches
    .filter((m) => getStatusType(m) === "finished")
    .slice(0, 5);
  const upcomingMatches = matches
    .filter((m) => getStatusType(m) === "upcoming")
    .slice(0, 3);

  // Fetch map stats for ALL finished + live matches (bracket needs all scores)
  const allFinishedAndLive = matches.filter((m) => getStatusType(m) === "finished" || getStatusType(m) === "live");
  const mapScoresMap: Record<number, { team1_score: number; team2_score: number; map_name: string }[]> = {};
  await Promise.all(
    allFinishedAndLive.map(async (m) => {
      try {
        const raw = await getMapStats(m.id) as Record<string, unknown>;
        const mapStats = (raw.mapstats || raw.mapStats || []) as { team1_score: number; team2_score: number; map_name: string }[];
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

  // Find active tournament (priority: active > pending > finished)
  let activeTournament = tournaments.find(t => t.status === "active")
    || tournaments.find(t => t.status === "pending")
    || tournaments[0]
    || null;

  // Auto-advance: if tournament has live matches that finished in G5API, update bracket
  if (activeTournament) {
    const serverFetcher = async (matchId: number) => {
      const data = await getMatch(matchId);
      return data.match || null;
    };
    const result = await autoAdvanceTournament(activeTournament, serverFetcher);
    if (result.changed) {
      await saveTournamentToDB(result.tournament);
    }
    activeTournament = result.tournament;
  }

  // Fetch tournament MVP (top player by rating in tournament season)
  let tournamentMvp: LeaderboardEntry | null = null;
  if (activeTournament?.season_id && activeTournament.status === "finished") {
    try {
      const lbRes = await getLeaderboard(activeTournament.season_id);
      const lb = lbRes.leaderboard || [];
      const sorted = [...lb].sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0));
      tournamentMvp = sorted[0] || null;
    } catch { /* ignore */ }
  }

  return (
    <HomeContent
      tournament={activeTournament}
      liveMatches={liveMatches}
      recentMatches={recentMatches}
      upcomingMatches={upcomingMatches}
      totalMatches={matches.length}
      teamCount={teams.length}
      teamsMap={teamsMap}
      mapScoresMap={mapScoresMap}
      tournamentMvp={tournamentMvp}
    />
  );
}
