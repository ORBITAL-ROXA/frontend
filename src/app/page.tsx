import { getMatches, getTeams, Match, Team, getStatusType } from "@/lib/api";
import { HomeContent } from "./home-content";

export const revalidate = 30;

export default async function HomePage() {
  let matches: Match[] = [];
  let teams: Team[] = [];

  try {
    const [matchesRes, teamsRes] = await Promise.all([
      getMatches(),
      getTeams(),
    ]);
    matches = matchesRes.matches || [];
    teams = teamsRes.teams || [];
  } catch {
    // API pode estar offline
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

  return (
    <HomeContent
      liveMatches={liveMatches}
      recentMatches={recentMatches}
      upcomingMatches={upcomingMatches}
      totalMatches={matches.length}
      teamCount={teams.length}
      teamsMap={teamsMap}
    />
  );
}
