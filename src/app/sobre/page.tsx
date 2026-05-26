import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PublicHeader } from "@/components/public-header";

export const metadata = {
  title: "Sobre · Bolão Copa do Mundo 2026",
  description: "Sobre o projeto, autoria e licença Creative Commons.",
};

export default function SobrePage() {
  return (
    <div className="min-h-screen flex flex-col bg-brand-surface text-brand-text">
      <PublicHeader />
      <main className="flex-1 container py-8 max-w-3xl space-y-6">
        <div>
          <h1 className="font-display text-3xl md:text-4xl font-bold">Sobre o projeto</h1>
          <p className="text-brand-text-muted mt-2">
            Plataforma open-source de bolão corporativo para a Copa do Mundo FIFA 2026.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Autor</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              Desenvolvido por <strong>Victor Rossini Magalhães</strong>, fundador da{" "}
              <a
                href="https://ozygen.app"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-accent hover:underline"
              >
                Ozygen — AI para SEO
              </a>.
            </p>
            <p className="text-brand-text-muted">
              Construído usando vibe-coding com Claude Code, em colaboração entre desenvolvedor e LLM.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">12 projetos em 2026</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              Este bolão faz parte de um <strong>ciclo de 12 projetos open-source</strong> que serão
              construídos com vibe-coding ao longo de 2026 — um a cada mês.
            </p>
            <p className="text-brand-text-muted">
              A ideia é explorar diferentes domínios e arquiteturas, documentando o processo
              de desenvolvimento colaborativo entre humano e IA. Cada projeto segue uma regra de negócio específica e desafios técnicos únicos.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Licença</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex flex-col gap-1">
              <span className="inline-flex items-center gap-2">
                <span className="font-mono px-2 py-0.5 rounded bg-brand-secondary/30 text-xs">
                  CC BY 4.0
                </span>
                <span className="font-medium">Creative Commons Atribuição 4.0 Internacional</span>
              </span>
              <span className="text-brand-text-muted">para conteúdo, ilustrações e textos</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="inline-flex items-center gap-2">
                <span className="font-mono px-2 py-0.5 rounded bg-brand-secondary/30 text-xs">
                  MIT
                </span>
                <span className="font-medium">MIT License</span>
              </span>
              <span className="text-brand-text-muted">para o código-fonte</span>
            </div>
            <p className="text-brand-text-muted pt-2">
              Você pode usar, modificar, distribuir e adaptar comercialmente, desde que mantenha
              os créditos e o aviso da licença. Veja os termos completos em{" "}
              <a
                href="https://creativecommons.org/licenses/by/4.0/deed.pt-br"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-accent hover:underline"
              >
                creativecommons.org/licenses/by/4.0
              </a>{" "}
              e{" "}
              <a
                href="https://opensource.org/licenses/MIT"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-accent hover:underline"
              >
                opensource.org/licenses/MIT
              </a>.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Disclaimer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-brand-text-muted">
            <p>
              Este projeto não é afiliado, endossado ou patrocinado pela FIFA, Football-Data.org
              ou qualquer entidade organizadora da Copa do Mundo.
            </p>
            <p>
              <strong className="text-brand-text">A plataforma não movimenta dinheiro.</strong>{" "}
              Premiações são definidas e entregues pela empresa que opera a instância, fora do sistema.
              É proibido qualquer tipo de aposta financeira pelo software.
            </p>
            <p>
              Os dados de jogos são obtidos de provedores públicos (Football-Data.org); ainda assim,
              recomendamos validar resultados oficialmente antes de premiar.
            </p>
          </CardContent>
        </Card>

        <div className="text-sm text-brand-text-muted text-center py-4">
          <Link href="/" className="hover:text-brand-primary">← voltar à página inicial</Link>
        </div>
      </main>
    </div>
  );
}
