"use client";

import { useRef, useState, useCallback } from "react";
import { toPng } from "html-to-image";
import { Download } from "lucide-react";

export interface PlayerCardStats {
  kills: number;
  deaths: number;
  assists: number;
  wins: number;
  total_maps: number;
  mvp: number;
  kdr: number;
  hsp: number;
  avgRating: number;
  adr: number;
}

interface PlayerCardExportProps {
  steamId: string;
  displayName: string;
  stats: PlayerCardStats;
}

function getTierBadge(rating: number): { label: string; color: string; bg: string } {
  if (rating >= 1.30) return { label: "ELITE", color: "#FFD700", bg: "rgba(255,215,0,0.15)" };
  if (rating >= 1.15) return { label: "PRO", color: "#A855F7", bg: "rgba(168,85,247,0.15)" };
  if (rating >= 1.00) return { label: "SKILLED", color: "#22C55E", bg: "rgba(34,197,94,0.15)" };
  if (rating >= 0.85) return { label: "AVERAGE", color: "#F59E0B", bg: "rgba(245,158,11,0.15)" };
  return { label: "ROOKIE", color: "#EF4444", bg: "rgba(239,68,68,0.15)" };
}

function getRatingColor(rating: number): string {
  if (rating >= 1.20) return "#22C55E";
  if (rating >= 0.80) return "#EDEDED";
  return "#EF4444";
}

export function PlayerCardExport({ steamId, displayName, stats }: PlayerCardExportProps) {
  const [exporting, setExporting] = useState(false);

  const handleExport = useCallback(async () => {
    if (exporting) return;
    setExporting(true);

    try {
      const tier = getTierBadge(stats.avgRating);
      const rc = getRatingColor(stats.avgRating);
      const avatarUrl = `/api/steam/avatar-image/${steamId}`;

      // Pre-load avatar image
      const avatarImg = new Image();
      avatarImg.crossOrigin = "anonymous";
      await new Promise<void>((resolve) => {
        avatarImg.onload = () => resolve();
        avatarImg.onerror = () => resolve();
        avatarImg.src = avatarUrl;
        setTimeout(resolve, 3000); // timeout fallback
      });

      // Build card DOM imperatively
      const card = document.createElement("div");
      card.style.cssText = `position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:600px;height:900px;background:#0A0A0A;overflow:hidden;z-index:99999;background-image:linear-gradient(rgba(168,85,247,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(168,85,247,0.04) 1px,transparent 1px);background-size:40px 40px;border:1px solid rgba(168,85,247,0.25);`;

      // Top accent
      const accent = document.createElement("div");
      accent.style.cssText = "position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,transparent,#A855F7,#C084FC,transparent)";
      card.appendChild(accent);

      // Header
      const header = document.createElement("div");
      header.style.cssText = "display:flex;justify-content:space-between;align-items:center;padding:14px 24px;border-bottom:1px solid rgba(168,85,247,0.2);background:rgba(168,85,247,0.04)";
      header.innerHTML = `<span style="font-family:Orbitron,monospace;font-size:11px;font-weight:800;letter-spacing:0.2em;color:#A855F7">ORBITAL ROXA</span><span style="font-family:Orbitron,monospace;font-size:8px;letter-spacing:0.25em;color:rgba(255,255,255,0.25);border:1px solid rgba(168,85,247,0.2);padding:3px 8px">PLAYER CARD</span>`;
      card.appendChild(header);

      // Avatar section
      const avatarSection = document.createElement("div");
      avatarSection.style.cssText = "display:flex;flex-direction:column;align-items:center;padding:32px 24px 16px";

      const avatarWrap = document.createElement("div");
      avatarWrap.style.cssText = "position:relative;width:128px;height:128px;margin-bottom:18px";

      // Glow rings
      const ring1 = document.createElement("div");
      ring1.style.cssText = "position:absolute;inset:-6px;border-radius:50%;box-shadow:0 0 0 2px rgba(168,85,247,0.15),0 0 30px rgba(168,85,247,0.35)";
      avatarWrap.appendChild(ring1);
      const ring2 = document.createElement("div");
      ring2.style.cssText = "position:absolute;inset:-3px;border-radius:50%;border:2px solid rgba(168,85,247,0.6)";
      avatarWrap.appendChild(ring2);

      // Avatar img
      const avImg = document.createElement("img");
      avImg.src = avatarImg.src;
      avImg.width = 128;
      avImg.height = 128;
      avImg.style.cssText = "width:128px;height:128px;border-radius:50%;object-fit:cover;display:block;background:#1A1A1A";
      avatarWrap.appendChild(avImg);
      avatarSection.appendChild(avatarWrap);

      // Player name
      const nameEl = document.createElement("div");
      nameEl.style.cssText = "font-family:Orbitron,monospace;font-size:22px;font-weight:800;color:#E2E8F0;letter-spacing:0.05em;text-align:center;text-shadow:0 0 20px rgba(168,85,247,0.25)";
      nameEl.textContent = displayName;
      avatarSection.appendChild(nameEl);

      // Sub-label
      const subLabel = document.createElement("div");
      subLabel.style.cssText = "font-family:'JetBrains Mono',monospace;font-size:10px;color:#64748B;letter-spacing:0.15em;margin-top:6px;display:flex;align-items:center;gap:8px";
      subLabel.innerHTML = '<span style="color:#A855F7">■</span> CS2 PLAYER <span style="color:#A855F7">■</span>';
      avatarSection.appendChild(subLabel);
      card.appendChild(avatarSection);

      // Rating section
      const ratingSection = document.createElement("div");
      ratingSection.style.cssText = "text-align:center;padding:8px 24px 16px";

      const ratingLabel = document.createElement("div");
      ratingLabel.style.cssText = "font-family:Orbitron,monospace;font-size:9px;letter-spacing:0.3em;color:#64748B;margin-bottom:4px";
      ratingLabel.textContent = "RATING GERAL";
      ratingSection.appendChild(ratingLabel);

      const ratingVal = document.createElement("div");
      ratingVal.style.cssText = `font-family:Orbitron,monospace;font-size:72px;font-weight:900;color:${rc};line-height:1;letter-spacing:-0.02em;text-shadow:0 0 40px ${rc}55`;
      ratingVal.textContent = stats.avgRating > 0 ? stats.avgRating.toFixed(2) : "—";
      ratingSection.appendChild(ratingVal);

      const tierBadge = document.createElement("div");
      tierBadge.style.cssText = `display:inline-block;font-family:Orbitron,monospace;font-size:8px;letter-spacing:0.2em;color:${tier.color};border:1px solid ${tier.color}55;padding:3px 12px;margin-top:8px;background:${tier.bg}`;
      tierBadge.textContent = tier.label;
      ratingSection.appendChild(tierBadge);
      card.appendChild(ratingSection);

      // Separator
      const sep = document.createElement("div");
      sep.style.cssText = "display:flex;align-items:center;gap:12px;padding:0 24px 16px";
      sep.innerHTML = '<div style="flex:1;height:1px;background:rgba(168,85,247,0.25)"></div><span style="font-family:Orbitron,monospace;font-size:8px;letter-spacing:0.3em;color:#A855F7">ESTATÍSTICAS</span><div style="flex:1;height:1px;background:rgba(168,85,247,0.25)"></div>';
      card.appendChild(sep);

      // Stats grid
      const grid = document.createElement("div");
      grid.style.cssText = "display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:0 40px";

      const statItems = [
        { label: "K / D", value: stats.kdr.toFixed(2), color: stats.kdr >= 1.0 ? "#22C55E" : "#EF4444" },
        { label: "HS %", value: `${Math.round(stats.hsp)}%`, color: "#A855F7" },
        { label: "KILLS", value: stats.kills.toLocaleString("pt-BR"), color: "#E2E8F0" },
        { label: "DEATHS", value: stats.deaths.toLocaleString("pt-BR"), color: "#EF4444" },
        { label: "VITÓRIAS", value: stats.wins.toString(), color: "#22C55E" },
        { label: "ADR", value: stats.adr.toString(), color: "#F59E0B" },
      ];

      for (const s of statItems) {
        const cell = document.createElement("div");
        cell.style.cssText = "background:rgba(255,255,255,0.03);border:1px solid rgba(168,85,247,0.12);padding:14px 12px;text-align:center";
        cell.innerHTML = `<div style="font-family:'JetBrains Mono',monospace;font-size:9px;color:rgba(237,237,237,0.4);letter-spacing:2px;margin-bottom:6px">${s.label}</div><div style="font-family:'JetBrains Mono',monospace;font-size:24px;font-weight:700;color:${s.color};line-height:1">${s.value}</div>`;
        grid.appendChild(cell);
      }
      card.appendChild(grid);

      // Secondary stats
      const secondary = document.createElement("div");
      secondary.style.cssText = "display:flex;justify-content:space-around;padding:20px 32px 0;border-top:1px solid rgba(168,85,247,0.1);margin-top:20px";
      for (const s of [
        { label: "ASSISTS", value: stats.assists.toLocaleString("pt-BR") },
        { label: "MVPs", value: stats.mvp.toString() },
        { label: "MAPAS", value: stats.total_maps.toString() },
      ]) {
        const el = document.createElement("div");
        el.style.cssText = "text-align:center";
        el.innerHTML = `<div style="font-family:'JetBrains Mono',monospace;font-size:16px;font-weight:700;color:#E2E8F0">${s.value}</div><div style="font-family:Orbitron,monospace;font-size:7px;letter-spacing:0.2em;color:#64748B;margin-top:3px">${s.label}</div>`;
        secondary.appendChild(el);
      }
      card.appendChild(secondary);

      // Footer
      const footer = document.createElement("div");
      footer.style.cssText = "position:absolute;bottom:0;left:0;right:0;height:48px;border-top:1px solid rgba(168,85,247,0.15);display:flex;align-items:center;justify-content:center;gap:16px;background:rgba(168,85,247,0.03)";
      footer.innerHTML = '<span style="font-family:\'JetBrains Mono\',monospace;font-size:10px;letter-spacing:0.12em;color:rgba(168,85,247,0.5)">orbitalroxa.com.br</span>';
      card.appendChild(footer);

      // Append to body, capture, remove
      document.body.appendChild(card);

      // Wait a tick for rendering
      await new Promise(r => setTimeout(r, 200));

      const dataUrl = await toPng(card, {
        pixelRatio: 2,
        backgroundColor: "#0A0A0A",
      });

      document.body.removeChild(card);

      // Download or share
      const fileName = `${displayName.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase()}_orbital_card.png`;
      if (navigator.share && /Mobi|Android/i.test(navigator.userAgent)) {
        try {
          const res = await fetch(dataUrl);
          const blob = await res.blob();
          const file = new File([blob], fileName, { type: "image/png" });
          await navigator.share({ files: [file], title: `${displayName} - ORBITAL ROXA` });
          return;
        } catch { /* fall through */ }
      }
      const link = document.createElement("a");
      link.download = fileName;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Player card export failed:", err);
    } finally {
      setExporting(false);
    }
  }, [displayName, exporting, stats, steamId]);

  return (
    <button
      onClick={handleExport}
      disabled={exporting}
      className="inline-flex items-center gap-1.5 px-3 py-1 bg-orbital-purple/10 border border-orbital-purple/30 hover:border-orbital-purple/60 hover:bg-orbital-purple/20 transition-all font-[family-name:var(--font-orbitron)] text-[0.5rem] tracking-wider text-orbital-purple disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <Download size={11} />
      {exporting ? "GERANDO..." : "EXPORTAR CARD"}
    </button>
  );
}
