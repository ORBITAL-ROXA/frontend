"use client";

import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Download, Copy, Check, Save, ChevronDown } from "lucide-react";
import html2canvas from "html2canvas";

// ═══ TYPES ═══
type TemplateId = "campea" | "top5" | "resultado" | "highlight" | "perfil" | "teaser";

interface CampeaData { championTeam: string; roster: string; tournamentName: string; }
interface Top5Player { nick: string; team: string; kills: number; hs: string; rating: string; }
interface Top5Data { players: Top5Player[]; tournamentName: string; }
interface ResultadoMap { name: string; score1: number; score2: number; }
interface ResultadoData { team1Name: string; team2Name: string; score1: number; score2: number; maps: ResultadoMap[]; stage: string; date: string; format: string; }
interface HighlightData { playerNick: string; playType: string; score: number; description: string; kills: number; hs: number; weapon: string; special: string; matchInfo: string; round: number; tournamentName: string; }
interface PerfilData { nick: string; team: string; rankPosition: number; rating: string; kills: number; deaths: number; kd: string; hs: string; adr: number; wins: number; }
interface TeaserData { cupNumber: number; subtitle: string; teaserText: string; }

const TEMPLATES: { id: TemplateId; label: string; desc: string }[] = [
  { id: "campea", label: "Campeão", desc: "Card do time campeão" },
  { id: "top5", label: "Top 5 Stats", desc: "Ranking dos 5 melhores" },
  { id: "resultado", label: "Resultado", desc: "Score de uma partida" },
  { id: "highlight", label: "Highlight", desc: "Play of the Tournament" },
  { id: "perfil", label: "Player Spotlight", desc: "Perfil de jogador" },
  { id: "teaser", label: "Teaser Cup", desc: "Anúncio do próximo cup" },
];

// ═══ DEFAULT DATA ═══
const defaultCampea: CampeaData = { championTeam: "CHOPPADAS", roster: "iguizik- • hoppe • leoking_ • sabiahzera • linz1k", tournamentName: "ORBITAL ROXA CUP #1" };
const defaultTop5: Top5Data = {
  players: [
    { nick: "leoking_", team: "CHOPPADAS", kills: 153, hs: "54%", rating: "1.39" },
    { nick: "linz1k", team: "CHOPPADAS", kills: 136, hs: "44%", rating: "1.22" },
    { nick: "duum", team: "F05-N35", kills: 53, hs: "49%", rating: "1.19" },
    { nick: "pdX", team: "NOTAG", kills: 88, hs: "61%", rating: "1.15" },
    { nick: "nastyy", team: "016", kills: 73, hs: "37%", rating: "1.14" },
  ],
  tournamentName: "ORBITAL ROXA CUP #1",
};
const defaultResultado: ResultadoData = { team1Name: "DoKuRosa", team2Name: "CHOPPADAS", score1: 0, score2: 2, maps: [{ name: "Mirage", score1: 10, score2: 13 }, { name: "Inferno", score1: 11, score2: 13 }], stage: "GRAND FINAL", date: "15 MAR 2026", format: "BO3" };
const defaultHighlight: HighlightData = { playerNick: "Lcszik444-", playType: "ACE — 5 Kills", score: 243, description: "Fechou o round 20 com um ACE impossível", kills: 5, hs: 4, weapon: "AK-47", special: "Wallbang", matchInfo: "MIDWEST vs NOTAG — Dust2", round: 20, tournamentName: "ORBITAL ROXA CUP #1" };
const defaultPerfil: PerfilData = { nick: "leoking_", team: "CHOPPADAS", rankPosition: 1, rating: "1.39", kills: 153, deaths: 84, kd: "1.82", hs: "54%", adr: 104, wins: 6 };
const defaultTeaser: TeaserData = { cupNumber: 2, subtitle: "Ribeirão Preto · 2026", teaserText: "Em breve" };

const CAPTIONS: Record<TemplateId, string> = {
  campea: "🏆 ORBITAL ROXA CUP #1 — CAMPEÃO\n\nCHOPPADAS dominou o campeonato do começo ao fim e levou o título do nosso primeiro evento. 8 times, 40 players, uma noite inteira de CS2 puro.\n\nParabéns @iguizik @hoppe @leoking_ @sabiahzera @linz1k 💜\n\n📊 Stats completas em orbitalroxa.com.br\n🎬 Highlights disponíveis na plataforma\n\n#orbitalroxa #cs2 #cs2brasil #counterstrike2 #ribeiraopreto #esportsbrasil #campeonatocs2 #choppadas",
  top5: "📊 TOP 5 — ORBITAL ROXA CUP #1\n\nRating, kills e HS% dos melhores jogadores do campeonato.\n\n🥇 leoking_ — 1.39 rating | 153K | 54% HS\n🥈 linz1k — 1.22 rating | 136K | 44% HS\n🥉 duum — 1.19 rating | 53K | 49% HS\n4️⃣ pdX — 1.15 rating | 88K | 61% HS\n5️⃣ nastyy — 1.14 rating | 73K | 37% HS\n\nRanking completo em 👉 orbitalroxa.com.br\n\n#orbitalroxa #cs2brasil #cs2stats #counterstrike2 #ranking",
  resultado: "⚔️ GRAND FINAL | ORBITAL ROXA CUP #1\n\nCHOPPADAS 2 × 0 DoKuRosa\n\nMirage 13:10 | Inferno 13:11\n\nUma final que não precisou de 3 mapas — CHOPPADAS fechou com autoridade. 🔥\n\nStats detalhadas em orbitalroxa.com.br\n\n#orbitalroxa #cs2 #grandfinal #campeonatocs2 #cs2brasil",
  highlight: "🎯 PLAY OF THE TOURNAMENT | ORBITAL ROXA CUP #1\n\nLcszik444- fechou o round 20 com um ACE impossível — 5 kills, 4 headshots, 1 wallbang com AK-47.\n\nScore de highlight: 243 pontos 🔥\n\nMIDWEST vs NOTAG | Dust2 | Round 20\n\nTodos os highlights em orbitalroxa.com.br 👆\n\n#orbitalroxa #cs2highlights #ace #cs2 #highlight #wallbang",
  perfil: "👤 PLAYER SPOTLIGHT | ORBITAL ROXA CUP #1\n\nleoking_ 💜\n\n📊 Rating: 1.39\n💀 153 kills | 84 deaths | K/D 1.82\n🎯 54% headshot rate\n⚡ 104 ADR | 6 vitórias\n\nPerfil completo em orbitalroxa.com.br 👆\n\n#orbitalroxa #cs2 #playerspotlight #cs2brasil #cs2stats",
  teaser: "🟣 Ele vem aí.\n\nORBITAL ROXA CUP #2 — em breve.\n\nQuem tá dentro? 👇\n\n#orbitalroxa #cs2 #campeonato #ribeiraopreto #cs2brasil #orbitalroxacup",
};

export default function CardsPage() {
  const [template, setTemplate] = useState<TemplateId>("campea");
  const [campea, setCampea] = useState(defaultCampea);
  const [top5, setTop5] = useState(defaultTop5);
  const [resultado, setResultado] = useState(defaultResultado);
  const [highlight, setHighlight] = useState(defaultHighlight);
  const [perfil, setPerfil] = useState(defaultPerfil);
  const [teaser, setTeaser] = useState(defaultTeaser);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const downloadPNG = useCallback(async () => {
    if (!cardRef.current) return;
    const canvas = await html2canvas(cardRef.current, { scale: 2, backgroundColor: "#0A0A0A", useCORS: true });
    const link = document.createElement("a");
    link.download = `orbital-${template}-${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }, [template]);

  const copyCaption = () => {
    navigator.clipboard.writeText(CAPTIONS[template]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const saveAsPost = async () => {
    setSaving(true);
    try {
      await fetch("/api/brand/posts", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: TEMPLATES.find(t => t.id === template)?.label || template,
          post_type: "feed",
          caption: CAPTIONS[template],
          hashtags: CAPTIONS[template].split("\n").pop() || "",
        }),
      });
    } catch { /* ignore */ }
    setSaving(false);
  };

  const labelClass = "font-[family-name:var(--font-orbitron)] text-[0.45rem] tracking-[0.15em] text-orbital-purple mb-0.5 block";
  const inputClass = "w-full bg-[#0A0A0A] border border-[#2A2A2A] text-xs text-white px-2 py-1.5 focus:border-orbital-purple outline-none font-[family-name:var(--font-jetbrains)]";

  const rankColors = ["#F59E0B", "#C0C0C0", "#CD7F32", "#2A2A2A", "#2A2A2A"];

  return (
    <div className="space-y-4">
      <h1 className="font-[family-name:var(--font-orbitron)] text-sm tracking-[0.2em] text-white">GERADOR DE CARDS</h1>

      <div className="flex gap-6">
        {/* ═══ SIDEBAR ═══ */}
        <div className="w-72 shrink-0 space-y-4">
          {/* Template selector */}
          <div>
            <label className={labelClass}>TEMPLATE</label>
            <div className="relative">
              <select value={template} onChange={e => setTemplate(e.target.value as TemplateId)}
                className={`${inputClass} appearance-none pr-8`}>
                {TEMPLATES.map(t => <option key={t.id} value={t.id}>{t.label} — {t.desc}</option>)}
              </select>
              <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
            </div>
          </div>

          {/* Template-specific fields */}
          {template === "campea" && (
            <div className="space-y-2">
              <div><label className={labelClass}>TIME CAMPEÃO</label><input value={campea.championTeam} onChange={e => setCampea({ ...campea, championTeam: e.target.value })} className={inputClass} /></div>
              <div><label className={labelClass}>ROSTER (separar com •)</label><input value={campea.roster} onChange={e => setCampea({ ...campea, roster: e.target.value })} className={inputClass} /></div>
              <div><label className={labelClass}>CAMPEONATO</label><input value={campea.tournamentName} onChange={e => setCampea({ ...campea, tournamentName: e.target.value })} className={inputClass} /></div>
            </div>
          )}

          {template === "top5" && (
            <div className="space-y-2">
              <div><label className={labelClass}>CAMPEONATO</label><input value={top5.tournamentName} onChange={e => setTop5({ ...top5, tournamentName: e.target.value })} className={inputClass} /></div>
              {top5.players.map((p, i) => (
                <div key={i} className="grid grid-cols-4 gap-1">
                  <input placeholder="Nick" value={p.nick} onChange={e => { const pl = [...top5.players]; pl[i] = { ...pl[i], nick: e.target.value }; setTop5({ ...top5, players: pl }); }} className={`${inputClass} col-span-2`} />
                  <input placeholder="Kills" value={p.kills} onChange={e => { const pl = [...top5.players]; pl[i] = { ...pl[i], kills: Number(e.target.value) }; setTop5({ ...top5, players: pl }); }} className={inputClass} />
                  <input placeholder="Rating" value={p.rating} onChange={e => { const pl = [...top5.players]; pl[i] = { ...pl[i], rating: e.target.value }; setTop5({ ...top5, players: pl }); }} className={inputClass} />
                </div>
              ))}
            </div>
          )}

          {template === "resultado" && (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div><label className={labelClass}>TIME 1</label><input value={resultado.team1Name} onChange={e => setResultado({ ...resultado, team1Name: e.target.value })} className={inputClass} /></div>
                <div><label className={labelClass}>TIME 2</label><input value={resultado.team2Name} onChange={e => setResultado({ ...resultado, team2Name: e.target.value })} className={inputClass} /></div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className={labelClass}>SCORE 1</label><input type="number" value={resultado.score1} onChange={e => setResultado({ ...resultado, score1: Number(e.target.value) })} className={inputClass} /></div>
                <div><label className={labelClass}>SCORE 2</label><input type="number" value={resultado.score2} onChange={e => setResultado({ ...resultado, score2: Number(e.target.value) })} className={inputClass} /></div>
              </div>
              <div><label className={labelClass}>FASE</label><input value={resultado.stage} onChange={e => setResultado({ ...resultado, stage: e.target.value })} className={inputClass} /></div>
              <div><label className={labelClass}>DATA</label><input value={resultado.date} onChange={e => setResultado({ ...resultado, date: e.target.value })} className={inputClass} /></div>
            </div>
          )}

          {template === "highlight" && (
            <div className="space-y-2">
              <div><label className={labelClass}>JOGADOR</label><input value={highlight.playerNick} onChange={e => setHighlight({ ...highlight, playerNick: e.target.value })} className={inputClass} /></div>
              <div><label className={labelClass}>TIPO (ex: ACE — 5 Kills)</label><input value={highlight.playType} onChange={e => setHighlight({ ...highlight, playType: e.target.value })} className={inputClass} /></div>
              <div className="grid grid-cols-3 gap-1">
                <div><label className={labelClass}>KILLS</label><input type="number" value={highlight.kills} onChange={e => setHighlight({ ...highlight, kills: Number(e.target.value) })} className={inputClass} /></div>
                <div><label className={labelClass}>HS</label><input type="number" value={highlight.hs} onChange={e => setHighlight({ ...highlight, hs: Number(e.target.value) })} className={inputClass} /></div>
                <div><label className={labelClass}>SCORE</label><input type="number" value={highlight.score} onChange={e => setHighlight({ ...highlight, score: Number(e.target.value) })} className={inputClass} /></div>
              </div>
              <div><label className={labelClass}>ARMA</label><input value={highlight.weapon} onChange={e => setHighlight({ ...highlight, weapon: e.target.value })} className={inputClass} /></div>
              <div><label className={labelClass}>ESPECIAL</label><input value={highlight.special} onChange={e => setHighlight({ ...highlight, special: e.target.value })} className={inputClass} /></div>
              <div><label className={labelClass}>PARTIDA</label><input value={highlight.matchInfo} onChange={e => setHighlight({ ...highlight, matchInfo: e.target.value })} className={inputClass} /></div>
              <div><label className={labelClass}>ROUND</label><input type="number" value={highlight.round} onChange={e => setHighlight({ ...highlight, round: Number(e.target.value) })} className={inputClass} /></div>
            </div>
          )}

          {template === "perfil" && (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div><label className={labelClass}>NICK</label><input value={perfil.nick} onChange={e => setPerfil({ ...perfil, nick: e.target.value })} className={inputClass} /></div>
                <div><label className={labelClass}>TIME</label><input value={perfil.team} onChange={e => setPerfil({ ...perfil, team: e.target.value })} className={inputClass} /></div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className={labelClass}>RATING</label><input value={perfil.rating} onChange={e => setPerfil({ ...perfil, rating: e.target.value })} className={inputClass} /></div>
                <div><label className={labelClass}>RANK #</label><input type="number" value={perfil.rankPosition} onChange={e => setPerfil({ ...perfil, rankPosition: Number(e.target.value) })} className={inputClass} /></div>
              </div>
              <div className="grid grid-cols-3 gap-1">
                <div><label className={labelClass}>KILLS</label><input type="number" value={perfil.kills} onChange={e => setPerfil({ ...perfil, kills: Number(e.target.value) })} className={inputClass} /></div>
                <div><label className={labelClass}>DEATHS</label><input type="number" value={perfil.deaths} onChange={e => setPerfil({ ...perfil, deaths: Number(e.target.value) })} className={inputClass} /></div>
                <div><label className={labelClass}>K/D</label><input value={perfil.kd} onChange={e => setPerfil({ ...perfil, kd: e.target.value })} className={inputClass} /></div>
              </div>
              <div className="grid grid-cols-3 gap-1">
                <div><label className={labelClass}>HS%</label><input value={perfil.hs} onChange={e => setPerfil({ ...perfil, hs: e.target.value })} className={inputClass} /></div>
                <div><label className={labelClass}>ADR</label><input type="number" value={perfil.adr} onChange={e => setPerfil({ ...perfil, adr: Number(e.target.value) })} className={inputClass} /></div>
                <div><label className={labelClass}>WINS</label><input type="number" value={perfil.wins} onChange={e => setPerfil({ ...perfil, wins: Number(e.target.value) })} className={inputClass} /></div>
              </div>
            </div>
          )}

          {template === "teaser" && (
            <div className="space-y-2">
              <div><label className={labelClass}>CUP #</label><input type="number" value={teaser.cupNumber} onChange={e => setTeaser({ ...teaser, cupNumber: Number(e.target.value) })} className={inputClass} /></div>
              <div><label className={labelClass}>SUBTÍTULO</label><input value={teaser.subtitle} onChange={e => setTeaser({ ...teaser, subtitle: e.target.value })} className={inputClass} /></div>
              <div><label className={labelClass}>TEXTO TEASER</label><input value={teaser.teaserText} onChange={e => setTeaser({ ...teaser, teaserText: e.target.value })} className={inputClass} /></div>
            </div>
          )}

          {/* Action buttons */}
          <div className="space-y-2 pt-2 border-t border-[#1A1A1A]">
            <button onClick={downloadPNG} className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-orbital-purple/15 border border-orbital-purple/30 text-orbital-purple font-[family-name:var(--font-jetbrains)] text-[0.6rem] tracking-wider hover:bg-orbital-purple/25 transition-all">
              <Download size={12} /> BAIXAR PNG
            </button>
            <button onClick={copyCaption} className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-[#111] border border-[#2A2A2A] text-white/50 font-[family-name:var(--font-jetbrains)] text-[0.6rem] tracking-wider hover:text-white hover:border-orbital-purple/30 transition-all">
              {copied ? <><Check size={12} /> COPIADO!</> : <><Copy size={12} /> COPIAR CAPTION</>}
            </button>
            <button onClick={saveAsPost} disabled={saving} className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-[#111] border border-[#2A2A2A] text-white/50 font-[family-name:var(--font-jetbrains)] text-[0.6rem] tracking-wider hover:text-white hover:border-orbital-purple/30 disabled:opacity-30 transition-all">
              <Save size={12} /> {saving ? "SALVANDO..." : "SALVAR COMO POST"}
            </button>
          </div>
        </div>

        {/* ═══ PREVIEW AREA ═══ */}
        <div className="flex-1 flex flex-col items-center">
          <motion.div key={template} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }}>
            <div ref={cardRef} className="w-[600px] h-[600px] overflow-hidden relative" style={{ fontFamily: "'Barlow', 'Barlow Condensed', sans-serif" }}>

              {/* ── CAMPEÃO ── */}
              {template === "campea" && (
                <div className="w-full h-full bg-[#0A0A0A] relative flex flex-col items-center justify-center">
                  <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 70% 70% at 50% 100%, rgba(168,85,247,0.55) 0%, transparent 65%), radial-gradient(ellipse 40% 40% at 20% 15%, rgba(124,58,237,0.25) 0%, transparent 55%)" }} />
                  <div className="absolute inset-0" style={{ backgroundImage: "linear-gradient(rgba(168,85,247,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,0.05) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
                  <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-[#A855F7]" />
                  <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-[#A855F7]" />
                  <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-[#A855F7]" />
                  <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-[#A855F7]" />
                  <div className="relative z-10 text-center">
                    <div className="inline-block px-3 py-1 mb-4 text-[9px] tracking-[3px] text-[#C084FC] bg-[rgba(168,85,247,0.12)] border border-[rgba(168,85,247,0.3)] uppercase" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{campea.tournamentName}</div>
                    <div className="text-5xl mb-2" style={{ filter: "drop-shadow(0 0 20px rgba(245,158,11,0.6))" }}>🏆</div>
                    <div className="text-[8px] tracking-[4px] text-[#F59E0B] uppercase mb-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>★ Campeão ★</div>
                    <div className="text-[28px] font-black tracking-wider text-white uppercase mb-3" style={{ fontFamily: "'Orbitron', monospace", textShadow: "0 0 40px rgba(168,85,247,0.8)" }}>{campea.championTeam}</div>
                    <div className="text-[9px] tracking-wider text-[#888] mb-4" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{campea.roster}</div>
                    <div className="text-[7px] tracking-[3px] text-[rgba(168,85,247,0.5)] uppercase" style={{ fontFamily: "'Orbitron', monospace" }}>orbitalroxa.com.br</div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ background: "linear-gradient(to right, transparent, #A855F7, #C084FC, transparent)" }} />
                </div>
              )}

              {/* ── TOP 5 ── */}
              {template === "top5" && (
                <div className="w-full h-full bg-[#0A0A0A] relative flex flex-col overflow-hidden">
                  <div className="absolute top-[-40px] right-[-40px] w-[200px] h-[200px]" style={{ background: "radial-gradient(circle, rgba(168,85,247,0.15) 0%, transparent 70%)" }} />
                  <div className="relative z-10 px-5 pt-5 pb-3 border-b border-[#111] flex items-end justify-between">
                    <div>
                      <div className="text-[32px] font-black uppercase leading-none" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>TOP <span className="text-[#A855F7]">5</span></div>
                      <div className="text-[8px] tracking-[2px] text-[#666] uppercase mt-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{top5.tournamentName}</div>
                    </div>
                    <div className="text-[7px] tracking-[2px] text-[rgba(168,85,247,0.6)] text-right" style={{ fontFamily: "'Orbitron', monospace" }}>orbitalroxa<br />.com.br</div>
                  </div>
                  {/* Column headers */}
                  <div className="relative z-10 flex items-center px-5 py-2 text-[7px] tracking-[1px] text-[#444] uppercase" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    <span className="w-7" /><span className="flex-1 pl-1.5">Jogador</span>
                    <span className="w-12 text-right">Kills</span><span className="w-12 text-right">HS%</span><span className="w-14 text-right">Rating</span>
                  </div>
                  {top5.players.map((p, i) => (
                    <div key={i} className="relative z-10 flex items-center px-5 h-[72px] border-b border-[#0D0D0D]">
                      {i === 0 && <div className="absolute left-0 top-0 bottom-0" style={{ width: "70%", background: "linear-gradient(to right, rgba(168,85,247,0.07), transparent)" }} />}
                      <div className="text-[20px] font-black w-7 shrink-0 relative z-10" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: rankColors[i] }}>{i + 1}</div>
                      <div className="flex-1 pl-1.5 relative z-10">
                        <div className="text-[14px] font-bold tracking-wider uppercase" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>{p.nick}</div>
                        <div className="text-[8px] text-[#555] tracking-wider" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{p.team}</div>
                      </div>
                      <div className="w-12 text-right relative z-10">
                        <div className="text-[14px] font-bold" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>{p.kills}</div>
                        <div className="text-[7px] text-[#444] tracking-wider uppercase" style={{ fontFamily: "'JetBrains Mono', monospace" }}>kills</div>
                      </div>
                      <div className="w-12 text-right relative z-10">
                        <div className="text-[14px] font-bold" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>{p.hs}</div>
                        <div className="text-[7px] text-[#444] tracking-wider uppercase" style={{ fontFamily: "'JetBrains Mono', monospace" }}>hs%</div>
                      </div>
                      <div className="w-14 text-right relative z-10">
                        <div className="text-[20px] font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>{p.rating}</div>
                      </div>
                    </div>
                  ))}
                  <div className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ background: "linear-gradient(to right, transparent, #A855F7, #C084FC, transparent)" }} />
                </div>
              )}

              {/* ── RESULTADO ── */}
              {template === "resultado" && (
                <div className="w-full h-full bg-[#0A0A0A] relative flex flex-col overflow-hidden">
                  <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 60% 60% at 50% 110%, rgba(168,85,247,0.3) 0%, transparent 65%)" }} />
                  <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, transparent 49.5%, rgba(168,85,247,0.06) 49.5%, rgba(168,85,247,0.06) 50.5%, transparent 50.5%)" }} />
                  <div className="relative z-10 px-5 pt-4 flex justify-between items-center">
                    <div className="text-[8px] tracking-[3px] text-[rgba(168,85,247,0.7)]" style={{ fontFamily: "'Orbitron', monospace" }}>ORBITAL ROXA</div>
                    <div className="text-[7px] tracking-[2px] text-[#C084FC] bg-[rgba(168,85,247,0.1)] border border-[rgba(168,85,247,0.2)] px-2 py-0.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{resultado.format}</div>
                  </div>
                  <div className="relative z-10 text-center py-2 text-[8px] tracking-[3px] text-[#666] uppercase" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{resultado.stage}</div>
                  <div className="relative z-10 flex items-center px-5 flex-1">
                    <div className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-16 h-16 bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center text-[24px] font-black text-[#333]" style={{ fontFamily: "'Orbitron', monospace" }}>{resultado.team1Name[0]}</div>
                      <div className={`text-[16px] font-extrabold tracking-[2px] uppercase text-center ${resultado.score1 < resultado.score2 ? "text-[#333]" : "text-white"}`} style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>{resultado.team1Name}</div>
                      {resultado.score1 > resultado.score2 && <div className="text-[7px] tracking-[2px] text-[#F59E0B] bg-[rgba(245,158,11,0.08)] border border-[rgba(245,158,11,0.2)] px-2 py-0.5 uppercase" style={{ fontFamily: "'JetBrains Mono', monospace" }}>★ Vencedor</div>}
                    </div>
                    <div className="flex flex-col items-center px-3">
                      <div className="text-[52px] font-black leading-none tracking-tight" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                        <span className={resultado.score1 < resultado.score2 ? "text-[#333]" : "text-white"}>{resultado.score1}</span>
                        <span className="text-[#333] mx-1">:</span>
                        <span className={resultado.score2 < resultado.score1 ? "text-[#333]" : "text-white"}>{resultado.score2}</span>
                      </div>
                    </div>
                    <div className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-16 h-16 bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center text-[24px] font-black text-[#333]" style={{ fontFamily: "'Orbitron', monospace" }}>{resultado.team2Name[0]}</div>
                      <div className={`text-[16px] font-extrabold tracking-[2px] uppercase text-center ${resultado.score2 < resultado.score1 ? "text-[#333]" : "text-white"}`} style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>{resultado.team2Name}</div>
                      {resultado.score2 > resultado.score1 && <div className="text-[7px] tracking-[2px] text-[#F59E0B] bg-[rgba(245,158,11,0.08)] border border-[rgba(245,158,11,0.2)] px-2 py-0.5 uppercase" style={{ fontFamily: "'JetBrains Mono', monospace" }}>★ Vencedor</div>}
                    </div>
                  </div>
                  <div className="relative z-10 flex gap-1.5 px-5 pb-4">
                    {resultado.maps.map((m, i) => {
                      const win = (resultado.score2 > resultado.score1 ? m.score2 > m.score1 : m.score1 > m.score2);
                      return (
                        <div key={i} className={`flex-1 p-2 border ${win ? "border-[rgba(168,85,247,0.3)] bg-[rgba(168,85,247,0.04)]" : "border-[#1A1A1A] opacity-40"}`}>
                          <div className="text-[7px] tracking-[2px] text-[#666] uppercase mb-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{m.name}</div>
                          <div className="text-[16px] font-extrabold" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                            <span className={m.score1 > m.score2 ? "text-[#C084FC]" : "text-[#333]"}>{m.score1}</span>
                            <span className="text-[#333]">:</span>
                            <span className={m.score2 > m.score1 ? "text-[#C084FC]" : "text-[#333]"}>{m.score2}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="relative z-10 px-5 py-2 border-t border-[#111] bg-[rgba(0,0,0,0.4)] flex justify-between">
                    <div className="text-[8px] text-[#333] tracking-wider" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{resultado.date}</div>
                    <div className="text-[8px] text-[#333] tracking-wider" style={{ fontFamily: "'JetBrains Mono', monospace" }}>orbitalroxa.com.br</div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ background: "linear-gradient(to right, transparent, #A855F7, #C084FC, transparent)" }} />
                </div>
              )}

              {/* ── HIGHLIGHT ── */}
              {template === "highlight" && (
                <div className="w-full h-full bg-[#0A0A0A] relative flex flex-col overflow-hidden">
                  <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 80% 60% at 50% 100%, rgba(168,85,247,0.6) 0%, transparent 55%), radial-gradient(ellipse 50% 50% at 15% 15%, rgba(124,58,237,0.3) 0%, transparent 50%)" }} />
                  <div className="absolute inset-0" style={{ backgroundImage: "linear-gradient(rgba(168,85,247,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,0.04) 1px, transparent 1px)", backgroundSize: "30px 30px" }} />
                  <div className="absolute top-3.5 left-3.5 w-5 h-5 border-t-2 border-l-2 border-[#A855F7]" />
                  <div className="absolute top-3.5 right-3.5 w-5 h-5 border-t-2 border-r-2 border-[#A855F7]" />
                  <div className="absolute bottom-3.5 left-3.5 w-5 h-5 border-b-2 border-l-2 border-[#A855F7]" />
                  <div className="absolute bottom-3.5 right-3.5 w-5 h-5 border-b-2 border-r-2 border-[#A855F7]" />
                  <div className="relative z-10 px-6 pt-7 flex justify-between items-center">
                    <div className="text-[8px] tracking-[3px] text-[#C084FC] uppercase" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Play of the Tournament</div>
                    <div className="text-[11px] font-black tracking-[2px] text-[#F59E0B] bg-[rgba(245,158,11,0.08)] border border-[rgba(245,158,11,0.25)] px-2.5 py-0.5 uppercase" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>Score {highlight.score}</div>
                  </div>
                  <div className="relative z-10 px-6 pt-5 flex-1 flex flex-col justify-center">
                    <div className="text-[56px] font-black leading-[0.9] tracking-tight uppercase" style={{ fontFamily: "'Barlow Condensed', sans-serif", textShadow: "0 0 50px rgba(168,85,247,0.7)" }}>{highlight.playerNick}</div>
                    <div className="text-[22px] font-extrabold tracking-[3px] uppercase text-[#C084FC] mt-1" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>{highlight.playType}</div>
                    <div className="text-[11px] text-[#777] mt-2.5 leading-relaxed">{highlight.description}</div>
                    <div className="flex gap-1.5 mt-3 flex-wrap">
                      <span className="text-[8px] tracking-wider uppercase px-2 py-0.5 border" style={{ fontFamily: "'JetBrains Mono', monospace", color: "#39FF14", borderColor: "rgba(57,255,20,0.3)", background: "rgba(57,255,20,0.04)" }}>{highlight.kills}K</span>
                      <span className="text-[8px] tracking-wider uppercase px-2 py-0.5 border" style={{ fontFamily: "'JetBrains Mono', monospace", color: "#EF4444", borderColor: "rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.04)" }}>{highlight.hs} HS</span>
                      <span className="text-[8px] tracking-wider uppercase px-2 py-0.5 border" style={{ fontFamily: "'JetBrains Mono', monospace", color: "#C084FC", borderColor: "rgba(192,132,252,0.3)", background: "rgba(192,132,252,0.04)" }}>{highlight.weapon}</span>
                      {highlight.special && <span className="text-[8px] tracking-wider uppercase px-2 py-0.5 border" style={{ fontFamily: "'JetBrains Mono', monospace", color: "#F59E0B", borderColor: "rgba(245,158,11,0.3)", background: "rgba(245,158,11,0.04)" }}>{highlight.special}</span>}
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 z-10 px-6 py-3 border-t border-[rgba(168,85,247,0.12)] bg-[rgba(0,0,0,0.5)] flex justify-between items-center">
                    <div className="text-[8px] text-[#444] tracking-wider leading-relaxed" style={{ fontFamily: "'JetBrains Mono', monospace" }}><strong className="text-[#666] block">{highlight.tournamentName}</strong>{highlight.matchInfo}</div>
                    <div className="text-[12px] font-extrabold tracking-[2px] text-white bg-[#4C1D95] border border-[#A855F7] px-2.5 py-1 uppercase" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>Round {highlight.round}</div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ background: "linear-gradient(to right, transparent, #A855F7, #C084FC, transparent)" }} />
                </div>
              )}

              {/* ── PERFIL ── */}
              {template === "perfil" && (
                <div className="w-full h-full bg-[#0A0A0A] relative flex flex-col overflow-hidden">
                  <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 60% 80% at 0% 50%, rgba(168,85,247,0.2) 0%, transparent 60%), radial-gradient(ellipse 40% 40% at 100% 0%, rgba(124,58,237,0.15) 0%, transparent 50%)" }} />
                  <div className="relative z-10 px-5 pt-5 flex items-center gap-4">
                    <div className="w-[72px] h-[72px] bg-[#4C1D95] border-2 border-[#A855F7] flex items-center justify-center shrink-0" style={{ clipPath: "polygon(8px 0%, 100% 0%, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0% 100%, 0% 8px)", fontFamily: "'Orbitron', monospace", fontSize: "24px", fontWeight: 900, color: "#C084FC" }}>{perfil.nick[0]?.toUpperCase()}</div>
                    <div>
                      <div className="text-[28px] font-black tracking-[2px] uppercase" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>{perfil.nick}</div>
                      <div className="text-[10px] text-[#C084FC] tracking-[2px] mt-0.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{perfil.team}</div>
                      <div className="text-[9px] text-[#F59E0B] tracking-[2px] mt-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>🥇 #{perfil.rankPosition} Ranking Geral</div>
                    </div>
                  </div>
                  <div className="relative z-10 px-5 py-4 flex items-center gap-3">
                    <div className="text-[52px] font-black leading-none" style={{ fontFamily: "'Orbitron', monospace", color: "#C084FC", textShadow: "0 0 30px rgba(168,85,247,0.5)" }}>{perfil.rating}</div>
                    <div className="flex flex-col gap-1">
                      <div className="text-[9px] tracking-[3px] text-[#666] uppercase" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Rating</div>
                      <div className="text-[22px] font-bold text-[#F59E0B]" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>#{perfil.rankPosition}</div>
                    </div>
                  </div>
                  <div className="relative z-10 grid grid-cols-3 gap-px bg-[#1A1A1A] flex-1">
                    {[
                      { val: perfil.kills, label: "KILLS" }, { val: perfil.kd, label: "K/D" }, { val: perfil.hs, label: "HS%" },
                      { val: perfil.deaths, label: "DEATHS" }, { val: perfil.adr, label: "ADR" }, { val: perfil.wins, label: "WINS" },
                    ].map((s, i) => (
                      <div key={i} className="bg-[#111] px-4 py-3.5">
                        <div className="text-[22px] font-extrabold" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>{s.val}</div>
                        <div className="text-[8px] text-[#666] tracking-[2px] uppercase mt-0.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                  <div className="relative z-10 px-5 py-2.5 border-t border-[#111] bg-[rgba(0,0,0,0.4)] flex justify-between items-center">
                    <div className="text-[8px] text-[#333] tracking-wider" style={{ fontFamily: "'JetBrains Mono', monospace" }}>orbitalroxa.com.br/perfil</div>
                    <div className="text-[7px] text-[rgba(168,85,247,0.5)] tracking-[2px]" style={{ fontFamily: "'Orbitron', monospace" }}>ORBITAL ROXA</div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ background: "linear-gradient(to right, transparent, #A855F7, #C084FC, transparent)" }} />
                </div>
              )}

              {/* ── TEASER ── */}
              {template === "teaser" && (
                <div className="w-full h-full bg-[#0A0A0A] relative flex flex-col items-center justify-center overflow-hidden">
                  <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 80% 80% at 50% 50%, rgba(168,85,247,0.25) 0%, transparent 65%)" }} />
                  <div className="absolute inset-0" style={{ backgroundImage: "linear-gradient(rgba(168,85,247,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,0.04) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
                  <div className="absolute rounded-full border border-[rgba(168,85,247,0.1)]" style={{ width: 300, height: 300, top: "50%", left: "50%", transform: "translate(-50%,-50%)", animation: "spin 20s linear infinite" }} />
                  <div className="absolute rounded-full border border-[rgba(168,85,247,0.15)]" style={{ width: 220, height: 220, top: "50%", left: "50%", transform: "translate(-50%,-50%)", animation: "spin 15s linear infinite reverse" }} />
                  <div className="absolute rounded-full border border-[rgba(168,85,247,0.2)]" style={{ width: 140, height: 140, top: "50%", left: "50%", transform: "translate(-50%,-50%)" }} />
                  <div className="relative z-10 text-center">
                    <div className="text-[9px] tracking-[5px] text-[#C084FC] uppercase mb-3" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{teaser.teaserText}</div>
                    <div className="text-[14px] tracking-[4px] text-[rgba(168,85,247,0.7)] mb-2" style={{ fontFamily: "'Orbitron', monospace" }}>ORBITAL ROXA</div>
                    <div className="text-[10px] tracking-[3px] text-[#666] uppercase mb-3" style={{ fontFamily: "'JetBrains Mono', monospace" }}>CUP</div>
                    <div className="text-[80px] font-black leading-none text-[#A855F7] mb-4" style={{ fontFamily: "'Orbitron', monospace", textShadow: "0 0 60px rgba(168,85,247,0.6)" }}>#{teaser.cupNumber}</div>
                    <div className="text-[10px] tracking-[3px] text-[#444]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{teaser.subtitle}</div>
                    <div className="mt-8 text-[7px] tracking-[3px] text-[rgba(168,85,247,0.3)] uppercase" style={{ fontFamily: "'Orbitron', monospace" }}>orbitalroxa.com.br</div>
                  </div>
                </div>
              )}

            </div>
          </motion.div>

          {/* Caption preview */}
          <div className="mt-4 w-[600px] bg-[#111] border border-[#1A1A1A] p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-[family-name:var(--font-orbitron)] text-[0.45rem] tracking-[0.15em] text-white/30">CAPTION</span>
              <button onClick={copyCaption} className="font-[family-name:var(--font-jetbrains)] text-[0.5rem] text-orbital-purple hover:underline">
                {copied ? "Copiado!" : "Copiar"}
              </button>
            </div>
            <p className="font-[family-name:var(--font-jetbrains)] text-[0.6rem] text-white/50 whitespace-pre-line leading-relaxed">{CAPTIONS[template]}</p>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes spin {
          from { transform: translate(-50%,-50%) rotate(0deg); }
          to { transform: translate(-50%,-50%) rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
