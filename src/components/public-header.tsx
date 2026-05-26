import Link from "next/link";
import { getCurrentSession } from "@/lib/auth/session";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { BrandLogo } from "@/components/brand-logo";
import { getBranding } from "@/lib/branding";

const NAV_LINKS = [
  { href: "/#features", label: "Recursos" },
  { href: "/#especiais", label: "Especiais" },
  { href: "/#ranking", label: "Ranking" },
  { href: "/#grupos", label: "Grupos" },
  { href: "/sobre", label: "Sobre" },
  { href: "/#faq", label: "FAQ" },
];

export async function PublicHeader() {
  const [session, branding] = await Promise.all([getCurrentSession(), getBranding()]);
  return (
    <header className="border-b border-brand-border/60 bg-brand-surface/85 backdrop-blur-md sticky top-0 z-30">
      <div className="container flex items-center justify-between h-16 gap-3">
        <BrandLogo
          href="/"
          logoUrl={branding.logoUrl}
          companyName={branding.companyName}
        />

        <nav className="hidden lg:flex items-center gap-7 text-sm text-brand-text-muted">
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-brand-text transition-colors">
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {session ? (
            <Link href="/home">
              <Button>Voltar ao bolão</Button>
            </Link>
          ) : (
            <>
              <Link href="/login" className="hidden sm:block">
                <Button variant="outline">Entrar</Button>
              </Link>
              <Link href="/login">
                <Button>Criar meu bolão</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
