import { getMatches, getTeams, Match, Team, getStatusType } from "@/lib/api";
import { Tournament } from "@/lib/tournament";
import { HomeContent } from "./home-content";

export const revalidate = 30;

async function getTournaments(): Promise<Tournament[]> {
  try {
    // In Vercel, use VERCEL_URL; locally, use localhost
    const host = process.env.VERCEL_URL || "localhost:3001";
    const protocol = process.env.VERCEL_URL ? "https" : "http";
    const res = await fetch(`${protocol}://${host}/api/tournaments`, { next: { revalidate: 30 } });
    const data = await res.json();
    return data.tournaments || [];
  } catch (e) {
    console.error("[HOME] Failed to fetch tournaments:", e);
    return [];
  }
}

export default async function HomePage() {
  let matches: Match[] = [];
  let teams: Team[] = [];

  const [tournamentsData, apiData] = await Promise.all([
    getTournaments(),
    Promise.all([getMatches(), getTeams()]).catch(() => [{ matches: [] }, { teams: [] }]),
  ]);

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
  const activeTournament = tournamentsData.find(t => t.status === "active")
    || tournamentsData.find(t => t.status === "pending")
    || tournamentsData[0]
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
