"use client";

import { useState, RefObject } from "react";
import { Download, Loader2 } from "lucide-react";
import { toPng } from "html-to-image";

interface BracketExportButtonProps {
  bracketRef: RefObject<HTMLDivElement | null>;
  tournamentName: string;
}

export function BracketExportButton({ bracketRef, tournamentName }: BracketExportButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    if (!bracketRef.current || loading) return;
    setLoading(true);

    try {
      // Create off-screen wrapper
      const wrapper = document.createElement("div");
      wrapper.style.position = "absolute";
      wrapper.style.left = "-99999px";
      wrapper.style.top = "0";
      wrapper.style.background = "#0A0A0A";
      wrapper.style.padding = "32px";
      wrapper.style.width = "fit-content";

      // Header
      const header = document.createElement("div");
      header.style.display = "flex";
      header.style.justifyContent = "space-between";
      header.style.alignItems = "center";
      header.style.marginBottom = "24px";
      header.style.paddingBottom = "16px";
      header.style.borderBottom = "1px solid rgba(168,85,247,0.3)";

      const title = document.createElement("div");
      title.style.fontFamily = "Orbitron, sans-serif";
      title.style.fontSize = "18px";
      title.style.fontWeight = "800";
      title.style.letterSpacing = "0.1em";
      title.style.color = "#A855F7";
      title.textContent = tournamentName;

      const brand = document.createElement("div");
      brand.style.fontFamily = "Orbitron, sans-serif";
      brand.style.fontSize = "12px";
      brand.style.letterSpacing = "0.15em";
      brand.style.color = "rgba(255,255,255,0.4)";
      brand.textContent = "ORBITAL ROXA";

      header.appendChild(title);
      header.appendChild(brand);
      wrapper.appendChild(header);

      // Clone bracket content
      const clone = bracketRef.current.cloneNode(true) as HTMLElement;

      // Fix overflow:auto -> visible in clone so full bracket is captured
      const fixOverflow = (el: HTMLElement) => {
        if (el.style) {
          const computed = window.getComputedStyle(el);
          if (computed.overflow === "auto" || computed.overflow === "scroll" ||
              computed.overflowX === "auto" || computed.overflowX === "scroll" ||
              computed.overflowY === "auto" || computed.overflowY === "scroll") {
            el.style.overflow = "visible";
            el.style.overflowX = "visible";
            el.style.overflowY = "visible";
          }
        }
        for (let i = 0; i < el.children.length; i++) {
          fixOverflow(el.children[i] as HTMLElement);
        }
      };
      fixOverflow(clone);
      clone.style.overflow = "visible";
      wrapper.appendChild(clone);

      // Footer
      const footer = document.createElement("div");
      footer.style.marginTop = "24px";
      footer.style.paddingTop = "16px";
      footer.style.borderTop = "1px solid rgba(168,85,247,0.2)";
      footer.style.textAlign = "center";
      footer.style.fontFamily = "JetBrains Mono, monospace";
      footer.style.fontSize = "11px";
      footer.style.letterSpacing = "0.1em";
      footer.style.color = "rgba(255,255,255,0.3)";
      footer.textContent = "orbitalroxa.com.br";
      wrapper.appendChild(footer);

      document.body.appendChild(wrapper);

      // Generate image
      const dataUrl = await toPng(wrapper, {
        pixelRatio: 2,
        backgroundColor: "#0A0A0A",
      });

      document.body.removeChild(wrapper);

      // Try Web Share API (mobile), fallback to download
      const fileName = `${tournamentName.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase()}_bracket.png`;

      if (navigator.share && /Mobi|Android/i.test(navigator.userAgent)) {
        try {
          const res = await fetch(dataUrl);
          const blob = await res.blob();
          const file = new File([blob], fileName, { type: "image/png" });
          await navigator.share({ files: [file], title: `${tournamentName} - Bracket` });
        } catch {
          // Share cancelled or failed, fallback to download
          downloadImage(dataUrl, fileName);
        }
      } else {
        downloadImage(dataUrl, fileName);
      }
    } catch (err) {
      console.error("Erro ao exportar bracket:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="inline-flex items-center gap-2 px-4 py-2 bg-orbital-purple/10 border border-orbital-purple/30 hover:border-orbital-purple/60 transition-all font-[family-name:var(--font-orbitron)] text-[0.6rem] tracking-wider text-orbital-purple disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
      {loading ? "EXPORTANDO..." : "EXPORTAR IMAGEM"}
    </button>
  );
}

function downloadImage(dataUrl: string, fileName: string) {
  const link = document.createElement("a");
  link.download = fileName;
  link.href = dataUrl;
  link.click();
}
