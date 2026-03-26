"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Users, CheckCircle2, XCircle, Clock, Loader2, Trash2, ExternalLink, UserPlus, Upload, Image as ImageIcon } from "lucide-react";
import Image from "next/image";

interface Inscricao {
  id: number;
  tournament_id: string | null;
  team_name: string;
  team_tag: string;
  captain_name: string;
  captain_steam_id: string;
  captain_whatsapp: string;
  players: { name: string; steam_id: string }[];
  logo_url: string | null;
  pix_comprovante_url: string | null;
  status: "pendente" | "aprovado" | "rejeitado" | "pago";
  notes: string | null;
  created_at: string;
}

const statusConfig = {
  pendente: { color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/30", icon: Clock, label: "PENDENTE" },
  aprovado: { color: "text-green-400", bg: "bg-green-500/10 border-green-500/30", icon: CheckCircle2, label: "APROVADO" },
  pago: { color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/30", icon: CheckCircle2, label: "PAGO" },
  rejeitado: { color: "text-red-400", bg: "bg-red-500/10 border-red-500/30", icon: XCircle, label: "REJEITADO" },
};

export default function InscricoesAdminPage() {
  const [inscricoes, setInscricoes] = useState<Inscricao[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [uploadingId, setUploadingId] = useState<number | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const pixInputRef = useRef<HTMLInputElement>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/inscricao", { credentials: "include" });
      const data = await res.json();
      setInscricoes((data.inscricoes || []).map((i: Inscricao) => ({
        ...i,
        players: typeof i.players === "string" ? JSON.parse(i.players) : i.players,
      })));
    } catch { /* */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const updateStatus = async (id: number, status: string) => {
    setActionLoading(id);
    await fetch("/api/inscricao", {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    await fetchData();
    setActionLoading(null);
  };

  const deleteInscricao = async (id: number) => {
    if (!confirm("Deletar esta inscrição?")) return;
    setActionLoading(id);
    await fetch(`/api/inscricao?id=${id}`, { method: "DELETE", credentials: "include" });
    await fetchData();
    setActionLoading(null);
  };

  const uploadComprovante = async (id: number, file: File) => {
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      alert("Use PNG, JPG ou WebP");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("Arquivo muito grande. Máximo 5MB");
      return;
    }

    setUploadingId(id);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "comprovante");

      const uploadRes = await fetch("/api/inscricao/upload", { method: "POST", body: formData });
      const uploadData = await uploadRes.json();

      if (!uploadRes.ok || !uploadData.url) {
        alert(uploadData.error || "Erro no upload");
        setUploadingId(null);
        return;
      }

      // Save the URL to the inscription
      await fetch("/api/inscricao", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, pix_comprovante_url: uploadData.url }),
      });

      await fetchData();
    } catch {
      alert("Erro de conexão");
    }
    setUploadingId(null);
  };

  const registerTeam = async (insc: Inscricao) => {
    setActionLoading(insc.id);
    try {
      const authName: Record<string, { name: string; captain: number; coach: number }> = {};
      for (const p of insc.players) {
        authName[p.steam_id] = { name: p.name, captain: p.steam_id === insc.captain_steam_id ? 1 : 0, coach: 0 };
      }

      const res = await fetch("/write-proxy/teams", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify([{
          name: insc.team_name,
          tag: insc.team_tag,
          flag: "BR",
          public_team: true,
          auth_name: authName,
        }]),
      });

      if (res.ok) {
        await updateStatus(insc.id, "aprovado");
        alert(`Time "${insc.team_name}" cadastrado no G5API!`);
      } else {
        alert("Erro ao cadastrar time no G5API");
      }
    } catch {
      alert("Erro de conexão");
    }
    setActionLoading(null);
  };

  const pendentes = inscricoes.filter(i => i.status === "pendente").length;
  const aprovados = inscricoes.filter(i => i.status === "aprovado" || i.status === "pago").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={24} className="text-orbital-purple animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users size={18} className="text-orbital-purple" />
          <div>
            <h1 className="font-[family-name:var(--font-orbitron)] text-lg tracking-wider text-orbital-text">INSCRIÇÕES</h1>
            <p className="font-[family-name:var(--font-jetbrains)] text-[0.6rem] text-orbital-text-dim">
              {pendentes} pendentes — {aprovados} aprovados — {inscricoes.length} total
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {(["pendente", "aprovado", "pago", "rejeitado"] as const).map(s => {
          const cfg = statusConfig[s];
          const count = inscricoes.filter(i => i.status === s).length;
          return (
            <div key={s} className={`bg-[#0A0A0A] border p-3 ${cfg.bg}`}>
              <div className={`font-[family-name:var(--font-orbitron)] text-[0.65rem] tracking-wider ${cfg.color}`}>{cfg.label}</div>
              <div className="font-[family-name:var(--font-jetbrains)] text-xl text-orbital-text mt-1">{count}</div>
            </div>
          );
        })}
      </div>

      {/* List */}
      <div className="space-y-2">
        {inscricoes.length === 0 && (
          <div className="bg-[#0A0A0A] border border-orbital-border p-8 text-center">
            <Users size={24} className="text-orbital-text-dim mx-auto mb-2" />
            <p className="font-[family-name:var(--font-jetbrains)] text-xs text-orbital-text-dim">Nenhuma inscrição recebida</p>
          </div>
        )}

        {/* Preview Modal */}
        {previewUrl && (
          <div
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={() => setPreviewUrl(null)}
          >
            <div className="relative max-w-2xl max-h-[80vh] overflow-auto bg-[#0A0A0A] border border-orbital-border p-2">
              <Image src={previewUrl} alt="Comprovante" width={600} height={800} className="object-contain" />
              <button
                onClick={() => setPreviewUrl(null)}
                className="absolute top-2 right-2 p-2 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded"
              >
                <XCircle size={20} />
              </button>
            </div>
          </div>
        )}

        {inscricoes.map((insc, idx) => {
          const cfg = statusConfig[insc.status];
          const Icon = cfg.icon;
          const expanded = expandedId === insc.id;
          const isLoading = actionLoading === insc.id;

          return (
            <motion.div
              key={insc.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              className={`bg-[#0A0A0A] border ${cfg.bg} overflow-hidden`}
            >
              {/* Row */}
              <button
                onClick={() => setExpandedId(expanded ? null : insc.id)}
                className="w-full flex items-center gap-3 p-3 hover:bg-white/[0.02] transition-colors text-left"
              >
                <Icon size={14} className={cfg.color} />
                <div className="flex-1 min-w-0">
                  <div className="font-[family-name:var(--font-orbitron)] text-xs tracking-wider text-orbital-text">
                    {insc.team_name} <span className="text-orbital-text-dim">[{insc.team_tag}]</span>
                  </div>
                  <div className="font-[family-name:var(--font-jetbrains)] text-[0.65rem] text-orbital-text-dim">
                    Capitão: {insc.captain_name} — {insc.players.length} jogadores — {new Date(insc.created_at).toLocaleDateString("pt-BR")}
                  </div>
                </div>
                <span className={`font-[family-name:var(--font-jetbrains)] text-[0.65rem] px-2 py-0.5 ${cfg.bg} ${cfg.color}`}>
                  {cfg.label}
                </span>
              </button>

              {/* Expanded */}
              {expanded && (
                <div className="border-t border-orbital-border/30 p-4 space-y-3">
                  {/* Logo and Team Info */}
                  <div className="flex gap-4">
                    {insc.logo_url && (
                      <div className="relative w-16 h-16 bg-[#111] border border-orbital-border rounded overflow-hidden shrink-0">
                        <Image src={insc.logo_url} alt="Logo" fill className="object-contain" />
                      </div>
                    )}
                    <div className="flex-1 grid grid-cols-3 gap-3">
                      <div>
                        <div className="font-[family-name:var(--font-orbitron)] text-[0.65rem] tracking-wider text-orbital-purple mb-0.5">WHATSAPP</div>
                        <a href={`https://wa.me/55${insc.captain_whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="font-[family-name:var(--font-jetbrains)] text-xs text-orbital-text hover:text-orbital-purple flex items-center gap-1">
                          {insc.captain_whatsapp} <ExternalLink size={10} />
                        </a>
                      </div>
                      <div>
                        <div className="font-[family-name:var(--font-orbitron)] text-[0.65rem] tracking-wider text-orbital-purple mb-0.5">STEAM ID CAPITÃO</div>
                        <span className="font-[family-name:var(--font-jetbrains)] text-xs text-orbital-text">{insc.captain_steam_id}</span>
                      </div>
                      <div>
                        <div className="font-[family-name:var(--font-orbitron)] text-[0.65rem] tracking-wider text-orbital-purple mb-0.5">LOGO</div>
                        <span className="font-[family-name:var(--font-jetbrains)] text-xs text-orbital-text-dim">{insc.logo_url ? "✓" : "—"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Players */}
                  <div>
                    <div className="font-[family-name:var(--font-orbitron)] text-[0.65rem] tracking-wider text-orbital-purple mb-1">JOGADORES</div>
                    <div className="space-y-1">
                      {insc.players.map((p, i) => (
                        <div key={i} className="flex items-center gap-2 font-[family-name:var(--font-jetbrains)] text-xs">
                          <span className="text-orbital-text-dim w-3">{i + 1}</span>
                          <span className="text-orbital-text">{p.name}</span>
                          <span className="text-orbital-text-dim/50">{p.steam_id}</span>
                          {p.steam_id === insc.captain_steam_id && <span className="text-[0.65rem] text-orbital-purple">(C)</span>}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Comprovante PIX */}
                  {(insc.status === "aprovado" || insc.status === "pago") && (
                    <div className="bg-[#111] border border-orbital-border p-3">
                      <div className="font-[family-name:var(--font-orbitron)] text-[0.65rem] tracking-wider text-orbital-purple mb-2">
                        COMPROVANTE PIX
                      </div>
                      {insc.pix_comprovante_url ? (
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setPreviewUrl(insc.pix_comprovante_url)}
                            className="flex items-center gap-2 text-green-400 hover:text-green-300 font-[family-name:var(--font-jetbrains)] text-xs"
                          >
                            <ImageIcon size={14} /> Ver comprovante
                          </button>
                          <span className="text-green-400 text-xs">✓ Anexado</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) uploadComprovante(insc.id, file);
                            }}
                            className="hidden"
                            id={`pix-${insc.id}`}
                          />
                          <label
                            htmlFor={`pix-${insc.id}`}
                            className={`flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/30 hover:border-yellow-500/60 text-yellow-400 font-[family-name:var(--font-jetbrains)] text-xs cursor-pointer transition-colors ${uploadingId === insc.id ? "opacity-50 pointer-events-none" : ""}`}
                          >
                            {uploadingId === insc.id ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                            {uploadingId === insc.id ? "Enviando..." : "Anexar comprovante"}
                          </label>
                          <span className="text-yellow-400/60 text-xs">Pendente</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2 border-t border-orbital-border/20">
                    {insc.status === "pendente" && (
                      <>
                        <button
                          onClick={() => registerTeam(insc)}
                          disabled={isLoading}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 border border-green-500/30 hover:border-green-500/60 text-green-400 font-[family-name:var(--font-jetbrains)] text-xs transition-colors disabled:opacity-40"
                        >
                          {isLoading ? <Loader2 size={12} className="animate-spin" /> : <UserPlus size={12} />}
                          APROVAR + CADASTRAR
                        </button>
                        <button
                          onClick={() => updateStatus(insc.id, "rejeitado")}
                          disabled={isLoading}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 border border-red-500/30 hover:border-red-500/60 text-red-400 font-[family-name:var(--font-jetbrains)] text-xs transition-colors disabled:opacity-40"
                        >
                          <XCircle size={12} /> REJEITAR
                        </button>
                      </>
                    )}
                    {insc.status === "aprovado" && (
                      <button
                        onClick={() => updateStatus(insc.id, "pago")}
                        disabled={isLoading}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 border border-blue-500/30 hover:border-blue-500/60 text-blue-400 font-[family-name:var(--font-jetbrains)] text-xs transition-colors disabled:opacity-40"
                      >
                        {isLoading ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                        MARCAR PAGO
                      </button>
                    )}
                    <button
                      onClick={() => deleteInscricao(insc.id)}
                      disabled={isLoading}
                      className="ml-auto flex items-center gap-1 px-2 py-1.5 text-orbital-text-dim hover:text-red-400 font-[family-name:var(--font-jetbrains)] text-xs transition-colors disabled:opacity-40"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
