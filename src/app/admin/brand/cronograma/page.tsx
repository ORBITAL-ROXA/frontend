"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Circle, Calendar, Plus, ChevronDown, ChevronUp } from "lucide-react";

interface Task { id: number; title: string; category: string; priority: string; week: number; week_label: string; week_date: string; done: boolean }

const catColors: Record<string, string> = { instagram: "text-pink-400 bg-pink-400/10", conteudo: "text-blue-400 bg-blue-400/10", negocio: "text-green-400 bg-green-400/10", tech: "text-cyan-400 bg-cyan-400/10", campeonato: "text-yellow-400 bg-yellow-400/10" };
const priDot: Record<string, string> = { high: "bg-red-400", med: "bg-yellow-400", low: "bg-gray-500" };

export default function CronogramaPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState<Record<number, boolean>>({});
  const [adding, setAdding] = useState(false);
  const [newTask, setNewTask] = useState({ title: "", category: "conteudo", priority: "med", week: 1 });

  useEffect(() => {
    fetch("/api/brand/tasks", { credentials: "include" }).then(r => r.ok ? r.json() : { tasks: [] }).then(d => { setTasks(d.tasks || []); setLoading(false); });
  }, []);

  const toggleTask = async (id: number, done: boolean) => {
    await fetch("/api/brand/tasks", { method: "PUT", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, done: !done }) });
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !done } : t));
  };

  const addTask = async () => {
    if (!newTask.title.trim()) return;
    const weekInfo = weeks.find(w => w.week === newTask.week);
    const res = await fetch("/api/brand/tasks", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...newTask, week_label: weekInfo?.label || "", week_date: weekInfo?.date || "" }) });
    if (res.ok) {
      const d = await res.json();
      setTasks(prev => [...prev, { ...newTask, id: d.id, week_label: weekInfo?.label || "", week_date: weekInfo?.date || "", done: false }]);
      setNewTask({ title: "", category: "conteudo", priority: "med", week: 1 });
      setAdding(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-orbital-purple border-t-transparent rounded-full animate-spin" /></div>;

  const weeks = [...new Map(tasks.map(t => [t.week, { week: t.week, label: t.week_label, date: t.week_date }])).values()].sort((a, b) => a.week - b.week);
  if (weeks.length === 0) weeks.push({ week: 1, label: "Semana 1", date: "" });

  const totalDone = tasks.filter(t => t.done).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-orbitron)] text-lg tracking-wider text-orbital-text">CRONOGRAMA</h1>
          <p className="font-[family-name:var(--font-jetbrains)] text-xs text-orbital-text-dim mt-1">Plano 90 dias — {totalDone}/{tasks.length} tarefas concluídas</p>
        </div>
        <button onClick={() => setAdding(!adding)} className="flex items-center gap-1 px-3 py-1.5 bg-orbital-purple/10 border border-orbital-purple/30 hover:border-orbital-purple/60 transition-all font-[family-name:var(--font-orbitron)] text-[0.55rem] tracking-wider text-orbital-purple">
          <Plus size={12} /> NOVA TAREFA
        </button>
      </div>

      {/* Add task form */}
      {adding && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="bg-[#0A0A0A] border border-orbital-purple/30 p-4 space-y-3">
          <input value={newTask.title} onChange={e => setNewTask(p => ({ ...p, title: e.target.value }))} placeholder="Título da tarefa..." className="w-full bg-transparent border border-orbital-border p-2 font-[family-name:var(--font-jetbrains)] text-xs text-orbital-text placeholder:text-orbital-text-dim/30 outline-none focus:border-orbital-purple/50" />
          <div className="grid grid-cols-3 gap-2">
            <select value={newTask.category} onChange={e => setNewTask(p => ({ ...p, category: e.target.value }))} className="bg-[#111] border border-orbital-border p-1.5 font-[family-name:var(--font-jetbrains)] text-[0.6rem] text-orbital-text outline-none">
              <option value="instagram">Instagram</option><option value="conteudo">Conteúdo</option><option value="negocio">Negócio</option><option value="tech">Tech</option><option value="campeonato">Campeonato</option>
            </select>
            <select value={newTask.priority} onChange={e => setNewTask(p => ({ ...p, priority: e.target.value }))} className="bg-[#111] border border-orbital-border p-1.5 font-[family-name:var(--font-jetbrains)] text-[0.6rem] text-orbital-text outline-none">
              <option value="high">Alta</option><option value="med">Média</option><option value="low">Baixa</option>
            </select>
            <select value={newTask.week} onChange={e => setNewTask(p => ({ ...p, week: Number(e.target.value) }))} className="bg-[#111] border border-orbital-border p-1.5 font-[family-name:var(--font-jetbrains)] text-[0.6rem] text-orbital-text outline-none">
              {weeks.map(w => <option key={w.week} value={w.week}>Sem {w.week}</option>)}
            </select>
          </div>
          <button onClick={addTask} className="px-4 py-1.5 bg-orbital-purple text-white font-[family-name:var(--font-orbitron)] text-[0.55rem] tracking-wider hover:bg-orbital-purple/80 transition-colors">ADICIONAR</button>
        </motion.div>
      )}

      {/* Weeks */}
      {weeks.map(week => {
        const weekTasks = tasks.filter(t => t.week === week.week);
        const done = weekTasks.filter(t => t.done).length;
        const pct = weekTasks.length > 0 ? Math.round((done / weekTasks.length) * 100) : 0;
        const isCollapsed = collapsed[week.week];

        return (
          <div key={week.week} className="bg-[#0A0A0A] border border-orbital-border overflow-hidden">
            <button onClick={() => setCollapsed(p => ({ ...p, [week.week]: !isCollapsed }))} className="w-full flex items-center gap-3 p-3 hover:bg-white/5 transition-colors text-left">
              <Calendar size={14} className="text-orbital-purple shrink-0" />
              <div className="flex-1">
                <div className="font-[family-name:var(--font-orbitron)] text-[0.6rem] tracking-wider text-orbital-text">{week.label}</div>
                <div className="font-[family-name:var(--font-jetbrains)] text-[0.5rem] text-orbital-text-dim">{week.date}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-[family-name:var(--font-jetbrains)] text-[0.55rem] text-orbital-text-dim">{done}/{weekTasks.length}</span>
                <div className="w-16 h-1.5 bg-[#222] rounded-full overflow-hidden">
                  <div className="h-full bg-orbital-purple rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
                {isCollapsed ? <ChevronDown size={12} className="text-orbital-text-dim" /> : <ChevronUp size={12} className="text-orbital-text-dim" />}
              </div>
            </button>
            {!isCollapsed && (
              <div className="border-t border-orbital-border">
                {weekTasks.map(task => (
                  <button key={task.id} onClick={() => toggleTask(task.id, task.done)} className={`w-full flex items-center gap-2 px-4 py-2 hover:bg-white/5 transition-colors text-left border-b border-orbital-border/50 last:border-0 ${task.done ? "opacity-40" : ""}`}>
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${priDot[task.priority] || "bg-gray-500"}`} />
                    {task.done ? <CheckCircle2 size={14} className="text-green-400 shrink-0" /> : <Circle size={14} className="text-orbital-text-dim shrink-0" />}
                    <span className={`font-[family-name:var(--font-jetbrains)] text-xs flex-1 ${task.done ? "line-through text-orbital-text-dim" : "text-orbital-text"}`}>{task.title}</span>
                    <span className={`px-1.5 py-0.5 text-[0.5rem] font-[family-name:var(--font-jetbrains)] ${catColors[task.category] || "text-orbital-text-dim"}`}>{task.category}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
