import { getLeaderboard, getSeasons } from "@/lib/api";
import { LeaderboardContent } from "./leaderboard-content";

export default async function LeaderboardPage() {
  const [leaderboardData, seasonsData] = await Promise.all([
    getLeaderboard().catch(() => ({ leaderboard: [] })),
    getSeasons().catch(() => ({ seasons: [] })),
  ]);

  return (
    <LeaderboardContent
      initialLeaderboard={leaderboardData.leaderboard}
      initialSeasons={seasonsData.seasons}
    />
  );
}
