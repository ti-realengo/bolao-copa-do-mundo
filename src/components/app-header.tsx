"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Search,
  Menu,
  X,
  ChevronDown,
  LayoutDashboard,
  Trophy,
  Target,
  Users,
  BarChart3,
  BarChart2,
  Sparkles,
  ScrollText,
  LogOut,
  User as UserIcon,
  Shield,
  Calculator,
  Settings,
  Globe,
  Award,
  Megaphone,
  UserCog,
  ListChecks,
  Activity,
  History,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { BrandLogo } from "@/components/brand-logo";
import { cn } from "@/lib/utils";

interface HeaderProps {
  userName: string;
  userRole: string;
  userAvatarUrl?: string | null;
  isAdmin?: boolean;
  companyName?: string | null;
  logoUrl?: string | null;
  logoutSlot: React.ReactNode;
}

const TABS = [
  { href: "/jogos", label: "Jogos" },
  { href: "/jogos?filter=mine", label: "Palpites" },
  { href: "/ranking", label: "Ranking" },
  { href: "/ranking/rodada", label: "Rodada" },
  { href: "/grupos", label: "Grupos" },
  { href: "/palpites-especiais", label: "Especiais" },
  { href: "/historico", label: "Histórico" },
];

const MOBILE_NAV = [
  { href: "/home", label: "Dashboard", icon: LayoutDashboard },
  { href: "/jogos", label: "Jogos", icon: Target },
  { href: "/jogos?filter=mine", label: "Meus palpites", icon: Trophy },
  { href: "/grupos", label: "Grupos", icon: Users },
  { href: "/ranking", label: "Ranking", icon: BarChart3 },
  { href: "/ranking/rodada", label: "Ranking por rodada", icon: BarChart2 },
  { href: "/palpites-especiais", label: "Especiais", icon: Sparkles },
  { href: "/historico", label: "Histórico", icon: History },
  { href: "/regras", label: "Regulamento", icon: ScrollText },
];

const MOBILE_ADMIN_NAV = [
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
];

function isTabActive(currentPath: string, href: string) {
  const path = href.split("?")[0];
  return currentPath === path || currentPath.startsWith(path + "/");
}

export function AppHeader({
  userName,
  userRole,
  userAvatarUrl,
  isAdmin = false,
  companyName,
  logoUrl,
  logoutSlot,
}: HeaderProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-brand-border bg-brand-surface lg:bg-brand-surface/85 lg:backdrop-blur-md">
      <div className="flex items-center h-16 px-4 lg:px-6 gap-3">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Abrir menu"
          className="lg:hidden p-2 rounded-lg hover:bg-brand-card text-brand-text-muted"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Mobile logo */}
        <div className="lg:hidden">
          <BrandLogo
            href="/home"
            logoUrl={logoUrl}
            companyName={companyName}
            size="sm"
          />
        </div>

        <button
          type="button"
          aria-label="Abrir menu lateral"
          className="hidden lg:inline-flex p-2 rounded-lg hover:bg-brand-card text-brand-text-muted"
        >
          <Menu className="h-5 w-5" />
        </button>

        <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">
          {TABS.map((tab) => {
            const active = isTabActive(pathname, tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "relative px-4 py-2 text-sm font-medium transition-colors",
                  active ? "text-brand-text" : "text-brand-text-muted hover:text-brand-text",
                )}
              >
                {tab.label}
                {active && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full bg-brand-primary" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          <button
            type="button"
            aria-label="Buscar"
            className="p-2 rounded-lg hover:bg-brand-card text-brand-text-muted hover:text-brand-text transition-colors"
          >
            <Search className="h-[18px] w-[18px]" />
          </button>
          <ThemeToggle />

          {/* User dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setUserMenuOpen((s) => !s)}
              className="flex items-center gap-2 rounded-xl border border-brand-border bg-brand-card pl-1 pr-2 py-1 hover:border-brand-border-strong transition-colors"
            >
              <span className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-primary/30 to-brand-primary/10 text-brand-primary text-sm font-semibold overflow-hidden">
                {userAvatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={userAvatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  userName.slice(0, 1).toUpperCase()
                )}
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-brand-primary border-2 border-brand-card" />
              </span>
              <div className="hidden sm:flex flex-col items-start leading-tight">
                <span className="font-semibold text-xs">{userName}</span>
                <span className="text-[10px] text-brand-text-muted">{userRole}</span>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-brand-text-muted hidden sm:block" />
            </button>

            {userMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setUserMenuOpen(false)}
                  aria-hidden
                />
                <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-brand-border bg-brand-card shadow-xl z-50 overflow-hidden">
                  <div className="p-4 border-b border-brand-border">
                    <p className="font-semibold text-sm truncate">{userName}</p>
                    <p className="text-xs text-brand-text-muted truncate">{userRole}</p>
                  </div>
                  <div className="p-1.5">
                    <Link
                      href="/perfil"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm hover:bg-brand-surface-2 transition-colors"
                    >
                      <UserIcon className="h-4 w-4 text-brand-text-muted" />
                      Meu perfil
                    </Link>
                    {isAdmin && (
                      <Link
                        href="/admin/regras"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm hover:bg-brand-surface-2 transition-colors"
                      >
                        <Shield className="h-4 w-4 text-brand-warning" />
                        Painel admin
                      </Link>
                    )}
                    <div className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm hover:bg-brand-surface-2 transition-colors text-brand-danger [&_button]:w-full [&_button]:justify-start [&_button]:p-0 [&_button]:h-auto [&_button]:bg-transparent [&_button]:hover:bg-transparent [&_button]:text-current [&_button]:shadow-none [&_button]:font-normal">
                      <LogOut className="h-4 w-4" />
                      {logoutSlot}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" onClick={() => setMobileOpen(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <div
            className="absolute top-0 left-0 bottom-0 w-72 bg-brand-card border-r border-brand-border p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <div onClick={() => setMobileOpen(false)}>
                <BrandLogo
                  href="/home"
                  logoUrl={logoUrl}
                  companyName={companyName}
                  size="sm"
                />
              </div>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Fechar"
                className="p-1 rounded-lg hover:bg-brand-surface-2"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex flex-col gap-0.5">
              {MOBILE_NAV.map((item) => {
                const active = isTabActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                      active
                        ? "bg-brand-primary/12 text-brand-primary font-medium"
                        : "text-brand-text hover:bg-brand-surface-2",
                    )}
                  >
                    <item.icon
                      className={cn(
                        "h-4 w-4",
                        active ? "text-brand-primary" : "text-brand-text-muted",
                      )}
                    />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {isAdmin && (
              <div className="border-t border-brand-border mt-4 pt-4">
                <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-brand-warning mb-2 flex items-center gap-1.5">
                  <Shield className="h-3 w-3" />
                  Administração
                </p>
                <nav className="flex flex-col gap-0.5">
                  {MOBILE_ADMIN_NAV.map((item) => {
                    const active = isTabActive(pathname, item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                          active
                            ? "bg-brand-primary/12 text-brand-primary font-medium"
                            : "text-brand-text-muted hover:bg-brand-surface-2 hover:text-brand-text",
                        )}
                      >
                        <item.icon
                          className={cn(
                            "h-4 w-4",
                            active ? "text-brand-primary" : "text-brand-text-muted",
                          )}
                        />
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>
              </div>
            )}

            <div className="border-t border-brand-border mt-4 pt-4 space-y-2">
              <Link
                href="/perfil"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm hover:bg-brand-surface-2"
              >
                <UserIcon className="h-4 w-4 text-brand-text-muted" />
                {userName}
              </Link>
              <div className="px-3">{logoutSlot}</div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
