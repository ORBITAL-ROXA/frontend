"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Instagram, Sparkles, Image, Hash, Calendar, Check, Plus, Loader2, Copy, ChevronDown, X } from "lucide-react";

interface Post { id: number; title: string; post_type: string; scheduled_date: string; scheduled_time: string; caption: string; hashtags: string; published: boolean; notes: string }

const typeBadge: Record<string, string> = { feed: "bg-blue-500/20 text-blue-400", story: "bg-pink-500/20 text-pink-400", reel: "bg-purple-500/20 text-purple-400" };

export default function InstagramPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [aiLoading, setAiLoading] = useState<Record<string, boolean>>({});
  const [aiResults, setAiResults] = useState<Record<string, string>>({});
  const [adding, setAdding] = useState(false);
  const [newPost, setNewPost] = useState({ title: "", post_type: "feed", scheduled_date: "", scheduled_time: "19:30" });
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/brand/posts", { credentials: "include" }).then(r => r.ok ? r.json() : { posts: [] }).then(d => { setPosts(d.posts || []); setLoading(false); });
  }, []);

  const callAI = async (action: string, context: Record<string, string>, key: string) => {
    setAiLoading(p => ({ ...p, [key]: true }));
    try {
      const res = await fetch("/api/brand/ai/execute", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, context }) });
      const d = await res.json();
      setAiResults(p => ({ ...p, [key]: d.result || d.error || "Sem resultado" }));
    } catch { setAiResults(p => ({ ...p, [key]: "Erro ao gerar" })); }
    setAiLoading(p => ({ ...p, [key]: false }));
  };

  const copyText = (text: string, key: string) => { navigator.clipboard.writeText(text); setCopied(key); setTimeout(() => setCopied(null), 2000); };

  const applyToPost = async (postId: number, field: "caption" | "hashtags", value: string) => {
    await fetch("/api/brand/posts", { method: "PUT", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: postId, [field]: value }) });
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, [field]: value } : p));
  };

  const togglePublished = async (id: number, published: boolean) => {
    await fetch("/api/brand/posts", { method: "PUT", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, published: !published }) });
    setPosts(prev => prev.map(p => p.id === id ? { ...p, published: !published } : p));
  };

  const addPost = async () => {
    if (!newPost.title.trim()) return;
    const res = await fetch("/api/brand/posts", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newPost) });
    if (res.ok) {
      const d = await res.json();
      setPosts(prev => [...prev, { ...newPost, id: d.id, caption: "", hashtags: "", published: false, notes: "" }]);
      setNewPost({ title: "", post_type: "feed", scheduled_date: "", scheduled_time: "19:30" });
      setAdding(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-orbital-purple border-t-transparent rounded-full animate-spin" /></div>;

  const filtered = filter === "all" ? posts : filter === "published" ? posts.filter(p => p.published) : filter === "draft" ? posts.filter(p => !p.published) : posts.filter(p => p.post_type === filter);
  const published = posts.filter(p => p.published).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-orbitron)] text-lg tracking-wider text-orbital-text">INSTAGRAM</h1>
          <p className="font-[family-name:var(--font-jetbrains)] text-xs text-orbital-text-dim mt-1">@orbitalroxa.gg — {published}/{posts.length} publicados</p>
        </div>
        <button onClick={() => setAdding(!adding)} className="flex items-center gap-1 px-3 py-1.5 bg-pink-500/10 border border-pink-500/30 hover:border-pink-500/60 transition-all font-[family-name:var(--font-orbitron)] text-[0.55rem] tracking-wider text-pink-400">
          <Plus size={12} /> NOVO POST
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {["all", "feed", "story", "reel", "published", "draft"].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-2 py-1 font-[family-name:var(--font-jetbrains)] text-[0.55rem] border transition-all ${filter === f ? "border-orbital-purple/60 text-orbital-purple bg-orbital-purple/10" : "border-orbital-border text-orbital-text-dim hover:border-orbital-border/60"}`}>
            {f === "all" ? "TODOS" : f.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Add form */}
      {adding && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-[#0A0A0A] border border-pink-500/30 p-4 space-y-3">
          <input value={newPost.title} onChange={e => setNewPost(p => ({ ...p, title: e.target.value }))} placeholder="Título do post..." className="w-full bg-transparent border border-orbital-border p-2 font-[family-name:var(--font-jetbrains)] text-xs text-orbital-text placeholder:text-orbital-text-dim/30 outline-none focus:border-pink-500/50" />
          <div className="grid grid-cols-3 gap-2">
            <select value={newPost.post_type} onChange={e => setNewPost(p => ({ ...p, post_type: e.target.value }))} className="bg-[#111] border border-orbital-border p-1.5 font-[family-name:var(--font-jetbrains)] text-[0.6rem] text-orbital-text outline-none">
              <option value="feed">Feed</option><option value="story">Story</option><option value="reel">Reel</option>
            </select>
            <input type="date" value={newPost.scheduled_date} onChange={e => setNewPost(p => ({ ...p, scheduled_date: e.target.value }))} className="bg-[#111] border border-orbital-border p-1.5 font-[family-name:var(--font-jetbrains)] text-[0.6rem] text-orbital-text outline-none" />
            <input type="time" value={newPost.scheduled_time} onChange={e => setNewPost(p => ({ ...p, scheduled_time: e.target.value }))} className="bg-[#111] border border-orbital-border p-1.5 font-[family-name:var(--font-jetbrains)] text-[0.6rem] text-orbital-text outline-none" />
          </div>
          <button onClick={addPost} className="px-4 py-1.5 bg-pink-500 text-white font-[family-name:var(--font-orbitron)] text-[0.55rem] tracking-wider hover:bg-pink-500/80 transition-colors">CRIAR POST</button>
        </motion.div>
      )}

      {/* Posts */}
      <div className="space-y-2">
        {filtered.map(post => {
          const isExpanded = expanded === post.id;
          return (
            <div key={post.id} className="bg-[#0A0A0A] border border-orbital-border overflow-hidden">
              {/* Header */}
              <button onClick={() => setExpanded(isExpanded ? null : post.id)} className="w-full flex items-center gap-3 p-3 hover:bg-white/5 transition-colors text-left">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className={`px-1.5 py-0.5 text-[0.5rem] font-[family-name:var(--font-jetbrains)] ${typeBadge[post.post_type] || ""}`}>{post.post_type}</span>
                  <span className="font-[family-name:var(--font-jetbrains)] text-xs text-orbital-text truncate">{post.title}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {post.scheduled_date && <span className="font-[family-name:var(--font-jetbrains)] text-[0.5rem] text-orbital-text-dim">{new Date(post.scheduled_date + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}</span>}
                  <button onClick={e => { e.stopPropagation(); togglePublished(post.id, post.published); }} className={`px-1.5 py-0.5 text-[0.5rem] font-[family-name:var(--font-jetbrains)] ${post.published ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"}`}>
                    {post.published ? "PUBLICADO" : "RASCUNHO"}
                  </button>
                  <ChevronDown size={12} className={`text-orbital-text-dim transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                </div>
              </button>

              {/* Expanded */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-orbital-border">
                    <div className="p-4 space-y-3">
                      {/* Caption */}
                      <div>
                        <div className="font-[family-name:var(--font-orbitron)] text-[0.5rem] tracking-wider text-orbital-text-dim mb-1">CAPTION</div>
                        <div className="font-[family-name:var(--font-jetbrains)] text-xs text-orbital-text whitespace-pre-wrap bg-[#111] p-2 min-h-[40px]">
                          {post.caption || <span className="text-orbital-text-dim/40 italic">Sem caption — use a IA pra gerar</span>}
                        </div>
                      </div>

                      {/* Hashtags */}
                      {post.hashtags && (
                        <div>
                          <div className="font-[family-name:var(--font-orbitron)] text-[0.5rem] tracking-wider text-orbital-text-dim mb-1">HASHTAGS</div>
                          <div className="font-[family-name:var(--font-jetbrains)] text-[0.55rem] text-blue-400 bg-[#111] p-2">{post.hashtags}</div>
                        </div>
                      )}

                      {/* AI Buttons */}
                      <div className="flex flex-wrap gap-2">
                        <button disabled={aiLoading[`cap-${post.id}`]} onClick={() => callAI("gerar-caption", { title: post.title, post_type: post.post_type }, `cap-${post.id}`)} className="flex items-center gap-1 px-2 py-1 bg-orbital-purple/10 border border-orbital-purple/30 hover:border-orbital-purple/60 transition-all font-[family-name:var(--font-jetbrains)] text-[0.55rem] text-orbital-purple disabled:opacity-40">
                          {aiLoading[`cap-${post.id}`] ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />} GERAR CAPTION
                        </button>
                        <button disabled={aiLoading[`img-${post.id}`]} onClick={() => callAI("gerar-prompt-imagem", { title: post.title, post_type: post.post_type, caption: post.caption }, `img-${post.id}`)} className="flex items-center gap-1 px-2 py-1 bg-orbital-purple/10 border border-orbital-purple/30 hover:border-orbital-purple/60 transition-all font-[family-name:var(--font-jetbrains)] text-[0.55rem] text-orbital-purple disabled:opacity-40">
                          {aiLoading[`img-${post.id}`] ? <Loader2 size={10} className="animate-spin" /> : <Image size={10} />} PROMPT IMAGEM
                        </button>
                        <button disabled={aiLoading[`hash-${post.id}`]} onClick={() => callAI("gerar-hashtags", { title: post.title, post_type: post.post_type, caption: post.caption }, `hash-${post.id}`)} className="flex items-center gap-1 px-2 py-1 bg-orbital-purple/10 border border-orbital-purple/30 hover:border-orbital-purple/60 transition-all font-[family-name:var(--font-jetbrains)] text-[0.55rem] text-orbital-purple disabled:opacity-40">
                          {aiLoading[`hash-${post.id}`] ? <Loader2 size={10} className="animate-spin" /> : <Hash size={10} />} GERAR HASHTAGS
                        </button>
                      </div>

                      {/* AI Results */}
                      {["cap", "img", "hash"].map(type => {
                        const key = `${type}-${post.id}`;
                        const result = aiResults[key];
                        if (!result) return null;
                        const label = type === "cap" ? "CAPTION GERADA" : type === "img" ? "PROMPT IMAGEM" : "HASHTAGS";
                        const field = type === "cap" ? "caption" : type === "hash" ? "hashtags" : null;
                        return (
                          <motion.div key={key} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-[#111] border border-orbital-purple/30 p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-[family-name:var(--font-orbitron)] text-[0.5rem] tracking-wider text-orbital-purple">{label}</span>
                              <div className="flex gap-1">
                                <button onClick={() => copyText(result, key)} className="flex items-center gap-1 px-1.5 py-0.5 text-[0.5rem] font-[family-name:var(--font-jetbrains)] text-orbital-text-dim hover:text-orbital-text transition-colors">
                                  {copied === key ? <Check size={8} className="text-green-400" /> : <Copy size={8} />} {copied === key ? "COPIADO" : "COPIAR"}
                                </button>
                                {field && (
                                  <button onClick={() => applyToPost(post.id, field, result)} className="flex items-center gap-1 px-1.5 py-0.5 text-[0.5rem] font-[family-name:var(--font-jetbrains)] text-green-400 hover:text-green-300 transition-colors">
                                    <Check size={8} /> APLICAR
                                  </button>
                                )}
                                <button onClick={() => setAiResults(p => { const n = { ...p }; delete n[key]; return n; })} className="p-0.5 text-orbital-text-dim hover:text-orbital-text"><X size={8} /></button>
                              </div>
                            </div>
                            <div className="font-[family-name:var(--font-jetbrains)] text-xs text-orbital-text whitespace-pre-wrap">{result}</div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && <div className="text-center py-8"><Instagram size={24} className="mx-auto text-orbital-text-dim/30 mb-2" /><p className="font-[family-name:var(--font-jetbrains)] text-xs text-orbital-text-dim">Nenhum post encontrado</p></div>}
    </div>
  );
}
