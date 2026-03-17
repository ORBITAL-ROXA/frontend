// ═══ Mapeia dados Faceit → formato G5API/ORBITAL ROXA ═══

import type {
  FaceitMatch,
  FaceitMatchStats,
  FaceitPlayerStats,
  FaceitRoundStats,
} from "./faceit";

// ── Faceit match → dados para salvar no ORBITAL ROXA ──

export interface MappedMatch {
  faceit_match_id: string;
  team1_name: string;
  team2_name: string;
  team1_score: number;
  team2_score: number;
  winner: "team1" | "team2" | null;
  status: "pending" | "live" | "finished" | "cancelled";
  num_maps: number;
  start_time: string | null;
  end_time: string | null;
  faceit_url: string;
  demo_urls: string[];
  maps: MappedMapStats[];
  players: {
    team1: MappedPlayer[];
    team2: MappedPlayer[];
  };
}

export interface MappedMapStats {
  map_number: number;
  map_name: string;
  team1_score: number;
  team2_score: number;
  winner: "team1" | "team2" | null;
  player_stats: MappedPlayerStats[];
}

export interface MappedPlayer {
  faceit_id: string;
  steam_id: string; // game_player_id = Steam64
  nickname: string;
  avatar: string;
  skill_level: number;
}

export interface MappedPlayerStats {
  faceit_id: string;
  steam_id: string;
  nickname: string;
  // Core
  kills: number;
  deaths: number;
  assists: number;
  headshot_kills: number;
  headshot_pct: number;
  mvps: number;
  kdr: number;
  krr: number;
  won: boolean;
  // Damage
  damage: number;
  adr: number;
  // Multi-kills
  double_kills: number;
  triple_kills: number;
  quadro_kills: number;
  penta_kills: number;
  // Entry
  first_kills: number;
  entry_count: number;
  entry_wins: number;
  // Clutch
  clutch_kills: number;
  v1_count: number;
  v1_wins: number;
  v2_count: number;
  v2_wins: number;
  // Utility
  flash_count: number;
  flash_successes: number;
  enemies_flashed: number;
  utility_count: number;
  utility_damage: number;
  utility_enemies: number;
  // Weapon
  sniper_kills: number;
  pistol_kills: number;
  knife_kills: number;
}

// ── Mapper functions ──

export function mapFaceitStatus(status: string): MappedMatch["status"] {
  switch (status) {
    case "FINISHED":
      return "finished";
    case "ONGOING":
    case "READY":
    case "CONFIGURING":
    case "CAPTAIN_PICK":
    case "VOTING":
      return "live";
    case "CANCELLED":
    case "ABORTED":
      return "cancelled";
    default:
      return "pending";
  }
}

export function mapFaceitMatch(match: FaceitMatch, stats?: FaceitMatchStats): MappedMatch {
  const faction1 = match.teams.faction1;
  const faction2 = match.teams.faction2;

  const team1Score = match.results?.score?.faction1 ?? 0;
  const team2Score = match.results?.score?.faction2 ?? 0;

  let winner: MappedMatch["winner"] = null;
  if (match.results?.winner === "faction1") winner = "team1";
  else if (match.results?.winner === "faction2") winner = "team2";

  const maps: MappedMapStats[] = [];
  if (stats?.rounds) {
    stats.rounds.forEach((round, idx) => {
      maps.push(mapFaceitRound(round, idx, faction1.faction_id, faction2.faction_id));
    });
  }

  return {
    faceit_match_id: match.match_id,
    team1_name: faction1.name,
    team2_name: faction2.name,
    team1_score: team1Score,
    team2_score: team2Score,
    winner,
    status: mapFaceitStatus(match.status),
    num_maps: match.best_of,
    start_time: match.started_at ? new Date(match.started_at * 1000).toISOString() : null,
    end_time: match.finished_at ? new Date(match.finished_at * 1000).toISOString() : null,
    faceit_url: match.faceit_url?.replace("{lang}", "pt") || "",
    demo_urls: match.demo_url || [],
    maps,
    players: {
      team1: faction1.roster.map((p) => ({
        faceit_id: p.player_id,
        steam_id: p.game_player_id,
        nickname: p.nickname,
        avatar: p.avatar,
        skill_level: p.game_skill_level,
      })),
      team2: faction2.roster.map((p) => ({
        faceit_id: p.player_id,
        steam_id: p.game_player_id,
        nickname: p.nickname,
        avatar: p.avatar,
        skill_level: p.game_skill_level,
      })),
    },
  };
}

function mapFaceitRound(
  round: FaceitRoundStats,
  index: number,
  faction1Id: string,
  faction2Id: string
): MappedMapStats {
  const scoreParts = round.round_stats.Score?.split(" / ").map(Number) || [0, 0];
  const team1 = round.teams.find((t) => t.team_id === faction1Id);
  const team2 = round.teams.find((t) => t.team_id === faction2Id);

  const t1Score = team1 ? parseInt(team1.team_stats["Final Score"] || "0") : scoreParts[0];
  const t2Score = team2 ? parseInt(team2.team_stats["Final Score"] || "0") : scoreParts[1];

  let winner: MappedMapStats["winner"] = null;
  if (round.round_stats.Winner === faction1Id) winner = "team1";
  else if (round.round_stats.Winner === faction2Id) winner = "team2";

  const playerStats: MappedPlayerStats[] = [];
  if (team1) {
    playerStats.push(...team1.players.map((p) => mapPlayerStats(p)));
  }
  if (team2) {
    playerStats.push(...team2.players.map((p) => mapPlayerStats(p)));
  }

  return {
    map_number: index + 1,
    map_name: round.round_stats.Map || "unknown",
    team1_score: t1Score,
    team2_score: t2Score,
    winner,
    player_stats: playerStats,
  };
}

function mapPlayerStats(p: FaceitPlayerStats): MappedPlayerStats {
  const s = p.player_stats;
  const int = (k: string) => parseInt(s[k] || "0");
  const float = (k: string) => parseFloat(s[k] || "0");

  return {
    faceit_id: p.player_id,
    steam_id: "", // Preenchido depois via roster
    nickname: p.nickname,
    // Core
    kills: int("Kills"),
    deaths: int("Deaths"),
    assists: int("Assists"),
    headshot_kills: int("Headshots"),
    headshot_pct: float("Headshots %"),
    mvps: int("MVPs"),
    kdr: float("K/D Ratio"),
    krr: float("K/R Ratio"),
    won: s.Result === "1",
    // Damage
    damage: int("Damage"),
    adr: float("ADR"),
    // Multi-kills
    double_kills: int("Double Kills"),
    triple_kills: int("Triple Kills"),
    quadro_kills: int("Quadro Kills"),
    penta_kills: int("Penta Kills"),
    // Entry
    first_kills: int("First Kills"),
    entry_count: int("Entry Count"),
    entry_wins: int("Entry Wins"),
    // Clutch
    clutch_kills: int("Clutch Kills"),
    v1_count: int("1v1Count"),
    v1_wins: int("1v1Wins"),
    v2_count: int("1v2Count"),
    v2_wins: int("1v2Wins"),
    // Utility
    flash_count: int("Flash Count"),
    flash_successes: int("Flash Successes"),
    enemies_flashed: int("Enemies Flashed"),
    utility_count: int("Utility Count"),
    utility_damage: int("Utility Damage"),
    utility_enemies: int("Utility Enemies"),
    // Weapon
    sniper_kills: int("Sniper Kills"),
    pistol_kills: int("Pistol Kills"),
    knife_kills: int("Knife Kills"),
  };
}

// ── Enriquecer stats com steam_id do roster ──

export function enrichStatsWithSteamIds(mapped: MappedMatch): MappedMatch {
  const steamIdMap = new Map<string, string>();

  for (const p of [...mapped.players.team1, ...mapped.players.team2]) {
    steamIdMap.set(p.faceit_id, p.steam_id);
  }

  for (const map of mapped.maps) {
    for (const ps of map.player_stats) {
      ps.steam_id = steamIdMap.get(ps.faceit_id) || "";
    }
  }

  return mapped;
}

// ── Calcular rating HLTV 1.0 simplificado ──
// HLTV Rating = (KPR * 0.679 + SPR * 0.317 + RMK * 1.277 - DPR * 0.336 + 0.0073)
// Simplificado: usamos KDR e KRR como aproximação

export function estimateRating(stats: MappedPlayerStats, roundsPlayed = 24): number {
  const kpr = stats.kills / Math.max(roundsPlayed, 1);
  const dpr = stats.deaths / Math.max(roundsPlayed, 1);
  const spr = (roundsPlayed - stats.deaths) / Math.max(roundsPlayed, 1); // survived
  const rmk = (stats.triple_kills + stats.quadro_kills * 2 + stats.penta_kills * 3) / Math.max(roundsPlayed, 1);

  const rating = kpr * 0.679 + spr * 0.317 + rmk * 1.277 - dpr * 0.336 + 0.0073;
  return Math.round(rating * 100) / 100;
}
