import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PublicHeader } from "@/components/public-header";

export const metadata = {
  title: "Termos de Uso · Bolão 2026",
  description: "Condições de uso da plataforma de bolão corporativo.",
};

const LAST_UPDATE = "28 de abril de 2026";

export default function TermosPage() {
  return (
    <div className="min-h-screen flex flex-col bg-brand-surface text-brand-text">
      <PublicHeader />
      <main className="flex-1 container py-8 max-w-3xl space-y-6">
        <div>
          <h1 className="font-display text-3xl md:text-4xl font-bold">Termos de Uso</h1>
          <p className="text-brand-text-muted mt-2 text-sm">Última atualização: {LAST_UPDATE}</p>
        </div>

        <Card>
          <CardContent className="py-6 space-y-3 text-sm">
            <p>
              Ao acessar ou usar o <strong>Bolão Copa do Mundo 2026</strong> (&quot;a plataforma&quot;),
              você concorda integralmente com estes termos. Se não concorda, não use a plataforma.
            </p>
            <p className="text-brand-text-muted">
              A plataforma é open-source e auto-hospedada por cada empresa. Esses termos descrevem
              as condições de uso e isentam os autores do projeto de responsabilidades específicas
              da operação por terceiros.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">1. Quem pode usar</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2 text-brand-text-muted">
            <ul className="list-disc pl-5 space-y-1">
              <li>Pessoas com email do domínio corporativo configurado pela empresa.</li>
              <li>Maiores de 18 anos.</li>
              <li>Você se compromete a fornecer informações verdadeiras e atualizadas.</li>
              <li>Cada pessoa pode ter apenas <strong className="text-brand-text">uma conta</strong>. Múltiplas contas resultam em banimento.</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">2. Sem aposta financeira</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <p>
              <strong>A plataforma não movimenta dinheiro</strong>, em hipótese alguma. Não
              processamos pagamentos, não cobramos taxas de inscrição, não premiamos diretamente.
            </p>
            <p className="text-brand-text-muted">
              Premiações eventuais são definidas e entregues exclusivamente pela empresa que
              opera a instância, fora do sistema, como ação de endomarketing. É{" "}
              <strong className="text-brand-text">terminantemente proibido</strong> usar a
              plataforma para apostas financeiras, jogos de azar, sorteios pagos ou qualquer
              forma de movimentação de valores entre participantes.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">3. Conduta esperada</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2 text-brand-text-muted">
            <p>Ao usar a plataforma, você concorda em <strong className="text-brand-text">não</strong>:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Compartilhar credenciais ou magic links com terceiros.</li>
              <li>Tentar burlar o sistema de pontuação, deadlines ou contagem.</li>
              <li>Postar comentários ofensivos, discriminatórios, com discurso de ódio ou conteúdo ilegal.</li>
              <li>Fazer engenharia reversa de dados de outros participantes além do que a UI permite.</li>
              <li>Realizar ataques (DoS, brute-force, scraping massivo, injection).</li>
              <li>Usar nomes de exibição que se passem por outras pessoas ou marcas.</li>
            </ul>
            <p>
              Violar estas regras pode resultar em <strong className="text-brand-text">suspensão</strong>{" "}
              ou <strong className="text-brand-text">banimento</strong>, a critério do administrador
              da empresa.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">4. Pontuação e ranking</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2 text-brand-text-muted">
            <ul className="list-disc pl-5 space-y-1">
              <li>Os critérios de pontuação são publicados em <Link href="/regras" className="text-brand-accent hover:underline">/regras</Link>.</li>
              <li>Os pesos podem ser ajustados pelo administrador <strong className="text-brand-text">antes do início da Copa</strong>. Mudanças posteriores disparam recálculo de toda a pontuação acumulada.</li>
              <li>Em caso de erro na API de resultados, o admin pode editar manualmente — o recálculo é refeito.</li>
              <li>Decisões finais de premiação cabem à empresa, com base no ranking apresentado.</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">5. Conteúdo gerado por usuários</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2 text-brand-text-muted">
            <p>
              Comentários nos jogos e descrições de grupos privados são de inteira responsabilidade
              de quem publica. O administrador da empresa pode <strong className="text-brand-text">ocultar</strong>{" "}
              comentários inadequados a qualquer momento, sem aviso prévio.
            </p>
            <p>
              Você concede à empresa que opera a instância licença não-exclusiva para exibir seu
              nome e palpites no contexto do bolão durante a vigência da sua conta.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">6. Propriedade intelectual</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2 text-brand-text-muted">
            <p>
              O <strong className="text-brand-text">código-fonte</strong> da plataforma é
              licenciado sob <strong className="text-brand-text">MIT</strong>; conteúdos,
              ilustrações e textos sob <strong className="text-brand-text">CC BY 4.0</strong>.
              Veja <Link href="/sobre" className="text-brand-accent hover:underline">/sobre</Link>{" "}
              para detalhes.
            </p>
            <p>
              Marcas, logos e nomes de seleções e da FIFA são propriedade dos seus respectivos
              titulares. Este projeto não tem afiliação oficial com FIFA, CBF, Football-Data.org
              ou qualquer outra entidade.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">7. Disponibilidade</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2 text-brand-text-muted">
            <p>
              A plataforma é fornecida <strong className="text-brand-text">&quot;como está&quot;</strong>,
              sem garantias de disponibilidade contínua, ausência de erros, ou performance. Pode
              haver janelas de manutenção, instabilidades de provedores externos (Cloudflare,
              Resend, Football-Data) ou falhas decorrentes de bugs.
            </p>
            <p>
              Faça suas próprias capturas de palpites/ranking se considerar relevante para
              eventual premiação.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">8. Limitação de responsabilidade</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2 text-brand-text-muted">
            <p>
              No máximo permitido por lei, nem os <strong className="text-brand-text">autores
              do projeto open-source</strong> nem a <strong className="text-brand-text">empresa
              que opera a instância</strong> são responsáveis por:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Lucros cessantes, perda de oportunidade de premiação, dano moral.</li>
              <li>Falhas em provedores externos (Cloudflare, Resend, Football-Data.org).</li>
              <li>Atos de terceiros (ataques, vazamentos em provedores).</li>
              <li>Indisponibilidade durante jogos críticos.</li>
              <li>Erros na API de resultados que afetem temporariamente a pontuação.</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">9. Encerramento</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2 text-brand-text-muted">
            <p>
              Você pode encerrar sua conta a qualquer momento na página de perfil
              (&quot;Excluir minha conta&quot;). A empresa pode encerrar sua conta em caso de
              violação destes termos ou desligamento da empresa.
            </p>
            <p>
              Após o encerramento, dados pessoais são anonimizados imediatamente e excluídos
              definitivamente em 30 dias, conforme a{" "}
              <Link href="/privacidade" className="text-brand-accent hover:underline">
                Política de Privacidade
              </Link>.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">10. Foro e legislação aplicável</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2 text-brand-text-muted">
            <p>
              Estes termos são regidos pelas leis da <strong className="text-brand-text">República
              Federativa do Brasil</strong>. Eventuais disputas serão resolvidas no foro do
              domicílio da empresa que opera a instância, salvo disposição legal em contrário.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">11. Alterações</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2 text-brand-text-muted">
            <p>
              Estes termos podem ser atualizados. Alterações materiais são comunicadas com pelo
              menos 7 dias de antecedência. O uso continuado da plataforma após a comunicação
              implica aceitação dos novos termos.
            </p>
          </CardContent>
        </Card>

        <div className="text-sm text-brand-text-muted text-center py-4">
          <Link href="/" className="hover:text-brand-primary">← voltar à página inicial</Link>
          <span className="mx-2">·</span>
          <Link href="/privacidade" className="hover:text-brand-primary">Política de Privacidade</Link>
        </div>
      </main>
    </div>
  );
}
