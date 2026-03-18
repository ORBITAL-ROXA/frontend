"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot, Send, Sparkles, Target, Users, Megaphone, CalendarDays,
  MessageSquare, PenTool, RefreshCw, Copy, Check, Trash2, ChevronRight
} from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const ACTIONS = [
  { id: "analise-perfil", icon: Target, label: "Analisar Perfil", desc: "Bio, feed, tom de voz, primeiros posts" },
  { id: "analise-concorrentes", icon: Users, label: "Analisar Concorrentes", desc: "GamersClub, ESEA, Draft5 e ligas regionais" },
  { id: "sugerir-posts", icon: PenTool, label: "Sugerir Posts", desc: "Próximos 10 posts com caption e horário" },
  { id: "captar-leads", icon: Users, label: "Captar Leads", desc: "Estratégia para atrair jogadores e times" },
  { id: "captar-patrocinadores", icon: Megaphone, label: "Captar Patrocinadores", desc: "15 tipos de empresas pra abordar" },
  { id: "gerar-cronograma", icon: CalendarDays, label: "Gerar Cronograma", desc: "6 semanas de planejamento Cup #2" },
  { id: "revisar-cronograma", icon: RefreshCw, label: "Revisar Cronograma", desc: "Comparar planejado vs feito" },
  { id: "gerar-caption", icon: MessageSquare, label: "Gerar Captions", desc: "5 opções de caption com tons diferentes" },
];

export default function AIPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (userMessage?: string, action?: string) => {
    const text = userMessage || input.trim();
    if (!text && !action) return;

    const newMessages: Message[] = action
      ? [...messages]
      : [...messages, { role: "user" as const, content: text }];

    if (!action) {
      setMessages(newMessages);
      setInput("");
    } else {
      // Show action label as user message
      const actionLabel = ACTIONS.find(a => a.id === action)?.label || action;
      setMessages([...newMessages, { role: "user", content: `🤖 ${actionLabel}` }]);
    }

    setStreaming(true);

    try {
      const res = await fetch("/api/brand/ai", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: action ? [] : newMessages.map(m => ({ role: m.role, content: m.content })),
          action: action || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Erro" }));
        setMessages(prev => [...prev, { role: "assistant", content: `❌ Erro: ${err.error}` }]);
        setStreaming(false);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) {
        setStreaming(false);
        return;
      }

      const decoder = new TextDecoder();
      let assistantText = "";

      // Add empty assistant message
      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter(l => l.startsWith("data: "));

        for (const line of lines) {
          const data = line.slice(6);
          if (data === "[DONE]") break;
          try {
            const parsed = JSON.parse(data);
            if (parsed.text) {
              assistantText += parsed.text;
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: "assistant", content: assistantText };
                return updated;
              });
            }
            if (parsed.error) {
              assistantText += `\n\n❌ ${parsed.error}`;
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: "assistant", content: assistantText };
                return updated;
              });
            }
          } catch { /* skip */ }
        }
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: "assistant", content: `❌ Erro de conexão: ${err instanceof Error ? err.message : "Erro"}` }]);
    }

    setStreaming(false);
    inputRef.current?.focus();
  };

  const copyMessage = (index: number) => {
    const msg = messages[index];
    if (msg) {
      navigator.clipboard.writeText(msg.content);
      setCopied(index);
      setTimeout(() => setCopied(null), 2000);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-orbital-purple/15 border border-orbital-purple/30 flex items-center justify-center">
            <Bot size={16} className="text-orbital-purple" />
          </div>
          <div>
            <h1 className="font-[family-name:var(--font-orbitron)] text-sm tracking-[0.2em] text-white">IA ASSISTANT</h1>
            <p className="font-[family-name:var(--font-jetbrains)] text-[0.55rem] text-white/30">Claude Haiku · Análise e sugestões para a ORBITAL ROXA</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button onClick={clearChat} className="flex items-center gap-1.5 px-3 py-1.5 text-white/30 hover:text-red-400 font-[family-name:var(--font-jetbrains)] text-[0.55rem] transition-all">
            <Trash2 size={12} /> Limpar
          </button>
        )}
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {messages.length === 0 ? (
          <div className="space-y-6">
            {/* Welcome */}
            <div className="text-center py-8">
              <Sparkles size={32} className="text-orbital-purple/30 mx-auto mb-3" />
              <h2 className="font-[family-name:var(--font-orbitron)] text-xs tracking-[0.15em] text-white/50 mb-2">O QUE VOCÊ PRECISA?</h2>
              <p className="font-[family-name:var(--font-jetbrains)] text-[0.6rem] text-white/25">Escolha uma ação ou escreva sua pergunta</p>
            </div>

            {/* Quick actions grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {ACTIONS.map(action => (
                <button
                  key={action.id}
                  onClick={() => sendMessage(undefined, action.id)}
                  disabled={streaming}
                  className="group bg-[#111] border border-[#1A1A1A] p-4 text-left hover:border-orbital-purple/30 transition-all disabled:opacity-30"
                >
                  <action.icon size={16} className="text-orbital-purple mb-2" />
                  <div className="font-[family-name:var(--font-jetbrains)] text-[0.6rem] text-white mb-1">{action.label}</div>
                  <div className="font-[family-name:var(--font-jetbrains)] text-[0.5rem] text-white/25">{action.desc}</div>
                  <ChevronRight size={10} className="text-orbital-purple/0 group-hover:text-orbital-purple/50 mt-2 transition-all" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
                {msg.role === "assistant" && (
                  <div className="w-6 h-6 bg-orbital-purple/15 border border-orbital-purple/30 flex items-center justify-center shrink-0 mt-1">
                    <Bot size={12} className="text-orbital-purple" />
                  </div>
                )}
                <div className={`max-w-[80%] ${msg.role === "user" ? "bg-orbital-purple/10 border border-orbital-purple/20" : "bg-[#111] border border-[#1A1A1A]"} px-4 py-3 relative group`}>
                  <div className={`font-[family-name:var(--font-jetbrains)] text-[0.65rem] leading-relaxed whitespace-pre-wrap ${msg.role === "user" ? "text-orbital-purple" : "text-white/70"}`}>
                    {msg.content || (streaming && i === messages.length - 1 ? (
                      <span className="inline-flex items-center gap-1 text-white/30">
                        <span className="w-1.5 h-1.5 bg-orbital-purple rounded-full animate-pulse" />
                        <span className="w-1.5 h-1.5 bg-orbital-purple rounded-full animate-pulse" style={{ animationDelay: "0.2s" }} />
                        <span className="w-1.5 h-1.5 bg-orbital-purple rounded-full animate-pulse" style={{ animationDelay: "0.4s" }} />
                      </span>
                    ) : "")}
                  </div>
                  {msg.role === "assistant" && msg.content && (
                    <button
                      onClick={() => copyMessage(i)}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white/5"
                    >
                      {copied === i ? <Check size={10} className="text-green-400" /> : <Copy size={10} className="text-white/30" />}
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* Quick actions (compact, when chat active) */}
            {!streaming && (
              <div className="flex flex-wrap gap-1.5 pt-2">
                {ACTIONS.slice(0, 4).map(action => (
                  <button
                    key={action.id}
                    onClick={() => sendMessage(undefined, action.id)}
                    className="flex items-center gap-1 px-2 py-1 bg-[#111] border border-[#1A1A1A] text-white/30 hover:text-orbital-purple hover:border-orbital-purple/20 font-[family-name:var(--font-jetbrains)] text-[0.5rem] transition-all"
                  >
                    <action.icon size={8} /> {action.label}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="shrink-0 border-t border-[#1A1A1A] pt-3">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Pergunte algo sobre a marca, Instagram, patrocínios, cronograma..."
            rows={2}
            disabled={streaming}
            className="flex-1 bg-[#111] border border-[#2A2A2A] text-sm text-white px-4 py-3 focus:border-orbital-purple outline-none font-[family-name:var(--font-jetbrains)] resize-none placeholder:text-white/15 disabled:opacity-40"
          />
          <button
            onClick={() => sendMessage()}
            disabled={streaming || !input.trim()}
            className="px-4 bg-orbital-purple/15 border border-orbital-purple/30 text-orbital-purple hover:bg-orbital-purple/25 disabled:opacity-20 transition-all shrink-0"
          >
            {streaming ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
        <div className="flex items-center justify-between mt-1.5">
          <span className="font-[family-name:var(--font-jetbrains)] text-[0.45rem] text-white/15">Enter para enviar · Shift+Enter para nova linha</span>
          <span className="font-[family-name:var(--font-jetbrains)] text-[0.45rem] text-white/15">Claude Haiku 4.5 · ~$0.001/mensagem</span>
        </div>
      </div>
    </div>
  );
}
