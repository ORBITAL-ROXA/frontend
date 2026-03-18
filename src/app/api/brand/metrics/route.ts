import { NextRequest, NextResponse } from "next/server";
import { checkAdmin } from "../auth";

const G5API_URL =
  process.env.G5API_URL ||
  process.env.NEXT_PUBLIC_G5API_URL ||
  "https://g5api-production-998f.up.railway.app";

export async function GET(req: NextRequest) {
  const authError = await checkAdmin(req);
  if (authError) return authError;

  try {
    const cookie = req.cookies.get("G5API")?.value;
    const headers: Record<string, string> = {};
    if (cookie) headers["Cookie"] = `G5API=${cookie}`;

    let totalMatches = 0;
    let totalPlayers = 0;
    let totalTeams = 0;

    // Fetch matches count
    try {
      const matchRes = await fetch(`${G5API_URL}/matches?limit=1`, { headers });
      if (matchRes.ok) {
        const matchData = await matchRes.json();
        totalMatches = matchData.totalCount || (Array.isArray(matchData.matches) ? matchData.matches.length : 0);
      }
    } catch { /* ignore */ }

    // Fetch players from leaderboard
    try {
      const playerRes = await fetch(`${G5API_URL}/leaderboard/players`, { headers });
      if (playerRes.ok) {
        const playerData = await playerRes.json();
        totalPlayers = Array.isArray(playerData) ? playerData.length : 0;
      }
    } catch { /* ignore */ }

    // Fetch teams
    try {
      const teamRes = await fetch(`${G5API_URL}/teams`, { headers });
      if (teamRes.ok) {
        const teamData = await teamRes.json();
        totalTeams = Array.isArray(teamData.teams) ? teamData.teams.length : (Array.isArray(teamData) ? teamData.length : 0);
      }
    } catch { /* ignore */ }

    return NextResponse.json({
      totalMatches,
      totalPlayers,
      totalTeams,
    });
  } catch (err) {
    console.error("[BRAND METRICS]", err);
    return NextResponse.json({ totalMatches: 0, totalPlayers: 0, totalTeams: 0 });
  }
}
