import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { dbPool } from "@/lib/tournaments-db";
import { ensureBrandTables } from "../init-db";
import { checkAdmin } from "../auth";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || "" });

const SYSTEM_PROMPT = `Você é o assistente de IA da ORBITAL ROXA, uma crew de produção de campeonatos de CS2 baseada em Ribeirão Preto — SP.

CONTEXTO DA MARCA:
- A Orbital Roxa organiza campeonatos presenciais e online de CS2
- Já realizou o Cup #1 com 40 jogadores, 8 times, 60+ presenciais, 120 pico live
- Plataforma própria: orbitalroxa.com.br (stats, leaderboard, highlights, bracket ao vivo)
- Instagram: @orbitalroxa (em construção)
- Público-alvo: gamers de CS2, 18-35 anos, região de Ribeirão Preto/Interior SP
- Estilo visual: sci-fi/cyberpunk, preto com roxo (#A855F7), fontes Orbitron e JetBrains Mono
- Próximo evento: Cup #2 (~Maio 2026), meta 80 jogadores, 16 times

DADOS REAIS DO CUP #1:
- Campeão: CHOPPADAS (iguizik-, hoppe, leoking_, sabiahzera, linz1k)
- Vice: DoKuRosa | 3º: ORBITAL ROXA
- Grand Final: CHOPPADAS 2x0 DoKuRosa (Mirage 13:10, Inferno 13:11)
- Top 5: leoking_ (1.39), linz1k (1.22), duum (1.19), pdX (1.15), nastyy (1.14)
- Play of Tournament: Lcszik444- ACE (5K, 4HS, wallbang AK-47, score 243)
- Formato: Double Elimination, 14 partidas, duração 08h-01h40
- Receita: R$4k (8x R$500 inscrição), Aluguel: R$2k, Premiação: R$2k

PACOTES DE PATROCÍNIO:
- Bronze R$500: logo no site + menção na live + story
- Prata R$1.000: + banner servidor + banner evento + post dedicado + logo crachá
- Ouro R$2.000+: + nome no torneio + espaço divulgação + fotos pódio + relatório

Responda SEMPRE em português brasileiro. Seja direto, prático e focado em resultados. Use a identidade visual da marca nas sugestões. Formate respostas em markdown quando apropriado.`;

// Fetch brand context from DB
async function getBrandContext() {
  try {
    await ensureBrandTables();
    const [tasks] = await dbPool.execute("SELECT title, category, done, week FROM brand_tasks ORDER BY week");
    const [checks] = await dbPool.execute("SELECT title, category, done FROM brand_checklist ORDER BY sort_order");
    const [sponsors] = await dbPool.execute("SELECT name, type, estimated_value, status FROM brand_sponsors");
    const [posts] = await dbPool.execute("SELECT title, post_type, scheduled_date, published FROM brand_posts ORDER BY scheduled_date");

    const taskList = tasks as { title: string; category: string; done: boolean; week: number }[];
    const checkList = checks as { title: string; category: string; done: boolean }[];
    const sponsorList = sponsors as { name: string; type: string; estimated_value: string; status: string }[];
    const postList = posts as { title: string; post_type: string; scheduled_date: string; published: boolean }[];

    const doneTasks = taskList.filter(t => t.done).length;
    const doneChecks = checkList.filter(c => c.done).length;
    const publishedPosts = postList.filter(p => p.published).length;

    return `
ESTADO ATUAL DO BRAND MANAGER:
- Tarefas: ${doneTasks}/${taskList.length} concluídas
- Checklist: ${doneChecks}/${checkList.length} concluídos
- Posts planejados: ${postList.length} (${publishedPosts} publicados)
- Sponsors: ${sponsorList.map(s => `${s.name} (${s.status})`).join(", ")}
- Posts não publicados: ${postList.filter(p => !p.published).map(p => `${p.title} (${p.post_type}, ${p.scheduled_date || "sem data"})`).join("; ")}
- Tasks pendentes: ${taskList.filter(t => !t.done).map(t => `[S${t.week}] ${t.title}`).join("; ")}
`;
  } catch {
    return "";
  }
}

export async function POST(req: NextRequest) {
  const authError = await checkAdmin(req);
  if (authError) return authError;

  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }

  try {
    const { messages, action } = await req.json();

    // Build context
    const brandContext = await getBrandContext();

    // Pre-defined actions add context to the user message
    let userMessages = messages;
    if (action && messages.length === 0) {
      const actionPrompts: Record<string, string> = {
        "analise-perfil": "Analise o perfil @orbitalroxa no Instagram (em construção). Com base no contexto da marca, sugira: nome ideal da bio, descrição, link, destaques, estética do feed, tom de voz, e os primeiros 10 posts que devemos fazer. Considere nosso público gamer de CS2 no interior de SP.",
        "analise-concorrentes": "Liste e analise os principais concorrentes/referências de torneios de CS2 no Brasil que têm presença forte no Instagram. Compare com a Orbital Roxa e sugira o que podemos aprender de cada um. Foque em: GamersClub, ESEA Brasil, Draft5, Gamers Academy, e ligas regionais.",
        "sugerir-posts": `Com base nos posts já planejados e no calendário atual, sugira os próximos 10 posts para o Instagram da @orbitalroxa. Para cada post, inclua: tipo (Feed/Reel/Story), título, melhor horário, caption completa com hashtags, e justificativa estratégica.${brandContext}`,
        "captar-leads": "Sugira uma estratégia completa para captação de leads (jogadores, times, comunidades) para o Cup #2. Inclua: canais (WhatsApp, Discord, Instagram, presencial), mensagens-tipo para cada canal, timeline de divulgação, e métricas de acompanhamento. Foque na região de Ribeirão Preto, Franca e Araraquara.",
        "captar-patrocinadores": `Sugira 15 tipos de empresas/marcas locais e nacionais que seriam bons patrocinadores para a Orbital Roxa. Para cada uma: nome/tipo, por que faz sentido, valor estimado, como abordar (WhatsApp/email/presencial), e pitch de 2 linhas. Considere o contexto de Ribeirão Preto — SP.${brandContext}`,
        "gerar-cronograma": `Crie um cronograma detalhado de 6 semanas para o lançamento do Cup #2. Para cada semana: objetivo principal, 5-7 tarefas específicas com categoria (instagram/conteudo/negocio/tech/campeonato) e prioridade (alta/media/baixa). Considere o estado atual do brand manager.${brandContext}`,
        "revisar-cronograma": `Revise o cronograma atual e compare com o que já foi feito. Identifique: tarefas atrasadas, gargalos, próximas prioridades, e sugira ajustes. Seja específico.${brandContext}`,
        "gerar-caption": "Gere 5 opções de caption para o próximo post do Instagram da @orbitalroxa. Varie o tom: 1) profissional/sério, 2) hype/empolgado, 3) misterioso/teaser, 4) informativo com stats, 5) casual/comunidade. Cada caption deve ter hashtags apropriadas (máximo 15).",
      };

      const prompt = actionPrompts[action];
      if (prompt) {
        userMessages = [{ role: "user", content: prompt }];
      }
    }

    if (!userMessages || userMessages.length === 0) {
      return new Response(JSON.stringify({ error: "No messages" }), { status: 400, headers: { "Content-Type": "application/json" } });
    }

    // Add brand context to the first user message if not an action
    if (!action && brandContext) {
      const firstMsg = userMessages[0];
      if (firstMsg.role === "user") {
        userMessages = [
          { ...firstMsg, content: `${firstMsg.content}\n\n[CONTEXTO ATUAL]${brandContext}` },
          ...userMessages.slice(1),
        ];
      }
    }

    // Stream response
    const stream = client.messages.stream({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: userMessages.map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (event.type === "content_block_delta" && "delta" in event && "text" in event.delta) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`));
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (err) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: err instanceof Error ? err.message : "Erro" })}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro";
    return new Response(JSON.stringify({ error: message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}
