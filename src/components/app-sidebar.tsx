"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Trophy,
  Target,
  Users,
  BarChart3,
  BarChart2,
  Sparkles,
  ScrollText,
  ChevronRight,
  Shield,
  Calculator,
  Settings,
  Globe,
  Award,
  Megaphone,
  UserCog,
  ListChecks,
  Activity,
  Database,
  History,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/brand-logo";

interface SidebarProps {
  nextRoundStart?: number | null;
  isAdmin?: boolean;
  companyName?: string | null;
  logoUrl?: string | null;
}

interface NavItem {
  href: string;
  label: string;
  icon: typeof Trophy;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const PARTICIPANT_NAV: NavGroup = {
  label: "Principal",
  items: [
    { href: "/jogos", label: "Jogos", icon: Target },
    { href: "/jogos?filter=mine", label: "Meus palpites", icon: Trophy },
    { href: "/grupos", label: "Grupos", icon: Users },
    { href: "/ranking", label: "Ranking", icon: BarChart3 },
    { href: "/ranking/rodada", label: "Ranking por rodada", icon: BarChart2 },
    { href: "/palpites-especiais", label: "Especiais", icon: Sparkles },
    { href: "/historico", label: "Histórico", icon: History },
    { href: "/regras", label: "Regulamento", icon: ScrollText },
  ],
};

const ADMIN_NAV: NavGroup = {
  label: "Administração",
  items: [
    { href: "/admin/regras", label: "Regras & pontuação", icon: Calculator },
    { href: "/admin/configuracoes", label: "Configurações", icon: Settings },
    { href: "/admin/jogos", label: "Gerenciar jogos", icon: Target },
    { href: "/admin/resultados-especiais", label: "Resultados especiais", icon: Sparkles },
    { href: "/admin/dominios", label: "Domínios", icon: Globe },
    { href: "/admin/premios", label: "Prêmios", icon: Award },
    { href: "/admin/broadcast", label: "Broadcast", icon: Megaphone },
    { href: "/admin/usuarios", label: "Usuários", icon: UserCog },
    { href: "/admin/auditoria", label: "Auditoria", icon: ListChecks },
    { href: "/admin/observabilidade", label: "Observabilidade", icon: Activity },
    { href: "/admin/backup", label: "Backup", icon: Database },
  ],
};

function isActive(currentPath: string, href: string) {
  const path = href.split("?")[0];
  if (path === "/home") return currentPath === "/home";
  return currentPath === path || currentPath.startsWith(path + "/");
}

export function AppSidebar({
  nextRoundStart,
  isAdmin = false,
  companyName,
  logoUrl,
}: SidebarProps) {
  const pathname = usePathname();
  const groups: NavGroup[] = isAdmin ? [PARTICIPANT_NAV, ADMIN_NAV] : [PARTICIPANT_NAV];

  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col gap-4 border-r border-brand-border bg-brand-card/40 sticky top-0 h-screen overflow-y-auto px-4 py-5">
      <BrandLogo
        href="/home"
        logoUrl={logoUrl}
        companyName={companyName}
        className="px-2"
      />

      <Link
        href="/home"
        className={cn(
          "flex items-center gap-3 rounded-2xl border px-3.5 py-3 transition-colors",
          isActive(pathname, "/home")
            ? "border-brand-primary/40 bg-brand-primary/10 text-brand-text"
            : "border-brand-border bg-brand-card hover:border-brand-border-strong",
        )}
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-primary/15 text-brand-primary">
          <LayoutDashboard className="h-[18px] w-[18px]" />
        </span>
        <span className="font-semibold text-sm">Dashboard</span>
      </Link>

      <nav className="flex flex-col gap-1">
        {groups.map((group) => {
          const isAdminGroup = group.label === "Administração";
          return (
            <div key={group.label} className="mb-1">
              <p
                className={cn(
                  "px-3 text-[10px] font-semibold uppercase tracking-[0.12em] mb-2 mt-1 flex items-center gap-1.5",
                  isAdminGroup ? "text-brand-warning" : "text-brand-text-muted/80",
                )}
              >
                {isAdminGroup && <Shield className="h-3 w-3" />}
                {group.label}
              </p>
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const active = isActive(pathname, item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                          active
                            ? "bg-brand-primary/12 text-brand-primary font-medium"
                            : "text-brand-text-muted hover:bg-brand-card hover:text-brand-text",
                        )}
                      >
                        <item.icon
                          className={cn(
                            "h-4 w-4 shrink-0",
                            active ? "text-brand-primary" : "text-brand-text-muted group-hover:text-brand-text",
                          )}
                        />
                        <span>{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      <InvitePromo />

      {nextRoundStart && nextRoundStart > 0 ? (
        <NextRoundCountdown start={nextRoundStart} />
      ) : null}
    </aside>
  );
}

function InvitePromo() {
  return (
    <div className="mt-2 rounded-2xl border border-brand-border bg-gradient-to-br from-brand-card to-brand-primary/5 p-4">
      <div className="flex justify-center mb-2 text-2xl">
        <span aria-hidden>🎉</span>
      </div>
      <h4 className="text-center font-semibold text-sm mb-1">Convide seus colegas!</h4>
      <p className="text-center text-xs text-brand-text-muted mb-3 leading-snug">
        Quanto mais, melhor a disputa.
      </p>
      <Link
        href="/grupos"
        className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-brand-primary px-3 py-2 text-xs font-medium text-white shadow-[0_4px_14px_-4px_hsl(var(--brand-primary)/0.55)] hover:brightness-110 transition-all"
      >
        Convidar agora
        <ChevronRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

function NextRoundCountdown({ start }: { start: number }) {
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));

  useEffect(() => {
    const id = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(id);
  }, []);

  const remaining = Math.max(0, start - now);
  const days = Math.floor(remaining / 86400);
  const hours = Math.floor((remaining % 86400) / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);
  const seconds = remaining % 60;

  const totalDuration = 7 * 86400;
  const progressPct = Math.min(100, Math.max(0, ((totalDuration - remaining) / totalDuration) * 100));

  if (remaining === 0) return null;

  return (
    <div className="rounded-2xl border border-brand-border bg-brand-card p-4">
      <p className="text-xs text-brand-text-muted mb-3">Faltam para o próximo jogo</p>
      <div className="grid grid-cols-4 gap-1.5 text-center mb-3">
        <CountdownCell value={days} label="DIAS" />
        <CountdownCell value={hours} label="HORAS" />
        <CountdownCell value={minutes} label="MIN" />
        <CountdownCell value={seconds} label="SEG" />
      </div>
      <div className="h-1 rounded-full bg-brand-surface-2 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-brand-primary to-brand-primary/60 transition-all"
          style={{ width: `${progressPct}%` }}
        />
      </div>
    </div>
  );
}

function CountdownCell({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <div className="font-display font-bold text-lg leading-none tabular-nums">
        {String(value).padStart(2, "0")}
      </div>
      <div className="text-[9px] tracking-wider text-brand-text-muted mt-1">{label}</div>
    </div>
  );
}
