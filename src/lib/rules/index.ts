import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { marked } from "marked";

const SETTINGS_KEY = "rules_markdown";

export const DEFAULT_RULES_MD = `# Como funciona o bolão

## A ideia

Cada participante palpita o **placar** dos jogos da Copa antes de cada partida começar.
Quanto mais palpites certeiros, mais pontos você acumula. Ao final do torneio, quem
tiver somado mais pontos leva o prêmio combinado pela empresa.

## Quando os palpites travam

Cada jogo trava **15 minutos antes do apito inicial**. Antes disso, você pode editar
seu palpite quantas vezes quiser — o sistema salva automaticamente conforme você digita.

## Tipos de palpite

- **Jogos da fase de grupos**: 72 partidas, palpitar o placar.
- **Mata-mata**: além do placar, indicar quem se classifica (em caso de empate em 90 min).
- **Especiais**: campeão, vice, 3º lugar, artilheiro, primeira eliminada e seleção surpresa.
  Travam quando o primeiro jogo da Copa começa.

## Pontuação

Os pontos somam todos os jogos finalizados + os palpites especiais. A tabela detalhada
aparece logo abaixo.

## Critérios de desempate

Empates no total são desfeitos pela seguinte ordem:

1. Total de pontos
2. Número de placares exatos
3. Número de vencedores corretos
4. Pontos em palpites especiais
5. Ordem de criação da conta (mais antigo ganha)

## Grupos privados

Você pode criar até 3 grupos privados ("Turma do RH", "Amigos da TI") e convidar colegas
com um código. Cada grupo tem seu próprio ranking interno, sem impacto no ranking geral.

## Privacidade

Seu email é usado apenas para login e notificações que você escolher receber. Você pode
exportar todos os seus dados ou excluir sua conta a qualquer momento na página de perfil.
`;

export async function getRulesMarkdown(): Promise<string> {
  const row = await db.select().from(schema.settings).where(eq(schema.settings.key, SETTINGS_KEY)).limit(1).then((r) => r[0]);
  return row?.value ?? DEFAULT_RULES_MD;
}

export async function saveRulesMarkdown(markdown: string): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  await db.insert(schema.settings).values({ key: SETTINGS_KEY, value: markdown, updatedAt: now }).onConflictDoUpdate({
    target: schema.settings.key,
    set: { value: markdown, updatedAt: now },
  });
}

const ALLOWED_TAGS = new Set([
  "h1", "h2", "h3", "h4", "p", "ul", "ol", "li", "strong", "em", "a", "code", "pre",
  "blockquote", "hr", "br", "table", "thead", "tbody", "tr", "th", "td",
]);

function sanitizeHtml(html: string): string {
  // 1. Remove script/style/iframe blocks completely
  html = html.replace(/<(script|style|iframe|object|embed|svg|math)[\s\S]*?<\/\1>/gi, "");
  // 2. Strip self-closing dangerous tags
  html = html.replace(/<(script|iframe|object|embed)\b[^>]*\/?>/gi, "");
  // 3. Remove on* event handlers and javascript: URIs from any attribute
  html = html.replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");
  html = html.replace(/(href|src)\s*=\s*("javascript:[^"]*"|'javascript:[^']*'|javascript:[^\s>]*)/gi, "");
  // 4. Drop any tag not in the allowlist (keep content)
  html = html.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g, (match, tag: string) => {
    return ALLOWED_TAGS.has(tag.toLowerCase()) ? match : "";
  });
  return html;
}

export function renderMarkdown(md: string): string {
  marked.use({ gfm: true, breaks: true });
  const rawHtml = marked.parse(md, { async: false }) as string;
  return sanitizeHtml(rawHtml);
}
