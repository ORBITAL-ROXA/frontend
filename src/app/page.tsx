import { getMatches, getTeams, Match, Team, getStatusType } from "@/lib/api";
import { Tournament } from "@/lib/tournament";
import { getTournamentsFromDB } from "@/lib/tournaments-db";
import { HomeContent } from "./home-content";

export const revalidate = 30;

export default async function HomePage() {
  let matches: Match[] = [];
  let teams: Team[] = [];
  let tournaments: Tournament[] = [];

  const [tournamentsData, apiData] = await Promise.all([
    getTournamentsFromDB(),
    Promise.all([getMatches(), getTeams()]).catch(() => [{ matches: [] }, { teams: [] }]),
  ]);

  tournaments = tournamentsData;

  if (Array.isArray(apiData)) {
    matches = (apiData[0] as { matches: Match[] }).matches || [];
    teams = (apiData[1] as { teams: Team[] }).teams || [];
  }

  const teamsMap: Record<number, { name: string; logo: string | null }> = {};
  teams.forEach((t) => { teamsMap[t.id] = { name: t.name, logo: t.logo }; });

  const liveMatches = matches.filter((m) => getStatusType(m) === "live");
  const recentMatches = matches
    .filter((m) => getStatusType(m) === "finished")
    .slice(0, 5);
  const upcomingMatches = matches
    .filter((m) => getStatusType(m) === "upcoming")
    .slice(0, 3);

  // Find active tournament (priority: active > pending > finished)
  const activeTournament = tournaments.find(t => t.status === "active")
    || tournaments.find(t => t.status === "pending")
    || tournaments[0]
    || null;

  return (
    <HomeContent
      tournament={activeTournament}
      liveMatches={liveMatches}
      recentMatches={recentMatches}
      upcomingMatches={upcomingMatches}
      totalMatches={matches.length}
      teamCount={teams.length}
      teamsMap={teamsMap}
    />
  );
}
