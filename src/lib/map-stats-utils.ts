// Calcula stats avançadas por mapa para jogadores e times
import type { PlayerStats, MapStats } from "./api";

export interface MapPerformance {
  map: string;
  maps_played: number;
  wins: number;
  losses: number;
  win_rate: number;
  avg_rating: number;
  avg_kills: number;
  avg_deaths: number;
  avg_adr: number;
  avg_hsp: number;
  total_kills: number;
  total_deaths: number;
}

// Calcula performance por mapa de um jogador
export function getPlayerMapPerformance(
  playerStats: PlayerStats[],
  mapStats: MapStats[],
  steamId: string
): MapPerformance[] {
  // Criar mapa de match_id+map_id → map_name
  const mapNameMap = new Map<string, string>();
  const mapWinnerMap = new Map<string, { team1_score: number; team2_score: number }>();
  for (const ms of mapStats) {
    const key = `${ms.match_id}_${ms.id}`;
    mapNameMap.set(key, ms.map_name);
    mapWinnerMap.set(key, { team1_score: ms.team1_score, team2_score: ms.team2_score });
  }

  // Agrupar stats do jogador por mapa
  const byMap = new Map<string, { stats: PlayerStats[]; wins: number; losses: number }>();

  for (const ps of playerStats) {
    if (ps.steam_id !== steamId) continue;

    // Encontrar nome do mapa
    let mapName = "unknown";
    for (const ms of mapStats) {
      if (ms.match_id === ps.match_id && ms.id === ps.map_id) {
        mapName = ms.map_name;
        break;
      }
    }

    const existing = byMap.get(mapName) || { stats: [], wins: 0, losses: 0 };
    existing.stats.push(ps);

    // Determinar se ganhou este mapa (winner = team_id do vencedor)
    for (const ms of mapStats) {
      if (ms.match_id === ps.match_id && ms.id === ps.map_id) {
        if (ms.winner === ps.team_id) {
          existing.wins++;
        } else if (ms.winner > 0) {
          existing.losses++;
        }
        break;
      }
    }

    byMap.set(mapName, existing);
  }

  // Calcular métricas
  const result: MapPerformance[] = [];
  for (const [map, data] of byMap) {
    const totalKills = data.stats.reduce((s, p) => s + p.kills, 0);
    const totalDeaths = data.stats.reduce((s, p) => s + p.deaths, 0);
    const totalRounds = data.stats.reduce((s, p) => s + p.roundsplayed, 0);
    const totalDamage = data.stats.reduce((s, p) => s + p.damage, 0);
    const totalHS = data.stats.reduce((s, p) => s + p.headshot_kills, 0);
    const totalRating = data.stats.reduce((s, p) => s + (p.rating || 0), 0);
    const n = data.stats.length;

    result.push({
      map,
      maps_played: n,
      wins: data.wins,
      losses: data.losses,
      win_rate: n > 0 ? Math.round((data.wins / n) * 100) : 0,
      avg_rating: n > 0 ? parseFloat((totalRating / n).toFixed(2)) : 0,
      avg_kills: n > 0 ? parseFloat((totalKills / n).toFixed(1)) : 0,
      avg_deaths: n > 0 ? parseFloat((totalDeaths / n).toFixed(1)) : 0,
      avg_adr: totalRounds > 0 ? parseFloat((totalDamage / totalRounds).toFixed(1)) : 0,
      avg_hsp: totalKills > 0 ? Math.round((totalHS / totalKills) * 100) : 0,
      total_kills: totalKills,
      total_deaths: totalDeaths,
    });
  }

  return result.sort((a, b) => b.maps_played - a.maps_played);
}

// Calcula performance por mapa de um time
export function getTeamMapPerformance(
  mapStats: MapStats[],
  teamId: number
): MapPerformance[] {
  const byMap = new Map<string, { wins: number; losses: number; maps: number }>();

  for (const ms of mapStats) {
    const mapName = ms.map_name;
    const existing = byMap.get(mapName) || { wins: 0, losses: 0, maps: 0 };
    existing.maps++;

    if (ms.winner === teamId) {
      existing.wins++;
    } else if (ms.winner > 0) {
      existing.losses++;
    }

    byMap.set(mapName, existing);
  }

  const result: MapPerformance[] = [];
  for (const [map, data] of byMap) {
    result.push({
      map,
      maps_played: data.maps,
      wins: data.wins,
      losses: data.losses,
      win_rate: data.maps > 0 ? Math.round((data.wins / data.maps) * 100) : 0,
      avg_rating: 0,
      avg_kills: 0,
      avg_deaths: 0,
      avg_adr: 0,
      avg_hsp: 0,
      total_kills: 0,
      total_deaths: 0,
    });
  }

  return result.sort((a, b) => b.maps_played - a.maps_played);
}
