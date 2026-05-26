# Deploy Cloudflare

Stack: Next.js 15 + Cloudflare Workers (via OpenNext) + D1 + KV + R2.

## 1. Prerequisitos

```bash
pnpm install
wrangler login
```

## 2. Bootstrap automático

```bash
pnpm cf:bootstrap
```

Cria D1, KV e R2 e atualiza `wrangler.toml` com os IDs.

## 3. Aplicar migrations remotas

```bash
pnpm cf:migrate
```

## 4. Configurar secrets

Obrigatórios:

```bash
wrangler secret put SESSION_SECRET            # 32+ bytes random
wrangler secret put FOOTBALL_DATA_API_KEY     # chave de api.football-data.org
wrangler secret put CRON_SECRET               # protege os cron endpoints
```

Opcionais (só se for usar emails — Resend):

```bash
wrangler secret put RESEND_API_KEY            # ex: re_xxx
wrangler secret put RESEND_FROM_EMAIL         # ex: bolao@empresa.com.br
```

Sem Resend, o app funciona normalmente — emails são logados no console do worker.

## 5. Build & deploy

```bash
pnpm cf:build
pnpm cf:deploy
```

O build do OpenNext gera `.open-next/worker.js`. O `worker-entry.js` na raiz wrappa esse handler e adiciona o `scheduled()` para rodar os cron triggers (sync-results, reminders, recap).

## 6. Primeiro acesso

Acesse `https://seu-worker.workers.dev/cadastro` e crie a primeira conta. **O primeiro usuário a se cadastrar vira superadmin** e o domínio do email dele é adicionado à `allowed_domains` automaticamente.

A partir daí, colegas com email do mesmo domínio podem se cadastrar livremente. O superadmin libera mais domínios em `/admin/dominios` e gerencia usuários (incluindo reset de senha) em `/admin/usuarios`.

## 7. Cron triggers

Já declarados em `wrangler.toml`:

- `*/5 * * * *` → `/api/cron/sync-results`  (busca resultados)
- `0 * * * *` → `/api/cron/reminders`  (lembretes 12h antes)
- `0 23 * * *` → `/api/cron/recap`  (recap diário 23h UTC)

## 8. CI/CD

`.github/workflows/ci.yml` roda em todo PR/push e cobre só verificação de qualidade:

- typecheck
- unit + integration tests (vitest)
- E2E tests (Playwright)

**Deploy é feito pelo Cloudflare Workers Builds (Git-native), não pelo GitHub Actions.** Cada push em `main` dispara build+deploy automaticamente na infra da Cloudflare. Não há `CLOUDFLARE_API_TOKEN` em GitHub Secrets — a autorização é via OAuth GitHub ↔ Cloudflare na conexão inicial.

Pra ativar (uma vez):

1. https://dash.cloudflare.com → Workers & Pages → seu Worker → Settings → Builds → Connect to Git.
2. Autorize GitHub e selecione `victorrm/bolao-copa-do-mundo` (ou o seu fork).
3. Branch: `main`. Os comandos default são detectados automaticamente:
   - **Build command**: `pnpm build` (que aponta pra `opennextjs-cloudflare build` no `package.json`)
   - **Deploy command**: `pnpm exec opennextjs-cloudflare deploy`
   - **Root directory**: `/`

Não precisa preencher nada custom — o `package.json` já está configurado pra que Workers Builds funcione zero-config. Quem usar o botão "Deploy to Cloudflare" do README já recebe isso configurado.

## Observabilidade

- `GET /api/health` → status, versão, driver do banco, latency
- Logs estruturados (JSON) compatíveis com Workers Logpush, Logtail, Datadog
- `/admin/observabilidade` mostra últimos disparos de email + ações sensíveis
- `/admin/auditoria` mostra audit log completo

## Estado atual

✅ Configuração pronta para deploy.

O cliente DB (`src/lib/db/index.ts`) detecta runtime: D1 em produção, better-sqlite3 em dev local. Sem refatoração das actions necessária.
