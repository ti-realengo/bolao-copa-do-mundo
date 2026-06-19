# PRD — Bolão Corporativo Copa do Mundo 2026

> **Projeto open-source de bolão fechado para empresas usarem como ferramenta de endomarketing durante a Copa do Mundo FIFA 2026.**
> Stack 100% Cloudflare · Single-tenant · Deploy em 1 clique · MIT License

---

## 1. Visão geral

### 1.1 Contexto e oportunidade

A Copa do Mundo FIFA 2026 acontece entre 11 de junho e 19 de julho de 2026, sediada por EUA, Canadá e México, com formato inédito de **48 seleções divididas em 12 grupos** e uma nova fase de mata-mata (Rodada de 32). É o maior torneio da história, com 104 jogos e 39 dias de competição — uma janela perfeita de engajamento contínuo dentro de empresas.

Bolões corporativos são uma das ferramentas de endomarketing mais eficazes em períodos de Copa: criam conversa transversal entre áreas, geram conteúdo orgânico interno, e oferecem motivo legítimo para interações que normalmente não ocorreriam. O problema é que, hoje, equipes de RH e Comunicação dependem de planilhas Excel ou ferramentas pagas e genéricas.

### 1.2 Proposta

Plataforma web open-source, gratuita, white-label e instalável em poucos cliques, que permita a qualquer empresa criar e operar seu próprio bolão fechado da Copa 2026 — com autenticação restrita ao domínio corporativo, ranking, grupos internos, gamificação e premiação.

### 1.3 Princípios de produto

1. **Zero fricção pro usuário final**: login por email + senha, cadastro restrito ao domínio corporativo.
2. **Zero fricção pro admin**: deploy em 1 clique, configuração guiada, paineis self-service.
3. **Single-tenant por design**: cada empresa instala sua própria cópia. Dados nunca cruzam entre empresas.
4. **Cloudflare-first**: stack inteira em um único provedor, free tier acomoda empresas até ~10k funcionários.
5. **LGPD/GDPR ready**: consentimento explícito, direito ao esquecimento, exportação de dados, política customizável.
6. **Internacionalizável**: pt-BR como padrão, mas i18n preparado pra es e en.
7. **Sem aposta financeira**: prêmios são definidos e entregues pela empresa fora do sistema. A plataforma nunca movimenta dinheiro.

### 1.4 Não-objetivos (MVP)

- Não cobre outros torneios (Brasileirão, Eurocopa, Libertadores) — embora a modelagem seja preparada pra isso no futuro.
- Não cobre Copa do Mundo Feminina ou edições anteriores.
- Não tem app mobile nativo (PWA cobre o uso móvel).
- Não tem SSO corporativo (Google Workspace, Azure AD) no MVP — fica no roadmap v2.
- Não suporta múltiplas empresas no mesmo deploy (multi-tenant).
- Não tem magic link auth — implementado como email + senha. Magic link pode ser adicionado futuramente.

---

## 2. Personas

### 2.1 Superadmin (RH/Comunicação)
Profissional de RH, Comunicação Interna ou Marketing da empresa que instala e configura o bolão. Tem perfil mais administrativo que técnico — precisa conseguir customizar regras, prêmios, identidade visual e domínios sem mexer em código. Usa o painel admin algumas vezes por semana durante a Copa.

### 2.2 Participante (Funcionário)
Colaborador da empresa que entra pra palpitar, competir com colegas e tentar ganhar o prêmio. Acessa pelo celular na maior parte do tempo, geralmente em momentos curtos (manhã, almoço, antes dos jogos). Pode ou não entender de futebol — a UX precisa ser óbvia pros dois perfis.

### 2.3 Admin de grupo privado
Participante que cria um grupo fechado pra disputar com colegas próximos ("turma do RH", "amigos da TI"). Pode convidar, expulsar e ver ranking interno do grupo, mas não tem privilégios sobre o bolão geral.

### 2.4 Mantenedor / contribuidor open-source
Desenvolvedor externo que clona o repositório pra usar na própria empresa, ou que contribui com features e correções. Espera documentação clara, deploy reproduzível e código bem estruturado.

---

## 3. Arquitetura técnica

### 3.1 Stack consolidada

| Camada | Tecnologia | Função |
|---|---|---|
| Frontend | **Next.js 15 (App Router)** + **TypeScript** + **Tailwind CSS** + **shadcn/ui** | Pages do bolão, painel admin, painel do usuário |
| Backend / API | **Next.js API Routes** (App Router) | Endpoints REST, lógica de negócio, crons |
| Hospedagem | **Cloudflare Workers** (via OpenNext) | Deploy único, SSR + API + crons |
| Banco de dados | **Cloudflare D1** (SQLite) | Dados transacionais (usuários, palpites, jogos) |
| Storage de arquivos | **Cloudflare R2** | Fotos de perfil, logo da empresa, OG images, prêmios |
| Cache / sessões | **Cloudflare KV** | Sessões, rate limit |
| Cron jobs | **Cloudflare Cron Triggers** | Sync de resultados, lembretes, recap |
| Email transacional | **Resend** (opcional) | Lembretes, recaps, broadcasts |
| API de resultados | **Football-Data.org** (primária) + edição manual no admin | Resultados em tempo real |
| ORM | **Drizzle ORM** | Type-safe queries em D1 |
| Auth | **Email + senha (scrypt)** com sessões por cookie httpOnly | Login, cadastro por domínio |
| i18n | **Sistema próprio** (`t()` + dicionários tipados) | pt-BR, en, es |
| Observabilidade | **Cloudflare Analytics** | Métricas e logs |

### 3.2 Diagrama lógico

```
                     ┌──────────────────────┐
                     │  Funcionário (PWA)   │
                     └──────────┬───────────┘
                                │ HTTPS
                                ▼
                 ┌──────────────────────────────┐
                 │ Cloudflare Workers (Next.js) │
                 │   - SSR + Static Assets      │
                 │   - /api/cron/*              │
                 │   - /api/export-data          │
                 │   - /api/upload/*             │
                 │   - /api/og/*                │
                 └──────────┬───────────────────┘
                            │
              ┌─────────────┼─────────────┐
              │             │             │
         ┌────┴────┐   ┌────┴────┐   ┌────┴────┐
         │    D1  │   │    KV    │   │    R2   │
         │(SQLite)│   │ (Cache)  │   │ (Files) │
         └─────────┘   └─────────┘   └─────────┘
              ▲               ▲
              │               │
    ┌─────────┴───────────────┴────────────┐
    │  Cron Triggers (Cloudflare Workers)  │
    │  - Sync resultados (a cada 5min)     │
    │  - Cálculo de pontos                 │
    │  - Lembretes + recap por email       │
    └────────┬─────────────────────────────┘
             │
     ┌───────┴────────┐
     │                  │
┌────┴─────┐     ┌─────┴─────┐
│Football-│     │  Resend   │
│Data.org │     │ (emails)  │
└─────────┘     └───────────┘
```

### 3.3 Custo estimado (Cloudflare free tier)

Para uma empresa com até ~5.000 funcionários ativos durante a Copa:

- **Workers**: 100k requisições/dia gratuitas — suficiente.
- **D1**: 5M reads/dia gratuitos, 100k writes/dia — suficiente.
- **KV**: 100k reads/dia, 1k writes — suficiente para sessões.
- **R2**: 10GB storage grátis — sobra pra fotos de perfil.
- **Pages**: 500 builds/mês — suficiente.
- **Resend**: 3k emails/mês grátis (pode precisar de upgrade pra empresas grandes — ~US$ 20/mês cobre 50k emails).

**Custo total esperado pra empresas pequenas/médias: R$ 0/mês.**
Empresas grandes (>10k usuários): ~US$ 20–50/mês (apenas email).

---

## 4. Modelo de dados (D1)

### 4.1 Tabelas principais

```sql
-- Configuração global da instância
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);
-- Ex: company_name, primary_color, logo_url, rules_html, prizes_json,
--     allowed_domains_json, prediction_deadline_hours, timezone

-- Domínios permitidos (gerenciado pelo superadmin)
CREATE TABLE allowed_domains (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  domain TEXT UNIQUE NOT NULL, -- ex: 'minhaempresa.com.br'
  is_wildcard INTEGER DEFAULT 0, -- subdomínios? '*.minhaempresa.com.br'
  created_at INTEGER NOT NULL
);

-- Usuários
CREATE TABLE users (
  id TEXT PRIMARY KEY, -- UUID
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT, -- R2 URL
  phone TEXT,
  role TEXT DEFAULT 'participant', -- 'participant' | 'superadmin'
  password_hash TEXT NOT NULL, -- scrypt hash para todos os usuários
  password_must_change INTEGER DEFAULT 0,
  email_prefs_json TEXT DEFAULT '{}', -- preferências de notificação
  consent_lgpd INTEGER DEFAULT 0,
  consent_lgpd_at INTEGER,
  created_at INTEGER NOT NULL,
  last_login_at INTEGER,
  deleted_at INTEGER -- soft delete (LGPD)
);

-- Sessões
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  user_agent TEXT,
  ip_hash TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Magic links (one-time) — previsto para v2, não implementado no MVP
-- CREATE TABLE magic_links (
--   token_hash TEXT PRIMARY KEY,
--   email TEXT NOT NULL,
--   expires_at INTEGER NOT NULL,
--   used_at INTEGER,
--   ip_hash TEXT
-- );

-- Seleções
CREATE TABLE teams (
  id INTEGER PRIMARY KEY,
  code TEXT UNIQUE NOT NULL, -- 'BRA', 'ARG'
  name_pt TEXT NOT NULL,
  name_en TEXT NOT NULL,
  name_es TEXT NOT NULL,
  flag_url TEXT,
  group_code TEXT -- 'A' a 'L' na fase de grupos
);

-- Jogos
CREATE TABLE matches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  external_id TEXT UNIQUE, -- ID na API de resultados
  stage TEXT NOT NULL, -- 'group', 'r32', 'r16', 'qf', 'sf', '3rd', 'final'
  group_code TEXT, -- 'A'..'L' se stage=group
  round INTEGER, -- rodada da fase de grupos (1, 2, 3)
  home_team_id INTEGER,
  away_team_id INTEGER,
  scheduled_at INTEGER NOT NULL,
  venue TEXT,
  status TEXT DEFAULT 'scheduled', -- 'scheduled' | 'live' | 'finished' | 'cancelled' | 'postponed'
  home_score INTEGER,
  away_score INTEGER,
  home_score_et INTEGER, -- prorrogação
  away_score_et INTEGER,
  home_score_pen INTEGER, -- pênaltis
  away_score_pen INTEGER,
  winner_team_id INTEGER, -- útil pro mata-mata
  finished_at INTEGER,
  FOREIGN KEY (home_team_id) REFERENCES teams(id),
  FOREIGN KEY (away_team_id) REFERENCES teams(id)
);

-- Palpites
CREATE TABLE predictions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  match_id INTEGER NOT NULL,
  home_score INTEGER NOT NULL,
  away_score INTEGER NOT NULL,
  advancing_team_id INTEGER, -- mata-mata: quem passa de fase
  points INTEGER, -- preenchido após cálculo
  is_exact INTEGER DEFAULT 0,
  is_winner_correct INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(user_id, match_id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (match_id) REFERENCES matches(id)
);

-- Palpites especiais (pré-Copa)
CREATE TABLE special_predictions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL UNIQUE,
  champion_team_id INTEGER,
  runnerup_team_id INTEGER,
  third_team_id INTEGER,
  top_scorer_name TEXT,
  first_eliminated_team_id INTEGER,
  surprise_team_id INTEGER,
  points INTEGER DEFAULT 0,
  locked_at INTEGER, -- congelado quando começa o 1º jogo
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Grupos privados
CREATE TABLE leagues (
  id TEXT PRIMARY KEY, -- nanoid
  name TEXT NOT NULL,
  description TEXT,
  owner_id TEXT NOT NULL,
  invite_code TEXT UNIQUE NOT NULL,
  is_open INTEGER DEFAULT 1, -- aberto pra qualquer um com link?
  max_members INTEGER DEFAULT 50,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (owner_id) REFERENCES users(id)
);

CREATE TABLE league_members (
  league_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  joined_at INTEGER NOT NULL,
  PRIMARY KEY (league_id, user_id),
  FOREIGN KEY (league_id) REFERENCES leagues(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Conquistas/badges
CREATE TABLE achievements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  badge_code TEXT NOT NULL, -- 'taroLogo', 'streak5', 'madrugador', etc
  unlocked_at INTEGER NOT NULL,
  match_id INTEGER, -- opcional
  UNIQUE(user_id, badge_code),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Auditoria
CREATE TABLE audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT,
  action TEXT NOT NULL, -- 'login', 'admin.update_settings', etc
  target TEXT,
  metadata_json TEXT,
  ip_hash TEXT,
  created_at INTEGER NOT NULL
);

-- Notificações por email (controle de envio)
CREATE TABLE email_dispatches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  template TEXT NOT NULL,
  context_json TEXT,
  sent_at INTEGER,
  status TEXT DEFAULT 'pending',
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Ranking materializado (atualizado por job, não por trigger)
CREATE TABLE rankings_snapshot (
  user_id TEXT PRIMARY KEY,
  total_points INTEGER NOT NULL DEFAULT 0,
  exact_count INTEGER NOT NULL DEFAULT 0,
  winner_count INTEGER NOT NULL DEFAULT 0,
  special_points INTEGER NOT NULL DEFAULT 0,
  position INTEGER,
  position_change INTEGER, -- diff vs snapshot anterior
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### 4.2 Seed inicial (Copa 2026)

O repositório virá com seeds prontos contendo:

- **48 seleções** com nomes em pt-BR, en, es e bandeiras (CDN público).
- **72 jogos da fase de grupos** com datas, horários (UTC) e estádios.
- Os jogos do mata-mata serão criados automaticamente conforme a fase de grupos avança (via job ou via dashboard admin).

**Grupos da Copa 2026 (referência):**

| Grupo | Seleções |
|---|---|
| A | México, África do Sul, Coreia do Sul, República Tcheca |
| B | Canadá, ... |
| C | **Brasil**, Marrocos, Haiti, Escócia |
| ... | ... |
| L | Inglaterra, Croácia, Gana, Panamá |

> Seed completo será populado ao confirmar grupos finais (chaveamento concluído em 5/12/2025, com as repescagens definidas em março de 2026).

---

## 5. Funcionalidades — MVP detalhado

### 5.1 Autenticação

#### 5.1.1 Login do participante (email + senha)

> **Nota de implementação:** O MVP foi entregue com email + senha (sem magic link). O fluxo de magic link permanece no roadmap como melhoria futura.

1. Usuário acessa `/cadastro`, preenche nome, email e senha.
2. Sistema valida que o domínio do email está em `allowed_domains`. Se não, exibe erro genérico (sem revelar se o domínio está ou não permitido — evita enumeração).
3. Senha armazenada com hash scrypt (adaptado do Next.js Auth Helpers).
4. Sessão via cookie httpOnly, SameSite=Lax, 30 dias.
5. Se primeiro login (primeiro cadastro do sistema): o usuário vira `superadmin` automaticamente e o domínio é adicionado à allowlist.
6. Superadmin pode resetar senha de qualquer participante no painel admin — gera senha temporária, participante é forçado a trocar no próximo login.

**Rate limiting**: máximo 5 tentativas de login por email a cada 15 min. Mensagem genérica em caso de bloqueio.

#### 5.1.2 Login do superadmin

1. Mesmo fluxo de email + senha.
2. Primeiro usuário a se cadastrar vira superadmin automaticamente.
3. Superadmin pode resetar senhas de participantes via painel admin — o participante é forçado a definir uma nova senha no próximo login.

### 5.2 Cadastro de domínios permitidos ✅

- Painel admin com lista de domínios. ✅
- Suporte a **wildcard** opcional (`*.empresa.com.br` aceita `marketing.empresa.com.br`). ✅
- Validação: regex de domínio válido, sem espaços, lowercase. ✅
- Mínimo 1 domínio obrigatório pro sistema funcionar. ✅

### 5.3 Palpites ✅

#### 5.3.1 Palpites de jogos ✅

**Tela `/jogos`**:
- Lista de jogos agrupados por **dia** (não por rodada — UX mais natural no celular). ✅
- Jogos de hoje aparecem primeiro, jogos passados no topo. ✅
- Cada card: bandeiras + nome dos times, horário local, estádio, status, campos numéricos pra placar. ✅
- Indicador visual: `aberto pra palpite` / `palpite registrado` / `congelado`. ✅
- Auto-save a cada mudança (debounce 800ms) — sem botão "salvar". ✅
- Mata-mata: além do placar, dropdown "quem se classifica" (pra empate em 90min). ✅

**Deadline**: configurável pelo superadmin. Padrão sugerido: **15 minutos antes do início do jogo**. ✅

**Default sem palpite**: se o usuário não palpitou, conta como **não-palpite** (0 pontos), nunca como 0×0. ✅

**Edição**: livre até o deadline. ✅

#### 5.3.2 Palpites especiais (pré-Copa) ✅

Tela `/palpites-especiais`, disponível desde a abertura até o início do 1º jogo:
- Campeão (5 pts). ✅
- Vice (3 pts). ✅
- 3º lugar (2 pts). ✅
- Artilheiro (texto livre, validação manual pelo admin pós-Copa) (3 pts). ✅
- Primeira seleção eliminada na fase de grupos (2 pts). ✅
- Seleção surpresa - chega às quartas sendo de pote 3 ou 4 (3 pts). ✅

Após o 1º jogo (`locked_at` preenchido), tela vira somente leitura. ✅

Admin pode editar resultados reais em `/admin/resultados-especiais`. ✅

### 5.4 Sistema de pontuação ✅

#### 5.4.1 Regras ✅

| Cenário | Pontos |
|---|---|
| Placar exato | **3** |
| Vencedor correto OU empate (placar errado) | **1** |
| Erro completo | 0 |
| Palpite especial: campeão | 5 |
| Palpite especial: vice | 3 |
| Palpite especial: 3º lugar | 2 |
| Palpite especial: artilheiro | 3 |
| Palpite especial: primeira eliminada | 2 |
| Palpite especial: surpresa | 3 |
| Mata-mata: acertou quem passou (se errou placar) | +1 bônus |

> Todos os pesos são configuráveis pelo admin em `/admin/regras`.

> Para mata-mata, considerar resultado do **tempo normal** pro placar exato. Quem se classifica conta separado (resolve por pênaltis).

#### 5.4.2 Cálculo ✅

Disparado quando o cron de sync marca um jogo como `finished`:
1. Worker lê todos os palpites do jogo. ✅
2. Calcula pontos de cada um, atualiza `predictions.points` e flags. ✅
3. Atualiza `rankings_snapshot` (recalc completo). ✅
4. Dispara badges aplicáveis (job paralelo). ✅
5. Recálculo de palpites especiais quando admin define resultados reais. ✅

#### 5.4.3 Critérios de desempate (ranking) ✅

Cascata configurável pelo admin, mas com default sensato:
1. Total de pontos
2. Número de placares exatos
3. Número de vencedores corretos
4. Pontos em palpites especiais
5. Ordem de criação da conta (mais antigo ganha)

Todos implementados em `refreshRankingsSnapshot()`. ✅

### 5.5 Rankings ✅ (parcial)

Tela `/ranking` com visualizações:
- **Geral**: top 100 + posição do usuário logado destacada (mesmo se fora do top 100). ✅
- **Por grupo privado**: ranking interno do grupo (visível só pros membros). ✅
- **Por rodada**: ranking calculado só com pontos da rodada selecionada. ❌ (não implementado)

Cada linha mostra: posição, avatar, nome, pontos, indicador de subida/queda (`↑3`, `↓2`, `–`), placares exatos.

Cache de 60s no KV pra evitar pressão no D1 em momentos de pico.

### 5.6 Grupos privados (leagues) ✅

- Qualquer participante pode criar até **3 grupos**. ✅
- Criação: nome, descrição. ✅
- Sistema gera **invite code** e link compartilhável. ✅
- Configurações: grupo aberto (qualquer um com link entra). ✅
- Limite default: 50 membros. ✅
- Owner pode: renomear, expulsar membros. ❌ (transferir ownership não implementado)
- Ranking interno do grupo. ✅
- Sem aposta financeira de qualquer tipo (proibido em UI e termos de uso). ✅

### 5.7 Perfil do usuário ✅

Tela `/perfil`:
- Foto (upload pra R2, redimensionado em Worker pra 256×256 webp). ✅
- Nome de exibição (mostrado no ranking). ✅
- Telefone (opcional, útil pra contato em caso de premiação). ✅
- Email (read-only — fonte da verdade). ✅
- Estatísticas pessoais: total pts, placares exatos, %acerto, ranking geral, badges. ✅
- Histórico de palpites. ✅
- Preferências de email (lembretes, recap, broadcast). ✅
- Botão "exportar meus dados" (LGPD). ✅
- Botão "excluir minha conta" (LGPD — soft delete). ✅

### 5.8 Página de regras (customizável) ✅

- Rota fixa: `/regras`. ✅
- Conteúdo armazenado em `settings.rules_html` (markdown editor no admin). ✅
- Renderização sanitizada. ✅

### 5.9 Página de prêmios (customizável) ✅

- Rota fixa: `/premios`. ✅
- Definida pelo superadmin: quantidade de ganhadores + descrição + imagem de cada prêmio. ✅
- Upload de imagens de prêmios para R2. ✅
- Pode definir prêmios extras (rodada com mais pontos, etc). ✅

### 5.10 Painel do superadmin ✅

Rota `/admin/*`. Seções:

| Seção | Funcionalidades | Status |
|---|---|---|
| Dashboard | KPIs: usuários ativos, % palpites preenchidos, jogos próximos | ✅ |
| Configurações | Nome empresa, logo, cores, idioma, fuso, deadline padrão, regras de pontuação | ✅ |
| Domínios | CRUD de domínios permitidos (com wildcard) | ✅ |
| Usuários | Lista, busca, reset de senha, excluir (LGPD) | ✅ |
| Jogos | Sync manual via API, editar jogos, recompute scores | ✅ |
| Resultados especiais | Definir campeão, vice, 3º, artilheiro, eliminada, surpresa reais | ✅ |
| Regras | Editor markdown + editor de pontuação | ✅ |
| Prêmios | CRUD de prêmios com upload de imagem | ✅ |
| Broadcast | Enviar email pra todos os participantes | ✅ |
| Auditoria | Log filtrado por ação/usuário/data | ✅ |
| Observabilidade | Log de emails, ações recentes, health | ✅ |

### 5.11 Notificações por email ✅

Templates (Resend):
- **Lembrete de palpite** (12h antes de jogos sem palpite). ✅
- **Resultado da rodada** (após último jogo do dia). ✅
- **Broadcast admin** (avisos institucionais). ✅

 Frequência configurável pelo usuário em `/perfil` → preferências. ✅

Sem Resend: o app funciona normalmente, emails são logados no console. ✅

### 5.12 Gamificação — badges ✅ (4 de 8)

Conjunto implementado (4 de 8):
- 🔮 **Tarólogo** — 5 placares exatos ✅
- 🐓 **Madrugador** — primeiro a palpitar em uma rodada ✅
- 🎯 **Cravou** — placar exato em jogo do Brasil ✅
- 💀 **Zica** — errou todos os palpites de uma rodada ✅

Planejados (não implementados):
- 🔥 **Sequência Quente** — 5 acertos seguidos
- ⭐ **Profeta** — palpite especial de campeão acertado
- 👑 **Líder** — passou 5 dias consecutivos no top 1
- 🤝 **Conector** — criou grupo com 10+ membros

### 5.13 Cards compartilháveis ✅

- Worker que gera **OG image** (PNG via `next/og` ImageResponse) com:
  - Nome/avatar do usuário
  - Ranking atual (posição, pontos, placares exatos)
  - Cores e logo da empresa
- URL: `/api/og/rank/[userId]`
- Botão "Compartilhar" no perfil — usa Web Share API ou clipboard fallback. ✅

### 5.14 Comments / trash talk (leve) ✅

- Cada jogo tem caixa de comentários **liberada apenas após início do jogo** (evita espelho de palpites). ✅
- 1 comentário por usuário por jogo (limita ruído). ✅
- Reactions emoji (limitadas: 👏 😂 😱 ⚽). ❌ (não implementado — apenas texto)
- Moderação: superadmin pode ocultar comentário. ✅ (remoção direta implementada, suspensão de usuário não)

### 5.15 LGPD ✅

- Banner de consentimento no 1º acesso, com texto customizável pelo admin. ✅
- Política de privacidade em `/privacidade` (template padrão). ✅
- Direito de exportação: download imediato dos dados em JSON. ✅
- Direito ao esquecimento: soft delete imediato, hard delete em 30 dias. ✅
- Logs de auditoria mantidos por 12 meses. ✅

### 5.16 PWA + Mobile ✅

- Manifest + service worker. ✅
- Ícone, instalável (banner de instalação). ✅
- Notificações push: **fora do MVP** (complexo + Resend já cobre via email).
- Layout mobile-first, breakpoints Tailwind padrão. ✅

### 5.17 Internacionalização ✅

- pt-BR (default), es, en. ✅
- Sistema próprio de mensagens com `t()` e template interpolation. ✅
- Detecta idioma do browser; usuário pode trocar no perfil. ✅
- Times com nome em todos os idiomas no seed. ✅

### 5.18 Modo escuro ✅

- Toggle no header (light/dark/system). ✅
- Persistência via cookie + `prefers-color-scheme`. ✅
- Paleta dark mode definida no design system (seção 6). ✅

---

## 6. Design System

### 6.1 Paleta — "Brasil moderno"

**Recusando o clichê verde-amarelo saturado**. Paleta inspirada na bandeira mas em tons mais sóbrios e contemporâneos, com bom contraste WCAG AA.

| Token | Light | Dark | Uso |
|---|---|---|---|
| `--brand-primary` | `#009C3B` (verde Brasil moderno) | `#00C04C` | Botões primários, CTAs |
| `--brand-secondary` | `#FFDF00` (amarelo) | `#FFE94D` | Acentos, badges destaque |
| `--brand-accent` | `#002776` (azul) | `#3D63DD` | Links, ranking top 3 |
| `--brand-surface` | `#FAFAF7` (off-white) | `#0E0F12` | Background |
| `--brand-card` | `#FFFFFF` | `#171821` | Cards |
| `--brand-border` | `#E5E5DD` | `#2A2C36` | Bordas |
| `--brand-text` | `#0E0F12` | `#F5F5F2` | Texto principal |
| `--brand-text-muted` | `#5C5F6A` | `#9CA0AC` | Texto secundário |

> O superadmin pode trocar `--brand-primary`, `--brand-secondary`, `--brand-accent` pra branding da empresa, mantendo a tipografia e o sistema.

### 6.2 Tipografia

- Display: **Bricolage Grotesque** (variable, free, Google Fonts) — moderna, com personalidade.
- Body: **Inter** (variable) — workhorse confiável.
- Mono: **JetBrains Mono** — códigos e placares.

### 6.3 Layout — Bento

Inspiração: dashboards modernos (Linear, Vercel, Stripe). Grid bento na home e no perfil:

```
┌───────────────────────┬──────────────┐
│                       │              │
│   Próximo jogo (BIG)  │  Sua posição │
│                       │  no ranking  │
├──────────┬────────────┼──────────────┤
│  Pts da  │  Placares  │              │
│  rodada  │  exatos    │ Badges       │
├──────────┴────────────┤              │
│                       ├──────────────┤
│  Grupos privados      │  Top 5 geral │
│                       │              │
└───────────────────────┴──────────────┘
```

Cards com cantos arredondados (`rounded-2xl`), border sutil, hover com `scale-[1.01]` + shadow leve.

### 6.4 Componentes shadcn/ui usados

- `Card`, `Button`, `Input`, `Label`, `Badge`, `Avatar`, `Tabs`, `Sheet`, `Dialog`, `DropdownMenu`, `Toast`/Sonner, `Table`, `Form`, `Select`, `Skeleton`, `Tooltip`, `Progress`.

### 6.5 Iconografia

- **Lucide Icons** (já vem com shadcn).
- Bandeiras: `country-flag-icons` ou SVG estático (Wikipedia commons).

---

## 7. Cron jobs e processamento

| Job | Frequência | Descrição | Status |
|---|---|---|---|
| `sync-results` | A cada 5 min | Busca resultados na API, atualiza jogos, calcula pontos e ranking | ✅ |
| `send-prediction-reminders` | A cada 1h | Avisa quem não palpitou pros próximos jogos | ✅ |
| `send-round-recap` | Diário, 23h UTC | Recap do dia: top 5, resultados | ✅ |
| `cleanup-expired-tokens` | Diário | Limpa sessões expiradas | ❌ (não implementado) |
| `hard-delete-soft-deleted` | Mensal | Apaga contas que pediram exclusão >30d | ❌ (não implementado) |
| `backup-d1` | Diário | Dump do D1 pra R2 | ❌ (não implementado) |

---

## 8. APIs externas

### 8.1 Football-Data.org (primária) ✅

- Free tier: 10 req/min, cobre Copa do Mundo.
- Endpoint: `GET /v4/competitions/WC/matches`. ✅
- Adapter pattern: interface `ScoreProvider` com implementações trocáveis. ✅

### 8.2 API-Football (RapidAPI) — fallback ❌ (não implementado)

- Free tier: 100 req/dia.
- Útil pra desempate de dados ou caso Football-Data.org tenha problema.

### 8.3 Failsafe manual ✅

- Admin pode editar manualmente `home_score`, `away_score` e marcar jogo como `finished`. ✅
- Botão "Recalcular pontos" no painel admin. ✅

---

## 9. Estrutura do repositório

```
bolao-copa-do-mundo/
├── README.md
├── LICENSE                       # MIT
├── prd.md                        # Este documento
├── wrangler.toml                 # Cloudflare config (D1, KV, R2, crons)
├── package.json                  # pnpm
├── src/
│   ├── app/                      # Next.js 15 App Router
│   │   ├── (auth)/               # /login, /cadastro
│   │   ├── (app)/                # Rotas autenticadas
│   │   │   ├── home/
│   │   │   ├── jogos/            # Palpites por dia
│   │   │   ├── jogos/[matchId]/  # Detalhe + comments
│   │   │   ├── palpites-especiais/
│   │   │   ├── ranking/
│   │   │   ├── grupos/           # Listar, criar, entrar
│   │   │   ├── grupos/[id]/      # Detalhe do grupo
│   │   │   ├── perfil/
│   │   │   ├── regras/
│   │   │   └── premios/
│   │   ├── (admin)/              # /admin/* — painel superadmin
│   │   │   └── admin/
│   │   │       ├── configuracoes/
│   │   │       ├── dominios/
│   │   │       ├── usuarios/
│   │   │       ├── jogos/
│   │   │       ├── resultados-especiais/
│   │   │       ├── regras/
│   │   │       ├── premios/
│   │   │       ├── broadcast/
│   │   │       ├── auditoria/
│   │   │       └── observabilidade/
│   │   └── api/                  # API routes
│   │       ├── cron/             # sync-results, reminders, recap
│   │       ├── og/               # OG image generation
│   │       ├── upload/           # Avatar upload
│   │       ├── export-data/      # LGPD export
│   │       └── health/
│   ├── components/               # React components
│   │   ├── ui/                   # shadcn/ui
│   │   └── ...
│   ├── lib/                      # Business logic
│   │   ├── auth/                 # Session, password, domains
│   │   ├── db/                   # Drizzle client (D1 + better-sqlite3)
│   │   ├── scoring/              # Pontuação, engine, specials
│   │   ├── badges/               # Badge evaluation
│   │   ├── football-data/        # API client
│   │   ├── email/                # Resend + templates
│   │   ├── i18n/                 # Custom i18n (t(), messages)
│   │   └── storage/              # R2 upload helpers
│   └── worker/                   # Cloudflare scheduled handler
│       └── scheduled.ts
├── data/                         # SQLite local (dev)
├── drizzle/                      # Migrations
├── public/                       # Static assets, icons, SW
└── docs/
    └── DEPLOY.md                 # Deploy guide
```

---

## 10. Deploy 1-clique

### 10.1 Botão "Deploy to Cloudflare"

README.md inicia com:

```markdown
[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/victorrm/bolao-copa-do-mundo)
```

Esse botão clona o repo, cria os recursos Cloudflare necessários (Workers, D1, KV, R2 buckets) e roda o setup via OpenNext. Após deploy, basta rodar `pnpm cf:migrate` para aplicar migrations.

### 10.2 Primeiro acesso

Não há setup script interativo. Basta acessar `/cadastro` e criar a primeira conta — ela vira superadmin automaticamente, e o domínio do email é adicionado à allowlist. Veja detalhes no README.

### 10.3 Variáveis de ambiente

```env
# Auth
SESSION_SECRET=                # 32+ bytes random

# Resend (opcional — sem isso, emails são logados no console)
RESEND_API_KEY=
RESEND_FROM_EMAIL=bolao@empresa.com.br

# API de resultados
FOOTBALL_DATA_API_KEY=         # football-data.org

# App
APP_URL=https://bolao.empresa.com.br
DEFAULT_LOCALE=pt-BR
TIMEZONE=America/Sao_Paulo
CRON_SECRET=                   # protege endpoints de cron
```

---

## 11. Roadmap

### Fase 0 — Setup ✅ ENTREGUE
- Repositório, monorepo (pnpm), CI básico
- Schema D1 + migrations + seeds
- Auth email + senha funcional (primeiro cadastro vira superadmin)
- Deploy mínimo no Cloudflare

### Fase 1 — MVP ✅ ENTREGUE
- Cadastro de domínios permitidos (com wildcard)
- Palpites de fase de grupos + mata-mata (com advancing team)
- Cálculo de pontos configurável (3pts exato, 1pt vencedor, +1 mata-mata)
- Ranking geral + ranking por grupo privado + tiebreakers
- Painel superadmin completo (10 seções: dashboard, configurações de branding, domínios, usuários, jogos, resultados especiais, regras com editor de pontuação, prêmios com upload, broadcast, auditoria, observabilidade)
- Palpites especiais pré-Copa (6 categorias com pontuação configurável)
- LGPD: consentimento, exportação, exclusão de conta
- PWA com modo escuro
- Deploy 1-clique via Cloudflare
- i18n completo (pt-BR, en, es)
- Grupos privados com convite por código

### Fase 2 — Engajamento ✅ ENTREGUE
- Badges (4 de 8 planejados: Tarólogo, Madrugador, Cravou, Zica)
- Cards compartilháveis (OG images)
- Comments por jogo (1 por usuário, liberados após início, com moderação)
- Notificações por email completas (Resend): lembrete de palpite, recap diário, broadcast admin
- Cron jobs: sync de resultados, lembretes, recap

### Fase 3 — Mata-mata (durante a Copa) — PARCIAL
- Estrutura de Rodada de 32 + oitavas + quartas + semi + 3º lugar + final ✅
- Edição manual de jogos ✅
- Backup automático D1 → R2 ❌

### Fase 4 — Pós-Copa / v2 (futuro) — NÃO INICIADA
- Magic link auth (melhoria UX sobre email+senha atual)
- Ranking por rodada (página separada com filtro)
- Badges restantes (Sequência Quente, Profeta, Líder, Conector)
- Transferência de ownership de grupos
- Backup automático D1 → R2
- SSO Google Workspace / Azure AD
- Multi-torneio (Brasileirão, Eurocopa, Copa América)
- App nativo (Capacitor sobre PWA)
- Notificações push
- Apostas em estatísticas (escanteios, cartões)

---

## 12. Métricas de sucesso

### 12.1 Adoção (open-source)

- ⭐ Stars no GitHub
- 🍴 Forks
- 📥 Deploys ativos (telemetria opt-in agregada)
- 💬 PRs e issues de contribuidores

### 12.2 Engajamento (por instância)

- DAU / MAU durante a Copa
- % de funcionários elegíveis que se cadastraram
- % de jogos com palpite preenchido por usuário ativo
- Tempo médio na plataforma
- # de grupos privados criados
- # de cards compartilhados externamente

---

## 13. Riscos e mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| API de resultados cair durante jogo importante | Média | Alto | Edição manual no admin (fallback confirmado); API-Football planejado como segunda fonte |
| Pico de tráfego em jogo do Brasil derruba D1 | Baixa | Alto | Cache agressivo em KV; cálculo síncrono dentro do cron handler |
| Empresa subir credenciais no `.env.example` por engano | Média | Médio | Pre-commit hook + scanner de secrets no CI |
| Senha do superadmin vazar | Baixa | Crítico | Scrypt hash + sessões httpOnly + audit log |
| Spam de tentativas de login | Média | Baixo | Rate limit 5/15min por email |
| Empresa esquece de configurar domínios | Alta no início | Médio | Setup script obriga 1 domínio mínimo |
| Conluio entre usuários (compartilhar palpites) | Alta | Baixo | Comments só após início do jogo + log de IP |
| Bug de cálculo de pontos descoberto tarde | Média | Crítico | Testes unitários extensivos do engine de pontuação + botão "recalcular tudo" |
| Football-Data.org não cobrir Copa 2026 no free tier | Média | Alto | Validar antes do build; edição manual no admin cobre emergências |

---

## 14. Licença

**MIT License** — escolhida em vez de Creative Commons por ser:
- Padrão de mercado pra código.
- Compatível com adoção corporativa (empresas grandes têm aversão a licenças não-padrão).
- Permite fork e modificação livremente, inclusive comercial.

Recursos visuais (logos, ilustrações originais) podem ser licenciados em **CC-BY 4.0** separadamente.

---

## 15. Próximos passos sugeridos

1. ~~**Validar este PRD** — revisar e ajustar.~~ ✅
2. ~~**Criar repositório no GitHub** + estrutura.~~ ✅
3. ~~**Implementar Fase 0–2** (setup, MVP, engajamento).~~ ✅
4. **Implementar prioridades restantes**: ranking por rodada, badges faltantes (4 de 8), backup D1→R2, transferência de ownership de grupos.
5. **Confirmar grupos finais** da Copa 2026 (vencedores das repescagens em março/2026) e atualizar seed.
6. **Convidar 2–3 empresas-piloto** pra testar antes de abrir o repositório publicamente.
7. **Anunciar** em LinkedIn, Product Hunt, Hacker News e comunidades brasileiras de RH/Comunicação.

---

**Autor**: Victor Rossini Magalhães — Fundador da Ozygen: AI Para SEO
**Versão**: 1.1 (atualizado para refletir estado atual da implementação)
**Data**: Junho 2026
**Licença do PRD**: CC-BY 4.0 (sinta-se livre pra adaptar)
