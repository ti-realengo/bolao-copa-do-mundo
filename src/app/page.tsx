import Link from "next/link";
import {
  Trophy,
  Target,
  Users,
  Sparkles,
  ShieldCheck,
  ClipboardList,
  UserPlus,
  CheckCircle2,
  LineChart,
  Github,
  PlayCircle,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicHeader } from "@/components/public-header";
import { getCurrentSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";

interface FaqItem {
  q: string;
  a: React.ReactNode;
}

const FAQS: FaqItem[] = [
  {
    q: "O que é esse projeto?",
    a: (
      <>
        É um <strong>bolão corporativo open-source</strong> da Copa do Mundo FIFA 2026,
        construído com vibe-coding (colaboração entre desenvolvedor e LLM). Faz parte de um
        ciclo de <strong>12 projetos open-source</strong> que serão desenvolvidos ao longo
        de <strong>2026</strong> — um por mês — explorando arquiteturas, domínios e
        diferentes formas de usar IA no desenvolvimento de software. Tudo gratuito,
        auto-hospedável e licenciado para uso e modificação livres. Mais detalhes em{" "}
        <Link href="/sobre" className="text-brand-primary hover:underline">/sobre</Link>.
      </>
    ),
  },
  {
    q: "Como funciona um bolão da Copa do Mundo?",
    a: (
      <>
        Antes de cada jogo começar, você palpita o <strong>placar</strong>. Quando a partida
        termina, o sistema compara seu palpite com o resultado real e te dá pontos: 3 por
        placar exato, 1 por acertar quem ganhou (ou empate) com placar errado, 0 por errar.
        Quem somar mais pontos no fim do torneio leva o prêmio. Os critérios completos estão em{" "}
        <Link href="/regras" className="text-brand-primary hover:underline">/regras</Link>.
      </>
    ),
  },
  {
    q: "Quanto custa para usar?",
    a: (
      <>
        Nada. O código é MIT, a infraestrutura cabe no <strong>free tier do Cloudflare</strong>{" "}
        para empresas com até alguns milhares de funcionários. Empresas maiores podem precisar
        de plano de email pago (~US$ 20/mês), mas tudo é configurável.
      </>
    ),
  },
  {
    q: "A plataforma envolve dinheiro ou aposta?",
    a: (
      <>
        Não. O sistema <strong>nunca movimenta dinheiro</strong>. Premiações são
        definidas e entregues pela empresa fora do sistema, como ação de endomarketing.
        Apostas financeiras são proibidas tanto na UI quanto nos termos de uso.
      </>
    ),
  },
  {
    q: "Quem pode entrar no bolão?",
    a: (
      <>
        O <strong>primeiro usuário a se cadastrar vira o administrador do bolão</strong> e o
        domínio do email dele é liberado automaticamente. A partir daí, qualquer pessoa
        com email desse mesmo domínio pode se cadastrar em <Link href="/cadastro" className="text-brand-primary hover:underline">/cadastro</Link>.
        O admin pode liberar mais domínios depois pelo painel. Login é por email + senha.
      </>
    ),
  },
  {
    q: "Posso editar meu palpite depois de salvar?",
    a: (
      <>
        Pode, livremente, <strong>até 15 minutos antes do início do jogo</strong>. Depois disso,
        o palpite trava automaticamente e qualquer alteração é bloqueada. O sistema salva
        sozinho conforme você digita — sem botão &quot;salvar&quot;.
      </>
    ),
  },
  {
    q: "Existem palpites especiais além dos jogos?",
    a: (
      <>
        Sim — campeão, vice, 3º lugar, artilheiro, primeira eliminada e seleção surpresa.
        Eles travam quando o <strong>primeiro jogo</strong> da Copa começa.
      </>
    ),
  },
  {
    q: "Posso disputar com um grupo menor de colegas?",
    a: (
      <>
        Sim. Crie um <strong>grupo privado</strong> com nome e descrição, e compartilhe o
        código de convite com quem quiser. Cada grupo tem seu próprio ranking interno,
        sem impactar o ranking geral do bolão.
      </>
    ),
  },
  {
    q: "E se a API de resultados der problema durante um jogo importante?",
    a: (
      <>
        Existem dois fallbacks: a admin pode <strong>editar o resultado manualmente</strong>{" "}
        no painel ou forçar um recálculo. A pontuação é refeita automaticamente após
        a correção.
      </>
    ),
  },
  {
    q: "Meus dados ficam seguros?",
    a: (
      <>
        O projeto é <strong>LGPD-ready</strong>: você pode exportar todos os seus dados em
        JSON ou excluir sua conta a qualquer momento na página de perfil. Logs de IP são
        armazenados em hash, e dados nunca cruzam entre instâncias (cada empresa tem a
        sua cópia isolada).
      </>
    ),
  },
];

const FEATURES = [
  {
    icon: Target,
    title: "Palpites",
    desc: "Palpites e classificação no mata-mata",
  },
  {
    icon: Trophy,
    title: "Ranking",
    desc: "Acompanhe o ranking geral e por grupos",
  },
  {
    icon: Sparkles,
    title: "Especiais",
    desc: "Campeão, artilheiro, surpresas e mais",
    id: "especiais",
  },
  {
    icon: Users,
    title: "Grupos",
    desc: "Grupos privados e colaborativos",
    id: "grupos",
  },
  {
    icon: ShieldCheck,
    title: "Seguro",
    desc: "Seus dados ficam sempre com você",
  },
];

const STEPS = [
  {
    icon: ClipboardList,
    title: "Crie seu bolão",
    desc: "Em poucos cliques e personalize do seu jeito.",
  },
  {
    icon: UserPlus,
    title: "Convide seu time",
    desc: "Chame seus colegas para participar.",
  },
  {
    icon: CheckCircle2,
    title: "Faça seus palpites",
    desc: "Antes de cada jogo e nas rodadas especiais.",
  },
  {
    icon: LineChart,
    title: "Acompanhe",
    desc: "Veja o ranking e torça junto!",
  },
];

export default async function LandingPage() {
  const session = await getCurrentSession();
  if (session) redirect("/home");

  return (
    <div className="min-h-screen flex flex-col bg-brand-surface text-brand-text">
      <PublicHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 stadium-glow pointer-events-none" aria-hidden />
        <div
          className="absolute inset-x-0 top-0 h-[520px] opacity-[0.07] pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
            backgroundSize: "32px 32px",
            maskImage: "linear-gradient(to bottom, black 0%, transparent 100%)",
          }}
          aria-hidden
        />

        <div className="relative container py-12 md:py-20 lg:py-24">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-10 lg:gap-14 items-center">
            <div className="space-y-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-brand-primary/30 bg-brand-primary/10 px-3 py-1.5 text-xs font-mono uppercase tracking-wider text-brand-primary">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-primary opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-primary" />
                </span>
                Copa do Mundo FIFA 2026
              </div>

              <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[0.98]">
                O bolão da
                <br />
                sua empresa,
                <br />
                <span className="text-brand-primary">sem planilha.</span>
              </h1>

              <p className="text-base md:text-lg text-brand-text-muted max-w-xl leading-relaxed">
                Monte seu bolão em minutos, convide o time e acompanhe tudo em tempo real.
                100% seu, 100% seguro.
              </p>

              <div className="flex flex-wrap gap-3 pt-2">
                <Link href="/login">
                  <Button size="lg" className="gap-2">
                    <Trophy className="h-4 w-4" />
                    Criar meu bolão
                  </Button>
                </Link>
                <Link href="/regras">
                  <Button size="lg" variant="outline" className="gap-2">
                    <PlayCircle className="h-4 w-4" />
                    Ver como funciona
                  </Button>
                </Link>
              </div>
            </div>

            <div className="relative hidden lg:flex items-center justify-center">
              <TrophyArt />
            </div>
          </div>

          {/* Feature pills */}
          <div
            id="features"
            className="mt-16 md:mt-20 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3"
          >
            {FEATURES.map((f) => (
              <div
                key={f.title}
                id={f.id}
                className="group rounded-2xl border border-brand-border bg-brand-card p-4 hover:border-brand-primary/40 hover:bg-brand-card/80 transition-colors"
              >
                <div className="flex items-center gap-2.5 mb-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-primary/12 text-brand-primary">
                    <f.icon className="h-4 w-4" />
                  </span>
                  <span className="font-semibold text-sm">{f.title}</span>
                </div>
                <p className="text-xs text-brand-text-muted leading-snug">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="container py-12 md:py-16">
        <div className="rounded-3xl border border-brand-border bg-brand-card/60 p-8 md:p-12">
          <div className="text-center max-w-xl mx-auto mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold">Como funciona</h2>
            <p className="text-brand-text-muted mt-2">
              Criar e gerenciar seu bolão é simples e rápido.
            </p>
          </div>

          <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* dotted connector */}
            <div
              className="hidden lg:block absolute top-[42px] left-[12.5%] right-[12.5%] border-t-2 border-dashed border-brand-border"
              aria-hidden
            />
            {STEPS.map((s, i) => (
              <div key={s.title} className="relative flex flex-col items-center text-center">
                <div className="relative">
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-brand-primary text-xs font-bold text-white shadow-[0_4px_12px_-2px_hsl(var(--brand-primary)/0.5)]">
                    {i + 1}
                  </span>
                  <span className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-brand-border bg-brand-card text-brand-primary">
                    <s.icon className="h-8 w-8" strokeWidth={1.75} />
                  </span>
                </div>
                <h3 className="font-display font-semibold mt-5">{s.title}</h3>
                <p className="text-sm text-brand-text-muted mt-1.5 max-w-[200px]">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="container max-w-3xl py-12 md:py-16" id="faq">
        <div className="rounded-3xl border border-brand-border bg-brand-card/60 p-8 md:p-10">
          <div className="text-center mb-8">
            <h2 className="font-display text-3xl md:text-4xl font-bold">Perguntas frequentes</h2>
            <p className="text-brand-text-muted mt-2">
              Tire suas dúvidas sobre o bolão e a plataforma.
            </p>
          </div>
          <div className="space-y-2">
            {FAQS.map((item, i) => (
              <details
                key={i}
                className="group rounded-2xl border border-brand-border bg-brand-card overflow-hidden transition-colors hover:border-brand-border-strong"
              >
                <summary className="cursor-pointer list-none flex items-center justify-between gap-3 px-5 py-4">
                  <span className="font-medium text-sm md:text-base">{item.q}</span>
                  <span className="text-xl text-brand-text-muted group-open:rotate-45 transition-transform shrink-0 leading-none">
                    +
                  </span>
                </summary>
                <div className="px-5 pb-5 pt-0 text-sm text-brand-text-muted leading-relaxed">
                  {item.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="container pb-12 md:pb-20" id="ranking">
        <div className="relative overflow-hidden rounded-3xl border border-brand-border bg-gradient-to-br from-brand-card via-brand-card to-brand-primary/10 p-8 md:p-12">
          <div
            className="absolute inset-0 opacity-30 pointer-events-none"
            style={{
              background:
                "radial-gradient(circle at 90% 50%, hsl(var(--brand-primary)/0.2) 0%, transparent 60%)",
            }}
            aria-hidden
          />
          <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="hidden sm:flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-primary/12 text-brand-primary">
                <Trophy className="h-8 w-8" strokeWidth={1.75} />
              </div>
              <div>
                <h3 className="font-display text-2xl md:text-3xl font-bold">
                  Pronto para começar?
                </h3>
                <p className="text-brand-text-muted mt-1.5 text-sm md:text-base">
                  Crie seu bolão agora e viva a Copa do Mundo 2026 com seu time!
                </p>
              </div>
            </div>
            <Link href="/login" className="shrink-0">
              <Button size="lg" className="gap-2">
                <Trophy className="h-4 w-4" />
                Criar meu bolão grátis
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

function TrophyArt() {
  return (
    <div className="relative w-full max-w-md aspect-square">
      <div
        className="absolute inset-0 rounded-full opacity-60"
        style={{
          background:
            "radial-gradient(circle, hsl(var(--brand-primary) / 0.3) 0%, transparent 60%)",
          filter: "blur(40px)",
        }}
        aria-hidden
      />
      <div
        className="absolute inset-8 rounded-full opacity-40"
        style={{
          background:
            "radial-gradient(circle, hsl(var(--brand-secondary) / 0.4) 0%, transparent 65%)",
          filter: "blur(60px)",
        }}
        aria-hidden
      />

      <svg
        viewBox="0 0 400 400"
        className="relative w-full h-full drop-shadow-[0_20px_40px_rgba(0,0,0,0.4)]"
        aria-hidden
      >
        <defs>
          <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFE066" />
            <stop offset="50%" stopColor="#F5B814" />
            <stop offset="100%" stopColor="#B8860B" />
          </linearGradient>
          <linearGradient id="goldShine" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFF6C9" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#FFF6C9" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="baseGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1F2937" />
            <stop offset="100%" stopColor="#0B1018" />
          </linearGradient>
        </defs>

        {/* confetti */}
        {Array.from({ length: 20 }).map((_, i) => {
          const x = 30 + ((i * 47) % 340);
          const y = 30 + ((i * 73) % 340);
          const colors = ["#22C55E", "#FFD700", "#3B82F6", "#FFFFFF"];
          const color = colors[i % colors.length];
          return (
            <rect
              key={i}
              x={x}
              y={y}
              width="6"
              height="3"
              fill={color}
              opacity={0.7}
              transform={`rotate(${i * 30} ${x + 3} ${y + 1.5})`}
            />
          );
        })}

        {/* Cup body */}
        <g>
          <ellipse cx="200" cy="100" rx="80" ry="14" fill="#B8860B" />
          <path
            d="M 120 100 L 130 220 Q 200 245 270 220 L 280 100 Z"
            fill="url(#goldGrad)"
            stroke="#8B6914"
            strokeWidth="2"
          />
          <path
            d="M 135 115 L 145 215 Q 200 235 255 215 L 265 115"
            fill="url(#goldShine)"
          />

          {/* Handles */}
          <path
            d="M 120 110 Q 80 115 80 155 Q 80 185 130 185"
            fill="none"
            stroke="url(#goldGrad)"
            strokeWidth="14"
            strokeLinecap="round"
          />
          <path
            d="M 280 110 Q 320 115 320 155 Q 320 185 270 185"
            fill="none"
            stroke="url(#goldGrad)"
            strokeWidth="14"
            strokeLinecap="round"
          />

          {/* Star plate */}
          <circle cx="200" cy="160" r="28" fill="#8B6914" opacity="0.4" />
          <path
            d="M 200 138 L 206 156 L 224 156 L 209 167 L 215 184 L 200 174 L 185 184 L 191 167 L 176 156 L 194 156 Z"
            fill="#FFF6C9"
          />

          {/* Stem */}
          <rect x="186" y="240" width="28" height="20" fill="url(#goldGrad)" />
          {/* Base */}
          <rect x="160" y="260" width="80" height="22" rx="4" fill="url(#baseGrad)" />
          <rect x="155" y="280" width="90" height="16" rx="4" fill="#0B1018" />
          <text
            x="200"
            y="294"
            textAnchor="middle"
            fontFamily="system-ui, sans-serif"
            fontSize="10"
            fontWeight="700"
            fill="#FFD700"
            letterSpacing="2"
          >
            FIFA 2026
          </text>
        </g>
      </svg>
    </div>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-brand-border bg-brand-card/40 mt-auto">
      <div className="container py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-primary to-brand-primary/60">
                <Trophy className="h-4 w-4 text-white" strokeWidth={2.5} />
              </span>
              <span className="font-display font-bold text-base">
                BOLÃO <span className="text-brand-primary">2026</span>
              </span>
            </Link>
            <p className="text-sm text-brand-text-muted mt-4 leading-relaxed">
              Plataforma open-source de bolão corporativo para a Copa do Mundo 2026.
              <br />
              Sem mensalidade. Sem SaaS.
              <br />
              Seus dados, na sua infraestrutura.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-4">Navegação</h4>
            <ul className="space-y-2.5 text-sm text-brand-text-muted">
        
              <li>
                <Link href="/sobre" className="hover:text-brand-primary transition-colors">
                  Sobre
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-4">Suporte</h4>
            <ul className="space-y-2.5 text-sm text-brand-text-muted">
              <li>
                <Link href="/#faq" className="hover:text-brand-primary transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/regras" className="hover:text-brand-primary transition-colors">
                  Documentação
                </Link>
              </li>
              <li>
                <a
                  href="https://github.com/victorrm/bolao-copa-do-mundo"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-brand-primary transition-colors"
                >
                  GitHub
                </a>
              </li>
              <li>
                <Link href="/privacidade" className="hover:text-brand-primary transition-colors">
                  Política de Privacidade
                </Link>
              </li>
              <li>
                <Link href="/termos" className="hover:text-brand-primary transition-colors">
                  Termos de Uso
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-4 flex items-center gap-1.5">
              Feito com <span className="text-brand-primary">♥</span>
            </h4>
            <p className="text-sm text-brand-text-muted leading-relaxed mb-4">
              para empresas
              <br />e para a comunidade.
            </p>
            <div className="flex items-center gap-2">
              <a
                href="https://github.com/victorrm"
                target="_blank"
                rel="noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-brand-border bg-brand-card text-brand-text-muted hover:text-brand-primary hover:border-brand-primary/40 transition-colors"
                aria-label="GitHub"
              >
                <Github className="h-4 w-4" />
              </a>
             
            </div>
          </div>
        </div>

        <div className="border-t border-brand-border mt-10 pt-6 text-center text-xs text-brand-text-muted">
          © 2026 Bolão Copa do Mundo 2026. Código aberto sob a licença MIT, desenvolvido por Victor R. Magalhães. <br className="sm:hidden" />
        </div>
      </div>
    </footer>
  );
}

function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037 13.56 13.56 0 0 0-.6 1.236 18.27 18.27 0 0 0-5.487 0 12.7 12.7 0 0 0-.61-1.236.077.077 0 0 0-.078-.037A19.74 19.74 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.873-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.1 13.1 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .078-.01c3.927 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .079.009c.12.099.245.198.372.292a.077.077 0 0 1-.006.127 12.3 12.3 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}
