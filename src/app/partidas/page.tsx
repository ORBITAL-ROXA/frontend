import { getMatches, getTeams, Match, Team } from "@/lib/api";
import { PartidasContent } from "./partidas-content";

export const revalidate = 30;

export default async function PartidasPage() {
  let matches: Match[] = [];
  let teams: Team[] = [];

  try {
    const [matchesRes, teamsRes] = await Promise.all([
      getMatches(),
      getTeams().catch(() => ({ teams: [] })),
    ]);
    matches = matchesRes.matches || [];
    teams = teamsRes.teams || [];
  } catch {
    // API offline
  }

  const teamsMap: Record<number, { name: string; logo: string | null }> = {};
  teams.forEach((t) => { teamsMap[t.id] = { name: t.name, logo: t.logo }; });

  return <PartidasContent matches={matches} teamsMap={teamsMap} />;
}
