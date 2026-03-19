import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { ensureBrandTables } from "../../init-db";
import { checkAdmin } from "../../auth";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || "" });

const SYSTEM = `Você é um agente de inteligência de marketing da ORBITAL ROXA. Responda SEMPRE em português brasileiro. Retorne APENAS JSON válido quando solicitado, sem texto extra, sem markdown code blocks.

BRIEFING COMPLETO DA MARCA:

A Orbital Roxa é uma crew de 4 amigos (nastyy, Vancim, z1k4mem0, loko) de Ribeirão Preto/SP que se conhecem há anos. Começaram como time de CS2, depois criaram uma marca de roupa streetwear (camisetas oversized com referências ao jogo, já tem produtos prontos, venderam 3 no Cup #1), e expandiram pra organização de campeonatos.

O nome vem de um ecstasy famoso no Brasil chamado "Orbital Roxa" — da época que frequentavam raves juntos.

CUP #1 (já realizado):
- LAN house alugada em RP, 10 PCs, 1 jogo por vez, 8 times DE
- 70 pessoas no local, 120 viewers na Twitch
- Custo: R$4.800 (R$2k aluguel + R$2k premiação + R$800 mercado)
- Receita: R$4k inscrições (8x R$500) + venda de comida/camisetas
- Campeão: CHOPPADAS, Vice: DoKuRosa, 14 partidas, 40 jogadores
- Top: leoking_ (1.39 rating), linz1k (1.22), duum (1.19)
- Play of Tournament: Lcszik444- ACE (5K, 4HS, wallbang AK-47)
- Feedbacks muito positivos, comunidade pediu Cup #2

PLATAFORMA PRÓPRIA (orbitalroxa.com.br):
- Stats em tempo real, leaderboard, highlights automáticos, bracket ao vivo
- Pipeline Python que gera highlights das demos automaticamente
- Integração Faceit em desenvolvimento pra campeonatos online

LIMITAÇÕES REAIS (IMPORTANTE - NÃO INVENTAR):
- 10 PCs alugados = máximo 8 times/campeonato (1 jogo por vez)
- 4 pessoas na crew, todos com outras ocupações
- Sem CNPJ (informal)
- ~R$500 de orçamento disponível pro Cup #2
- Sem contatos com patrocinadores
- Instagram @orbitalroxa.gg com 0 posts
- Sem fotos profissionais do evento (só celular)
- Sem experiência formal em marketing

MARCA DE ROUPA:
- Camisetas oversized streetwear com referências a CS2
- Produtos prontos em mãos, sem loja online ainda
- 3 vendas no Cup #1

PATROCÍNIO (o que podem oferecer de verdade):
- Logo no site orbitalroxa.com.br
- Banner nos mapas do servidor CS2
- Banner presencial no evento
- Anúncio na live (120+ viewers)
- Produto à venda no dia

CUP #2:
- Maio 2026, mesmo formato (8 times DE), inscrição R$500/time
- Premiação alvo: R$2k (R$1.5k + R$500)
- Antes: tentar campeonato online via Faceit

VISÃO:
- 6 meses: mais gente, mais procura, Instagram ativo
- 1 ano: 20 PCs (10 próprios + 10 alugados), campeonatos maiores
- 3 anos: espaço físico próprio com bar gamer, 20 PCs, eventos regulares
- Sonho: espaço próprio, bar gamer, marca consolidada

REFERÊNCIAS: Santos Games, Alcans Games, ESL, ESL Brazil
COMUNIDADE: Grupo WhatsApp ativo, jogadores engajados, 16-40 anos
TOM: Informal, comunidade, hype

REGRA FUNDAMENTAL: Nunca sugira algo que a crew não tem capacidade de fazer. Considere SEMPRE as limitações (orçamento, equipe, infraestrutura). Sugestões devem ser realistas e acionáveis com os recursos disponíveis.`;

async function callAI(prompt: string): Promise<string> {
  const msg = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 4096,
    system: SYSTEM,
    messages: [{ role: "user", content: prompt }],
  });
  const block = msg.content[0];
  return block.type === "text" ? block.text : "";
}

function extractJSON(text: string): string {
  // Try to extract JSON from code blocks or raw text
  const codeBlock = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlock) return codeBlock[1].trim();
  // Find first { or [
  const start = text.search(/[{\[]/);
  if (start >= 0) return text.substring(start);
  return text;
}

export async function POST(req: NextRequest) {
  const authError = await checkAdmin(req);
  if (authError) return authError;

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 500 });
  }

  try {
    await ensureBrandTables();
    const { action, config } = await req.json();

    const brandInfo = config
      ? `Marca: Instagram ${config.instagram}, Site: ${config.site}, Região: ${config.region}, Nicho: ${config.niche}. ${config.description}`
      : "ORBITAL ROXA — crew de CS2 em Ribeirão Preto/SP.";

    switch (action) {
      // ═══ STEP 2: ANÁLISE (4 sub-steps) ═══
      case "analise-perfil": {
        const raw = await callAI(`${brandInfo}

Analise o perfil desta marca como analista de marketing. Avalie:
- Presença digital (Instagram, site)
- Identidade visual e tom de comunicação
- Público-alvo aparente
- Primeiras impressões

Retorne um texto de 3-5 parágrafos com a análise. Texto puro, sem JSON.`);
        return NextResponse.json({ result: raw });
      }

      case "analise-site": {
        const raw = await callAI(`${brandInfo}

Analise o site/plataforma desta marca (${config?.site || "orbitalroxa.com.br"}). Avalie:
- Proposta de valor comunicada
- Funcionalidades que diferenciam (stats ao vivo, highlights, leaderboard)
- UX e experiência do visitante
- Pontos fortes e fracos do site como ferramenta de marketing

Retorne um texto de 3-5 parágrafos com a análise. Texto puro, sem JSON.`);
        return NextResponse.json({ result: raw });
      }

      case "analise-concorrentes": {
        const raw = await callAI(`${brandInfo}

Identifique os 5 principais concorrentes/referências desta marca no mercado de ${config?.niche || "CS2/Esports"} na região de ${config?.region || "Ribeirão Preto"} e no Brasil. Para cada um, cite:
- Nome e o que faz
- Presença digital (Instagram, site)
- Ponto forte
- Ponto fraco

Retorne um texto organizado. Texto puro, sem JSON.`);
        return NextResponse.json({ result: raw });
      }

      case "analise-mercado": {
        const raw = await callAI(`${brandInfo}

Analise o posicionamento desta marca no mercado de ${config?.niche || "esports"} em ${config?.region || "Ribeirão Preto"}:
- Onde a marca se encaixa (local vs nacional, casual vs competitivo)
- Tamanho do mercado na região
- Tendências do setor
- Oportunidades inexploradas
- Barreiras de entrada

Retorne um texto de 3-5 parágrafos. Texto puro, sem JSON.`);
        return NextResponse.json({ result: raw });
      }

      // ═══ STEP 3: DIAGNÓSTICO ═══
      case "diagnostico-completo": {
        const raw = await callAI(`${brandInfo}

Crie um diagnóstico SWOT completo desta marca. Retorne APENAS um JSON válido neste formato exato:
{
  "posicionamento": "frase descrevendo o posicionamento atual da marca",
  "nota": 7,
  "forcas": ["força 1", "força 2", "força 3", "força 4"],
  "fraquezas": ["fraqueza 1", "fraqueza 2", "fraqueza 3"],
  "oportunidades": ["oportunidade 1", "oportunidade 2", "oportunidade 3"],
  "ameacas": ["ameaça 1", "ameaça 2", "ameaça 3"],
  "concorrentes": [
    {"nome": "Nome 1", "pontoForte": "o que fazem bem", "oportunidade": "o que podemos explorar"},
    {"nome": "Nome 2", "pontoForte": "o que fazem bem", "oportunidade": "o que podemos explorar"},
    {"nome": "Nome 3", "pontoForte": "o que fazem bem", "oportunidade": "o que podemos explorar"}
  ],
  "resumo": "uma frase resumindo o diagnóstico geral"
}`);
        const parsed = JSON.parse(extractJSON(raw));
        return NextResponse.json({ result: JSON.stringify(parsed) });
      }

      // ═══ STEP 4: PLANO ═══
      case "gerar-plano": {
        const raw = await callAI(`${brandInfo}

Crie um plano estratégico de marketing. Retorne APENAS um JSON válido neste formato exato:
{
  "posicionamento": "frase de posicionamento da marca no mercado",
  "tomDeVoz": "descrição do tom de voz ideal para comunicação",
  "pilares": ["pilar 1", "pilar 2", "pilar 3", "pilar 4", "pilar 5"],
  "cronograma": [
    {"semana": 1, "titulo": "Título da semana", "tarefas": ["tarefa 1", "tarefa 2", "tarefa 3", "tarefa 4", "tarefa 5"]},
    {"semana": 2, "titulo": "Título", "tarefas": ["tarefa 1", "tarefa 2", "tarefa 3", "tarefa 4"]},
    {"semana": 3, "titulo": "Título", "tarefas": ["tarefa 1", "tarefa 2", "tarefa 3", "tarefa 4"]},
    {"semana": 4, "titulo": "Título", "tarefas": ["tarefa 1", "tarefa 2", "tarefa 3", "tarefa 4"]},
    {"semana": 5, "titulo": "Título", "tarefas": ["tarefa 1", "tarefa 2", "tarefa 3"]},
    {"semana": 6, "titulo": "Título", "tarefas": ["tarefa 1", "tarefa 2", "tarefa 3"]}
  ]
}
Use 6 semanas. Cada semana com 3-5 tarefas específicas e acionáveis.`);
        const parsed = JSON.parse(extractJSON(raw));
        return NextResponse.json({ result: JSON.stringify(parsed) });
      }

      // ═══ STEP 5: CONTEÚDO ═══
      case "gerar-conteudo": {
        const raw = await callAI(`${brandInfo}

Crie 10 posts prontos para Instagram. Retorne APENAS um JSON array neste formato exato:
[
  {"title": "Título do post", "type": "feed", "day": "Segunda", "time": "19:30", "caption": "Caption completa com emojis e CTA", "hashtags": "#hashtag1 #hashtag2 #hashtag3"},
  {"title": "Outro post", "type": "reel", "day": "Sábado", "time": "14:00", "caption": "Caption...", "hashtags": "#tags..."}
]

Tipos: feed (máx 1/dia), story, reel.
Horários: Feed 19:30 (Ter/Qua/Sex), Reel 14:00 (Sáb), Story (outros dias).
Use dados reais quando possível. Captions completas prontas pra copiar e colar.
Inclua CTA em cada post. Máximo 15 hashtags por post.
Gere exatamente 10 posts variados.`);
        const parsed = JSON.parse(extractJSON(raw));
        return NextResponse.json({ result: JSON.stringify(parsed) });
      }

      default:
        return NextResponse.json({ error: "Ação desconhecida: " + action }, { status: 400 });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro";
    console.error("[AI EXECUTE]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
