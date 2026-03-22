"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft,
  ExternalLink,
  Loader2,
  Crosshair,
  Trophy,
  Skull,
  Target,
  Zap,
  Eye,
  Shield,
  Swords,
  Clock,
  Users,
} from "lucide-react";
import { HudCard } from "@/components/hud-card";
import type { MappedMatch, MappedPlayerStats, MappedMapStats } from "@/lib/faceit-mapper";
import { estimateRating } from "@/lib/faceit-mapper";

export function FaceitMatchContent({ matchId }: { matchId: string }) {
  const [match, setMatch] = useState<MappedMatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeMap, setActiveMap] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/faceit/match/${matchId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Erro");
        setMatch(data.match);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao carregar partida");
      }
      setLoading(false);
    })();
  }, [matchId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-orbital-purple" />
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <Crosshair size={32} className="text-orbital-text-dim/20 mx-auto mb-3" />
          <p className="font-[family-name:var(--font-jetbrains)] text-sm text-orbital-text-dim">{error || "Partida não encontrada"}</p>
          <Link href="/partidas" className="inline-flex items-center gap-2 mt-4 text-orbital-purple text-xs font-[family-name:var(--font-jetbrains)] hover:underline">
            <ArrowLeft size={12} /> Voltar
          </Link>
        </div>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    live: "bg-red-500",
    finished: "bg-green-500",
    cancelled: "bg-orbital-text-dim/50",
    pending: "bg-yellow-500",
  };

  const statusLabels: Record<string, string> = {
    live: "AO VIVO",
    finished: "FINALIZADA",
    cancelled: "CANCELADA",
    pending: "PENDENTE",
  };

  const currentMap = match.maps[activeMap] || null;

  // Aggregate stats across all maps
  const aggregatePlayerStats = (): MappedPlayerStats[] => {
    const agg = new Map<string, MappedPlayerStats & { maps_played: number }>();
    for (const map of match.maps) {
      for (const p of map.player_stats) {
        const key = p.faceit_id || p.nickname;
        const prev = agg.get(key);
        if (!prev) {
          agg.set(key, { ...p, maps_played: 1 });
        } else {
          prev.kills += p.kills;
          prev.deaths += p.deaths;
          prev.assists += p.assists;
          prev.headshot_kills += p.headshot_kills;
          prev.damage += p.damage;
          prev.first_kills += p.first_kills;
          prev.clutch_kills += p.clutch_kills;
          prev.enemies_flashed += p.enemies_flashed;
          prev.utility_damage += p.utility_damage;
          prev.double_kills += p.double_kills;
          prev.triple_kills += p.triple_kills;
          prev.quadro_kills += p.quadro_kills;
          prev.penta_kills += p.penta_kills;
          prev.sniper_kills += p.sniper_kills;
          prev.mvps += p.mvps;
          prev.maps_played += 1;
        }
      }
    }
    return Array.from(agg.values());
  };

  const allStats = match.maps.length > 1 ? aggregatePlayerStats() : [];

  return (
    <div className="min-h-screen px-4 py-8 max-w-5xl mx-auto">
      {/* ═══ HEADER ═══ */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/partidas" className="text-orbital-text-dim hover:text-orbital-text transition-colors">
          <ArrowLeft size={16} />
        </Link>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${statusColors[match.status]}`} />
          <span className="font-[family-name:var(--font-orbitron)] text-[0.6rem] tracking-wider text-orbital-text-dim">
            {statusLabels[match.status]}
          </span>
        </div>
        <span className="font-[family-name:var(--font-orbitron)] text-[0.65rem] tracking-wider text-[#FF5500]/60">
          FACEIT
        </span>
        {match.faceit_url && (
          <a
            href={match.faceit_url}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto text-[#FF5500]/50 hover:text-[#FF5500] transition-colors flex items-center gap-1.5 font-[family-name:var(--font-jetbrains)] text-[0.6rem]"
          >
            Abrir na Faceit <ExternalLink size={10} />
          </a>
        )}
      </div>

      {/* ═══ SCOREBOARD HERO ═══ */}
      <HudCard>
        <div className="p-6 sm:p-8">
          <div className="flex items-center justify-center gap-6 sm:gap-10">
            {/* Team 1 */}
            <div className="text-right flex-1">
              <div className={`font-[family-name:var(--font-orbitron)] text-sm sm:text-lg tracking-wider ${match.winner === "team1" ? "text-green-400" : "text-orbital-text"}`}>
                {match.team1_name}
              </div>
              <div className="flex items-center justify-end gap-1.5 mt-1">
                {match.players.team1.map((p, i) => (
                  <span key={i} className="font-[family-name:var(--font-jetbrains)] text-[0.65rem] text-orbital-text-dim/50">
                    {p.nickname}
                  </span>
                ))}
              </div>
            </div>

            {/* Score */}
            <div className="text-center shrink-0">
              <div className="font-[family-name:var(--font-orbitron)] text-3xl sm:text-4xl tracking-wider">
                <span className={match.winner === "team1" ? "text-green-400" : "text-orbital-text"}>
                  {match.team1_score}
                </span>
                <span className="text-orbital-text-dim/50 mx-2">:</span>
                <span className={match.winner === "team2" ? "text-green-400" : "text-orbital-text"}>
                  {match.team2_score}
                </span>
              </div>
              <div className="font-[family-name:var(--font-jetbrains)] text-[0.65rem] text-orbital-text-dim/60 mt-1">
                BO{match.num_maps}
              </div>
            </div>

            {/* Team 2 */}
            <div className="text-left flex-1">
              <div className={`font-[family-name:var(--font-orbitron)] text-sm sm:text-lg tracking-wider ${match.winner === "team2" ? "text-green-400" : "text-orbital-text"}`}>
                {match.team2_name}
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                {match.players.team2.map((p, i) => (
                  <span key={i} className="font-[family-name:var(--font-jetbrains)] text-[0.65rem] text-orbital-text-dim/50">
                    {p.nickname}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Map scores bar */}
          {match.maps.length > 0 && (
            <div className="flex items-center justify-center gap-3 mt-5 pt-4 border-t border-orbital-border/30">
              {match.maps.map((m, i) => (
                <div key={i} className="text-center">
                  <div className="font-[family-name:var(--font-jetbrains)] text-[0.65rem] text-orbital-text-dim/50 mb-0.5">
                    {m.map_name.replace("de_", "")}
                  </div>
                  <div className="font-[family-name:var(--font-orbitron)] text-xs">
                    <span className={m.winner === "team1" ? "text-green-400" : "text-orbital-text-dim"}>
                      {m.team1_score}
                    </span>
                    <span className="text-orbital-text-dim/50">:</span>
                    <span className={m.winner === "team2" ? "text-green-400" : "text-orbital-text-dim"}>
                      {m.team2_score}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Date */}
          <div className="flex items-center justify-center gap-3 mt-3">
            <Clock size={10} className="text-orbital-text-dim/50" />
            <span className="font-[family-name:var(--font-jetbrains)] text-[0.65rem] text-orbital-text-dim/60">
              {match.start_time && new Date(match.start_time).toLocaleString("pt-BR", {
                day: "2-digit", month: "2-digit", year: "numeric",
                hour: "2-digit", minute: "2-digit",
              })}
            </span>
          </div>
        </div>
      </HudCard>

      {/* ═══ MAP TABS ═══ */}
      {match.maps.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center gap-0 border-b border-orbital-border/30 mb-4">
            {match.maps.length > 1 && (
              <button
                onClick={() => setActiveMap(-1)}
                className={`px-4 py-2 font-[family-name:var(--font-orbitron)] text-[0.65rem] tracking-wider transition-colors border-b-2 ${
                  activeMap === -1
                    ? "border-orbital-purple text-orbital-purple"
                    : "border-transparent text-orbital-text-dim hover:text-orbital-text"
                }`}
              >
                GERAL
              </button>
            )}
            {match.maps.map((m, i) => (
              <button
                key={i}
                onClick={() => setActiveMap(i)}
                className={`px-4 py-2 font-[family-name:var(--font-orbitron)] text-[0.65rem] tracking-wider transition-colors border-b-2 ${
                  activeMap === i
                    ? "border-orbital-purple text-orbital-purple"
                    : "border-transparent text-orbital-text-dim hover:text-orbital-text"
                }`}
              >
                {m.map_name.replace("de_", "").toUpperCase()}
                <span className="ml-1.5 text-[0.65rem] opacity-50">{m.team1_score}:{m.team2_score}</span>
              </button>
            ))}
          </div>

          {/* Stats Table */}
          <StatsTable
            stats={activeMap === -1 ? allStats : (currentMap?.player_stats || [])}
            team1Name={match.team1_name}
            team2Name={match.team2_name}
            players={match.players}
          />
        </div>
      )}

      {/* ═══ ROSTERS ═══ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
        {[
          { name: match.team1_name, players: match.players.team1, isWinner: match.winner === "team1" },
          { name: match.team2_name, players: match.players.team2, isWinner: match.winner === "team2" },
        ].map((team, ti) => (
          <HudCard key={ti}>
            <div className="p-4">
              <div className={`font-[family-name:var(--font-orbitron)] text-xs tracking-wider mb-3 flex items-center gap-2 ${team.isWinner ? "text-green-400" : "text-orbital-text"}`}>
                {team.isWinner && <Trophy size={12} />}
                {team.name}
              </div>
              <div className="space-y-2">
                {team.players.map((p, pi) => (
                  <div key={pi} className="flex items-center gap-3">
                    {p.avatar ? (
                      <img src={p.avatar} alt={p.nickname} className="w-7 h-7 rounded-full border border-orbital-border" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-orbital-card border border-orbital-border flex items-center justify-center">
                        <Users size={10} className="text-orbital-text-dim/50" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-[family-name:var(--font-jetbrains)] text-xs text-orbital-text truncate">
                        {p.nickname}
                      </div>
                      <div className="font-[family-name:var(--font-jetbrains)] text-[0.65rem] text-orbital-text-dim/60">
                        Level {p.skill_level}
                      </div>
                    </div>
                    {p.steam_id && (
                      <Link
                        href={`/perfil/${p.steam_id}`}
                        className="font-[family-name:var(--font-jetbrains)] text-[0.65rem] text-orbital-purple/50 hover:text-orbital-purple transition-colors"
                      >
                        Perfil
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </HudCard>
        ))}
      </div>
    </div>
  );
}

// ── Stats Table Component ──

function StatsTable({
  stats,
  team1Name,
  team2Name,
  players,
}: {
  stats: MappedPlayerStats[];
  team1Name: string;
  team2Name: string;
  players: MappedMatch["players"];
}) {
  const team1Ids = new Set(players.team1.map((p) => p.faceit_id));

  const team1Stats = stats.filter((p) => team1Ids.has(p.faceit_id)).sort((a, b) => b.kills - a.kills);
  const team2Stats = stats.filter((p) => !team1Ids.has(p.faceit_id)).sort((a, b) => b.kills - a.kills);

  const renderRow = (p: MappedPlayerStats, idx: number) => {
    const rating = estimateRating(p);
    return (
      <tr key={idx} className="border-b border-orbital-border/10 hover:bg-white/[0.01] transition-colors">
        <td className="py-2 pr-3">
          <Link
            href={p.steam_id ? `/perfil/${p.steam_id}` : "#"}
            className="font-[family-name:var(--font-jetbrains)] text-xs text-orbital-text hover:text-orbital-purple transition-colors"
          >
            {p.nickname}
          </Link>
        </td>
        <td className="text-center px-2 font-[family-name:var(--font-jetbrains)] text-xs text-green-400">{p.kills}</td>
        <td className="text-center px-2 font-[family-name:var(--font-jetbrains)] text-xs text-red-400/70">{p.deaths}</td>
        <td className="text-center px-2 font-[family-name:var(--font-jetbrains)] text-xs text-orbital-text-dim">{p.assists}</td>
        <td className={`text-center px-2 font-[family-name:var(--font-jetbrains)] text-xs ${p.adr >= 80 ? "text-orbital-purple" : "text-orbital-text-dim"}`}>
          {p.adr > 0 ? p.adr.toFixed(1) : "—"}
        </td>
        <td className={`text-center px-2 font-[family-name:var(--font-jetbrains)] text-xs ${rating >= 1.2 ? "text-green-400" : rating < 0.8 ? "text-red-400/70" : "text-orbital-text-dim"}`}>
          {rating.toFixed(2)}
        </td>
        <td className={`text-center px-2 font-[family-name:var(--font-jetbrains)] text-xs ${p.kdr >= 1.2 ? "text-green-400" : p.kdr < 0.8 ? "text-red-400/70" : "text-orbital-text-dim"}`}>
          {p.kdr.toFixed(2)}
        </td>
        <td className="text-center px-2 font-[family-name:var(--font-jetbrains)] text-xs text-orbital-text-dim">{p.headshot_pct}%</td>
        <td className="text-center px-2 font-[family-name:var(--font-jetbrains)] text-xs text-orbital-text-dim hidden sm:table-cell">{p.first_kills}</td>
        <td className="text-center px-2 font-[family-name:var(--font-jetbrains)] text-xs text-orbital-text-dim hidden sm:table-cell">{p.clutch_kills}</td>
        <td className="text-center px-2 font-[family-name:var(--font-jetbrains)] text-xs text-orbital-text-dim hidden md:table-cell">{p.enemies_flashed}</td>
        <td className="text-center px-2 font-[family-name:var(--font-jetbrains)] text-xs text-orbital-text-dim hidden md:table-cell">{p.utility_damage}</td>
        <td className="text-center px-2 font-[family-name:var(--font-jetbrains)] text-xs text-orbital-text-dim hidden md:table-cell">{p.damage}</td>
      </tr>
    );
  };

  const headerCells = (
    <tr className="text-[0.65rem] font-[family-name:var(--font-jetbrains)] text-orbital-text-dim/50 border-b border-orbital-border/30">
      <th className="text-left py-2 pr-3">Player</th>
      <th className="text-center px-2">K</th>
      <th className="text-center px-2">D</th>
      <th className="text-center px-2">A</th>
      <th className="text-center px-2">ADR</th>
      <th className="text-center px-2">Rating</th>
      <th className="text-center px-2">KDR</th>
      <th className="text-center px-2">HS%</th>
      <th className="text-center px-2 hidden sm:table-cell">Entry</th>
      <th className="text-center px-2 hidden sm:table-cell">Clutch</th>
      <th className="text-center px-2 hidden md:table-cell">Flash</th>
      <th className="text-center px-2 hidden md:table-cell">Util DMG</th>
      <th className="text-center px-2 hidden md:table-cell">DMG</th>
    </tr>
  );

  return (
    <div className="space-y-4">
      {/* Team 1 */}
      <HudCard>
        <div className="p-4">
          <div className="font-[family-name:var(--font-orbitron)] text-[0.65rem] tracking-wider text-orbital-text-dim mb-2">
            {team1Name}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>{headerCells}</thead>
              <tbody>{team1Stats.map(renderRow)}</tbody>
            </table>
          </div>
        </div>
      </HudCard>

      {/* Team 2 */}
      <HudCard>
        <div className="p-4">
          <div className="font-[family-name:var(--font-orbitron)] text-[0.65rem] tracking-wider text-orbital-text-dim mb-2">
            {team2Name}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>{headerCells}</thead>
              <tbody>{team2Stats.map(renderRow)}</tbody>
            </table>
          </div>
        </div>
      </HudCard>
    </div>
  );
}
