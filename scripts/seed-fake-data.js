/**
 * Script para inserir dados fake no banco G5API
 * para testar as features do ORBITAL ROXA.
 *
 * Uso: node scripts/seed-fake-data.js
 */

const mysql = require('mysql2/promise');

const DB_URL = process.env.DATABASE_URL;

// Times existentes: 1 = ORBITAL ROXA, 2 = FIRE GAMES
// Jogadores existentes em team_auth_names:
// Team 1 (ORBITAL): vcmJESUS, orb_Panda, orb_Shadow, orb_Viper, orb_Phoenix
// Team 2 (FIRE): ferreira, fg_Blaze, fg_Storm, fg_Frost, fg_Nova

const TEAM1_PLAYERS = [
  { steam_id: '76561198023055702', name: 'vcmJESUS', team_id: 1 },
  { steam_id: '76561198045678901', name: 'orb_Panda', team_id: 1 },
  { steam_id: '76561198056789012', name: 'orb_Shadow', team_id: 1 },
  { steam_id: '76561198067890123', name: 'orb_Viper', team_id: 1 },
  { steam_id: '76561198078901234', name: 'orb_Phoenix', team_id: 1 },
];

const TEAM2_PLAYERS = [
  { steam_id: '76561199175469752', name: 'ferreira', team_id: 2 },
  { steam_id: '76561198089012345', name: 'fg_Blaze', team_id: 2 },
  { steam_id: '76561198090123456', name: 'fg_Storm', team_id: 2 },
  { steam_id: '76561198001234567', name: 'fg_Frost', team_id: 2 },
  { steam_id: '76561198012345678', name: 'fg_Nova', team_id: 2 },
];

const MAPS = ['de_mirage', 'de_inferno', 'de_dust2', 'de_nuke', 'de_ancient', 'de_anubis', 'de_vertigo'];

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generatePlayerStats(player, matchId, mapId, roundsPlayed, isWinner) {
  const kills = rand(8, 32);
  const deaths = rand(6, 25);
  const hsKills = rand(Math.floor(kills * 0.2), Math.floor(kills * 0.7));
  const assists = rand(1, 10);
  const damage = rand(kills * 60, kills * 120);

  return {
    match_id: matchId,
    map_id: mapId,
    team_id: player.team_id,
    steam_id: player.steam_id,
    name: player.name,
    kills,
    headshot_kills: hsKills,
    deaths,
    assists,
    flashbang_assists: rand(0, 4),
    roundsplayed: roundsPlayed,
    teamkills: rand(0, 1),
    knife_kills: rand(0, 2),
    suicides: 0,
    damage,
    util_damage: rand(0, 150),
    enemies_flashed: rand(0, 8),
    friendlies_flashed: rand(0, 3),
    bomb_plants: rand(0, 5),
    bomb_defuses: rand(0, 3),
    v1: rand(0, 3),
    v2: rand(0, 2),
    v3: rand(0, 1),
    v4: 0,
    v5: 0,
    k1: rand(2, 10),
    k2: rand(1, 6),
    k3: rand(0, 3),
    k4: rand(0, 1),
    k5: 0,
    firstdeath_ct: rand(0, 3),
    firstdeath_t: rand(0, 3),
    firstkill_ct: rand(0, 4),
    firstkill_t: rand(0, 4),
    kast: rand(50, 90),
    contribution_score: rand(20, 80),
    winner: isWinner ? 1 : 0,
    mvp: isWinner ? rand(0, 5) : rand(0, 2),
  };
}

async function main() {
  const conn = await mysql.createConnection(DB_URL);
  console.log('Conectado ao banco de dados.');

  // 1. Criar season
  console.log('\n--- Criando season ---');
  const [seasonResult] = await conn.query(
    `INSERT INTO season (user_id, name, start_date, end_date) VALUES (1, 'Season 1 - 2026', '2026-01-01', '2026-06-30')`
  );
  const seasonId = seasonResult.insertId;
  console.log(`Season criada: id=${seasonId}`);

  // 2. Criar 6 partidas finalizadas (3 vitórias de cada time)
  const matchConfigs = [
    { map: 'de_mirage', t1Score: 13, t2Score: 9, winner: 1, daysAgo: 30 },
    { map: 'de_inferno', t1Score: 8, t2Score: 13, winner: 2, daysAgo: 25 },
    { map: 'de_dust2', t1Score: 13, t2Score: 11, winner: 1, daysAgo: 20 },
    { map: 'de_nuke', t1Score: 10, t2Score: 13, winner: 2, daysAgo: 15 },
    { map: 'de_ancient', t1Score: 13, t2Score: 7, winner: 1, daysAgo: 10 },
    { map: 'de_anubis', t1Score: 11, t2Score: 13, winner: 2, daysAgo: 5 },
  ];

  const matchIds = [];

  for (const cfg of matchConfigs) {
    const startTime = new Date();
    startTime.setDate(startTime.getDate() - cfg.daysAgo);
    const endTime = new Date(startTime.getTime() + 45 * 60 * 1000); // +45min

    console.log(`\n--- Criando partida: ${cfg.map} (${cfg.t1Score}-${cfg.t2Score}) ---`);

    const [matchResult] = await conn.query(
      `INSERT INTO \`match\` (user_id, team1_id, team2_id, winner, team1_score, team2_score,
        start_time, end_time, max_maps, title, skip_veto, api_key, veto_mappool,
        side_type, cancelled, forfeit, season_id, is_pug, plugin_version, veto_first)
       VALUES (1, 1, 2, ?, ?, ?, ?, ?, 1, 'Map 1 of 1', 0, ?, ?, 'standard', 0, 0, ?, 0, 'MatchZy', 'team1')`,
      [
        cfg.winner,
        cfg.winner === 1 ? cfg.t1Score : cfg.t2Score, // series score (BO1 = winner score)
        cfg.winner === 1 ? cfg.t2Score : cfg.t1Score,
        startTime,
        endTime,
        `seed_key_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        MAPS.join(' '),
        seasonId,
      ]
    );
    const matchId = matchResult.insertId;
    matchIds.push(matchId);
    console.log(`Match criada: id=${matchId}`);

    // Fix: team1_score and team2_score in match table should be series scores for BO1
    await conn.query(
      `UPDATE \`match\` SET team1_score = ?, team2_score = ? WHERE id = ?`,
      [cfg.winner === 1 ? 1 : 0, cfg.winner === 2 ? 1 : 0, matchId]
    );

    // 3. Criar map_stats
    const demoFile = `match_${matchId}_map_0_${cfg.map}.dem`;
    const [mapResult] = await conn.query(
      `INSERT INTO map_stats (match_id, winner, map_number, map_name, team1_score, team2_score, start_time, end_time, demoFile)
       VALUES (?, ?, 0, ?, ?, ?, ?, ?, ?)`,
      [matchId, cfg.winner, cfg.map, cfg.t1Score, cfg.t2Score, startTime, endTime, demoFile]
    );
    const mapId = mapResult.insertId;
    console.log(`MapStats criada: id=${mapId}, map=${cfg.map}`);

    // 4. Criar player_stats para cada jogador
    const totalRounds = cfg.t1Score + cfg.t2Score;
    const allPlayers = [...TEAM1_PLAYERS, ...TEAM2_PLAYERS];

    for (const player of allPlayers) {
      const isWinnerTeam = (cfg.winner === 1 && player.team_id === 1) || (cfg.winner === 2 && player.team_id === 2);
      const stats = generatePlayerStats(player, matchId, mapId, totalRounds, isWinnerTeam);

      await conn.query(
        `INSERT INTO player_stats (match_id, map_id, team_id, steam_id, name,
          kills, headshot_kills, deaths, assists, flashbang_assists,
          roundsplayed, teamkills, knife_kills, suicides, damage, util_damage,
          enemies_flashed, friendlies_flashed, bomb_plants, bomb_defuses,
          v1, v2, v3, v4, v5, k1, k2, k3, k4, k5,
          firstdeath_ct, firstdeath_t, firstkill_ct, firstkill_t,
          kast, contribution_score, winner, mvp)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          stats.match_id, stats.map_id, stats.team_id, stats.steam_id, stats.name,
          stats.kills, stats.headshot_kills, stats.deaths, stats.assists, stats.flashbang_assists,
          stats.roundsplayed, stats.teamkills, stats.knife_kills, stats.suicides, stats.damage, stats.util_damage,
          stats.enemies_flashed, stats.friendlies_flashed, stats.bomb_plants, stats.bomb_defuses,
          stats.v1, stats.v2, stats.v3, stats.v4, stats.v5,
          stats.k1, stats.k2, stats.k3, stats.k4, stats.k5,
          stats.firstdeath_ct, stats.firstdeath_t, stats.firstkill_ct, stats.firstkill_t,
          stats.kast, stats.contribution_score, stats.winner, stats.mvp,
        ]
      );
    }
    console.log(`PlayerStats criados: ${allPlayers.length} jogadores`);

    // 5. Criar vetoes para cada partida
    const vetoMaps = [...MAPS];
    // Shuffle
    for (let i = vetoMaps.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [vetoMaps[i], vetoMaps[j]] = [vetoMaps[j], vetoMaps[i]];
    }

    const vetoSequence = [];
    const teamNames = ['ORBITAL ROXA', 'FIRE GAMES'];
    // Remove the played map from ban pool
    const banPool = vetoMaps.filter(m => m !== cfg.map);
    // BO1: each team bans 3 maps, remaining = pick
    for (let v = 0; v < 6 && v < banPool.length; v++) {
      vetoSequence.push({ team: teamNames[v % 2], map: banPool[v], type: 'ban' });
    }
    // The played map is the pick
    vetoSequence.push({ team: teamNames[0], map: cfg.map, type: 'pick' });

    for (const v of vetoSequence) {
      await conn.query(
        `INSERT INTO veto (match_id, team_name, map, pick_or_veto) VALUES (?, ?, ?, ?)`,
        [matchId, v.team, v.map, v.type]
      );
    }
    console.log(`Vetoes criados: ${vetoSequence.length} vetoes`);
  }

  // Resumo final
  console.log('\n========================================');
  console.log('SEED COMPLETO!');
  console.log(`Season: ${seasonId}`);
  console.log(`Partidas criadas: ${matchIds.length} (IDs: ${matchIds.join(', ')})`);
  console.log(`MapStats: ${matchIds.length}`);
  console.log(`PlayerStats: ${matchIds.length * 10} (10 jogadores x ${matchIds.length} partidas)`);
  console.log(`Vetoes: inseridos para cada partida`);
  console.log('========================================');
  console.log('\nAgora abra o ORBITAL ROXA e verifique:');
  console.log('- /leaderboard → ranking com todos os jogadores');
  console.log('- /leaderboard (filtro Season 1) → mesmo ranking filtrado');
  console.log('- /perfil/76561198023055702 → performance por mapa de vcmJESUS');
  console.log('- /partidas → lista de partidas finalizadas');
  console.log('- /partidas/[id] → detalhes + veto history');
  console.log('- /demos → lista de demos disponíveis');

  await conn.end();
}

main().catch(e => {
  console.error('ERRO:', e);
  process.exit(1);
});
