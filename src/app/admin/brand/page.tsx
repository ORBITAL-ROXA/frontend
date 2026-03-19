"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Calendar, Target, TrendingUp, Users, Instagram, DollarSign, CheckCircle2, Circle, Clock, ArrowRight, Bot } from "lucide-react";
import Link from "next/link";

interface Task { id: number; title: string; category: string; priority: string; week: number; week_label: string; week_date: string; done: boolean }
interface Sponsor { id: number; name: string; status: string }
interface Post { id: number; title: string; post_type: string; scheduled_date: string; published: boolean }

export default function BrandDashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/brand/tasks", { credentials: "include" }).then(r => r.ok ? r.json() : { tasks: [] }),
      fetch("/api/brand/sponsors", { credentials: "include" }).then(r => r.ok ? r.json() : { sponsors: [] }),
      fetch("/api/brand/posts", { credentials: "include" }).then(r => r.ok ? r.json() : { posts: [] }),
    ]).then(([t, s, p]) => {
      setTasks(t.tasks || []);
      setSponsors(s.sponsors || []);
      setPosts(p.posts || []);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-orbital-purple border-t-transparent rounded-full animate-spin" /></div>;

  const totalTasks = tasks.length;
  const doneTasks = tasks.filter(t => t.done).length;
  const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  const currentWeek = Math.max(1, ...tasks.filter(t => t.done).map(t => t.week), 1);
  const currentPhase = currentWeek <= 2 ? "FASE 1: PRESENÇA DIGITAL" : currentWeek <= 6 ? "FASE 2: PATROCÍNIO + HYPE" : currentWeek <= 8 ? "FASE 3: CUP #2" : "FASE 4: CAPITALIZAÇÃO";

  const publishedPosts = posts.filter(p => p.published).length;
  const closedSponsors = sponsors.filter(s => s.status === "closed").length;
  const prospectSponsors = sponsors.filter(s => s.status === "prospect").length;

  const weekTasks = tasks.filter(t => t.week === currentWeek);
  const weekDone = weekTasks.filter(t => t.done).length;

  const toggleTask = async (id: number, done: boolean) => {
    await fetch("/api/brand/tasks", {
      method: "PUT", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, done: !done }),
    });
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !done } : t));
  };

  const catColors: Record<string, string> = {
    instagram: "text-pink-400", conteudo: "text-blue-400", negocio: "text-green-400",
    tech: "text-cyan-400", campeonato: "text-yellow-400",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-orbitron)] text-lg tracking-wider text-orbital-text">COMMAND CENTER</h1>
          <p className="font-[family-name:var(--font-jetbrains)] text-xs text-orbital-purple mt-1">{currentPhase}</p>
        </div>
        <div className="text-right">
          <div className="font-[family-name:var(--font-orbitron)] text-2xl text-orbital-purple">{progress}%</div>
          <div className="font-[family-name:var(--font-jetbrains)] text-[0.6rem] text-orbital-text-dim">PROGRESSO GERAL</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-[#111] rounded-full overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 1 }} className="h-full bg-gradient-to-r from-orbital-purple to-purple-400 rounded-full" />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: CheckCircle2, label: "TAREFAS", value: `${doneTasks}/${totalTasks}`, color: "text-green-400" },
          { icon: Instagram, label: "POSTS", value: `${publishedPosts}/${posts.length}`, color: "text-pink-400" },
          { icon: DollarSign, label: "SPONSORS", value: `${closedSponsors} fechados`, sub: `${prospectSponsors} prospects`, color: "text-yellow-400" },
          { icon: Users, label: "SEMANA", value: `${currentWeek}`, sub: `${weekDone}/${weekTasks.length} feitas`, color: "text-cyan-400" },
        ].map((kpi, i) => (
          <div key={i} className="bg-[#0A0A0A] border border-orbital-border p-3">
            <div className="flex items-center gap-2 mb-2">
              <kpi.icon size={14} className={kpi.color} />
              <span className="font-[family-name:var(--font-orbitron)] text-[0.5rem] tracking-wider text-orbital-text-dim">{kpi.label}</span>
            </div>
            <div className="font-[family-name:var(--font-jetbrains)] text-lg text-orbital-text">{kpi.value}</div>
            {kpi.sub && <div className="font-[family-name:var(--font-jetbrains)] text-[0.6rem] text-orbital-text-dim">{kpi.sub}</div>}
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {[
          { href: "/admin/brand/cronograma", icon: Calendar, label: "CRONOGRAMA", desc: "Timeline semanal com tarefas do plano 90 dias", color: "border-green-500/20 hover:border-green-500/40" },
          { href: "/admin/brand/instagram", icon: Instagram, label: "INSTAGRAM", desc: "Calendário de posts + IA cria prompts, captions e hashtags", color: "border-pink-500/20 hover:border-pink-500/40" },
          { href: "/admin/brand/patrocinio", icon: DollarSign, label: "PATROCÍNIOS", desc: "Pipeline de sponsors + IA gera abordagem personalizada", color: "border-yellow-500/20 hover:border-yellow-500/40" },
          { href: "/admin/brand/assistente", icon: Bot, label: "ASSISTENTE IA", desc: "Análise de mercado, concorrentes, posicionamento, sugestões", color: "border-purple-500/20 hover:border-purple-500/40" },
        ].map((link, i) => (
          <Link key={i} href={link.href} className={`bg-[#0A0A0A] border ${link.color} p-4 transition-all group flex items-center gap-3`}>
            <link.icon size={20} className="text-orbital-text-dim group-hover:text-orbital-purple transition-colors" />
            <div className="flex-1">
              <div className="font-[family-name:var(--font-orbitron)] text-[0.6rem] tracking-wider text-orbital-text">{link.label}</div>
              <div className="font-[family-name:var(--font-jetbrains)] text-[0.55rem] text-orbital-text-dim mt-0.5">{link.desc}</div>
            </div>
            <ArrowRight size={14} className="text-orbital-text-dim group-hover:text-orbital-purple transition-colors" />
          </Link>
        ))}
      </div>

      {/* This week tasks */}
      <div className="bg-[#0A0A0A] border border-orbital-border p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-orbital-purple" />
            <span className="font-[family-name:var(--font-orbitron)] text-[0.6rem] tracking-wider text-orbital-text">
              {tasks.find(t => t.week === currentWeek)?.week_label || `SEMANA ${currentWeek}`}
            </span>
          </div>
          <span className="font-[family-name:var(--font-jetbrains)] text-[0.55rem] text-orbital-text-dim">
            {tasks.find(t => t.week === currentWeek)?.week_date}
          </span>
        </div>
        <div className="space-y-1">
          {weekTasks.map(task => (
            <button key={task.id} onClick={() => toggleTask(task.id, task.done)} className={`w-full flex items-center gap-2 px-2 py-1.5 hover:bg-white/5 transition-colors text-left ${task.done ? "opacity-50" : ""}`}>
              {task.done ? <CheckCircle2 size={12} className="text-green-400 shrink-0" /> : <Circle size={12} className="text-orbital-text-dim shrink-0" />}
              <span className={`font-[family-name:var(--font-jetbrains)] text-xs flex-1 ${task.done ? "line-through text-orbital-text-dim" : "text-orbital-text"}`}>{task.title}</span>
              <span className={`font-[family-name:var(--font-jetbrains)] text-[0.5rem] ${catColors[task.category] || "text-orbital-text-dim"}`}>{task.category}</span>
            </button>
          ))}
          {weekTasks.length === 0 && <p className="font-[family-name:var(--font-jetbrains)] text-xs text-orbital-text-dim">Nenhuma tarefa pra esta semana</p>}
        </div>
        <Link href="/admin/brand/cronograma" className="flex items-center gap-1 mt-3 font-[family-name:var(--font-jetbrains)] text-[0.6rem] text-orbital-purple hover:underline">
          Ver cronograma completo <ArrowRight size={10} />
        </Link>
      </div>

      {/* Metas */}
      <div className="bg-[#0A0A0A] border border-orbital-border p-4">
        <div className="flex items-center gap-2 mb-3">
          <Target size={14} className="text-orbital-purple" />
          <span className="font-[family-name:var(--font-orbitron)] text-[0.6rem] tracking-wider text-orbital-text">METAS CUP #2</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { label: "Seguidores IG", now: "0", target: "200" },
            { label: "Times inscritos", now: "0", target: "8-10" },
            { label: "Viewers live", now: "120", target: "200" },
            { label: "Patrocinadores", now: "0", target: "1" },
            { label: "Camisetas", now: "3", target: "10" },
            { label: "Pessoas evento", now: "70", target: "100" },
          ].map((meta, i) => (
            <div key={i} className="flex items-center gap-2">
              <TrendingUp size={10} className="text-orbital-text-dim shrink-0" />
              <div>
                <div className="font-[family-name:var(--font-jetbrains)] text-[0.55rem] text-orbital-text-dim">{meta.label}</div>
                <div className="font-[family-name:var(--font-jetbrains)] text-xs">
                  <span className="text-orbital-text-dim">{meta.now}</span>
                  <span className="text-orbital-text-dim mx-1">→</span>
                  <span className="text-orbital-purple font-bold">{meta.target}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
