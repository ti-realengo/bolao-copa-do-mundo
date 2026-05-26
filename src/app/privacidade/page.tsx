import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PublicHeader } from "@/components/public-header";

export const metadata = {
  title: "Política de Privacidade · Bolão 2026",
  description: "Como tratamos seus dados pessoais conforme a LGPD.",
};

const LAST_UPDATE = "28 de abril de 2026";

export default function PrivacidadePage() {
  return (
    <div className="min-h-screen flex flex-col bg-brand-surface text-brand-text">
      <PublicHeader />
      <main className="flex-1 container py-8 max-w-3xl space-y-6">
        <div>
          <h1 className="font-display text-3xl md:text-4xl font-bold">Política de Privacidade</h1>
          <p className="text-brand-text-muted mt-2 text-sm">Última atualização: {LAST_UPDATE}</p>
        </div>

        <Card>
          <CardContent className="py-6 space-y-4 text-sm">
            <p>
              Esta política descreve como o <strong>Bolão Copa do Mundo 2026</strong> (&quot;a plataforma&quot;)
              trata seus dados pessoais, em conformidade com a <strong>Lei Geral de Proteção de
              Dados (LGPD — Lei nº 13.709/2018)</strong> e o GDPR no que for aplicável.
            </p>
            <p className="text-brand-text-muted">
              A plataforma é <strong>auto-hospedada por cada empresa</strong> que a utiliza. Cada
              instância é independente, e os dados nunca cruzam entre instâncias. O controlador
              dos dados é a empresa que opera a instância — não os autores do projeto open-source.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">1. Dados coletados</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-3">
            <p>Coletamos apenas o estritamente necessário para operar o bolão:</p>
            <ul className="list-disc pl-5 space-y-1 text-brand-text-muted">
              <li><strong className="text-brand-text">Email corporativo:</strong> obrigatório para login (magic link).</li>
              <li><strong className="text-brand-text">Nome de exibição:</strong> informado no onboarding, mostrado no ranking.</li>
              <li><strong className="text-brand-text">Telefone:</strong> opcional, útil apenas para contato em caso de premiação.</li>
              <li><strong className="text-brand-text">Foto de perfil:</strong> opcional, exibida na sua página de perfil.</li>
              <li><strong className="text-brand-text">Palpites e resultados:</strong> seus pronósticos, pontuação e ranking.</li>
              <li><strong className="text-brand-text">Logs de acesso:</strong> IP em hash SHA-256 (não reversível) e user agent — apenas para auditoria de segurança.</li>
              <li><strong className="text-brand-text">Preferências:</strong> idioma, tema (claro/escuro), preferências de email.</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">2. Bases legais</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <p className="text-brand-text-muted">
              Usamos os dados com base em (Art. 7º da LGPD):
            </p>
            <ul className="list-disc pl-5 space-y-1 text-brand-text-muted">
              <li><strong className="text-brand-text">Consentimento (V):</strong> coletado no primeiro acesso para participar do bolão.</li>
              <li><strong className="text-brand-text">Execução de contrato (V):</strong> processar palpites e calcular ranking.</li>
              <li><strong className="text-brand-text">Legítimo interesse (IX):</strong> logs de auditoria e prevenção de fraude.</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">3. Finalidades</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <ul className="list-disc pl-5 space-y-1 text-brand-text-muted">
              <li>Autenticar você por magic link no email corporativo.</li>
              <li>Calcular sua pontuação e exibir o ranking.</li>
              <li>Enviar notificações que você optar receber (lembretes, recap, broadcasts).</li>
              <li>Investigar incidentes de segurança e abuso.</li>
              <li>Cumprir obrigações legais de retenção quando aplicáveis.</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">4. Compartilhamento</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2 text-brand-text-muted">
            <p>
              Não vendemos dados. Compartilhamos apenas com operadores estritamente necessários:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong className="text-brand-text">Cloudflare</strong> (hospedagem, banco D1, KV, R2) — operador.</li>
              <li><strong className="text-brand-text">Resend</strong> (envio de email transacional) — operador.</li>
              <li><strong className="text-brand-text">Football-Data.org</strong> (resultados de jogos) — não recebe dados pessoais.</li>
            </ul>
            <p>
              Seu nome de exibição e ranking são visíveis aos demais participantes do mesmo bolão
              (mesmo domínio corporativo). Nada é exposto publicamente fora da plataforma.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">5. Seus direitos (Art. 18 LGPD)</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-3">
            <p className="text-brand-text-muted">Você pode, a qualquer momento:</p>
            <ul className="list-disc pl-5 space-y-1 text-brand-text-muted">
              <li><strong className="text-brand-text">Acessar</strong> seus dados na página de perfil.</li>
              <li><strong className="text-brand-text">Exportar</strong> tudo em JSON (botão &quot;Exportar meus dados&quot;).</li>
              <li><strong className="text-brand-text">Corrigir</strong> nome, telefone e preferências no perfil.</li>
              <li><strong className="text-brand-text">Excluir</strong> sua conta — anonimização imediata, exclusão definitiva em 30 dias (job mensal).</li>
              <li><strong className="text-brand-text">Revogar consentimento</strong> desativando preferências de email.</li>
              <li><strong className="text-brand-text">Solicitar informações</strong> sobre uso e compartilhamento dos dados — pelo email do administrador da empresa.</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">6. Retenção</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2 text-brand-text-muted">
            <ul className="list-disc pl-5 space-y-1">
              <li>Dados pessoais ativos: enquanto sua conta estiver ativa.</li>
              <li>Após exclusão: <strong className="text-brand-text">soft delete imediato</strong> (anonimização) + hard delete em 30 dias.</li>
              <li>Logs de auditoria: <strong className="text-brand-text">12 meses</strong>, depois apagados.</li>
              <li>Magic links expirados: limpos diariamente.</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">7. Segurança</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2 text-brand-text-muted">
            <ul className="list-disc pl-5 space-y-1">
              <li>HTTPS obrigatório em produção.</li>
              <li>Cookies de sessão httpOnly + SameSite=Lax.</li>
              <li>Magic links com TTL de 15 minutos, hash SHA-256.</li>
              <li>Senha do admin com scrypt (Node crypto).</li>
              <li>Rate limiting em login (5 tentativas/hora por email).</li>
              <li>IP armazenado em hash SHA-256 truncado, não reversível.</li>
              <li>Auditoria de ações sensíveis (login, mudanças de configuração, exclusão).</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">8. Cookies</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2 text-brand-text-muted">
            <p>Usamos apenas cookies essenciais:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><code>bolao_session</code> — sessão autenticada (httpOnly, 30 dias).</li>
              <li><code>bolao_locale</code> — idioma escolhido.</li>
              <li><code>bolao_theme</code> — tema (claro/escuro/sistema).</li>
              <li><code>bolao_lgpd_acknowledged_v1</code> — confirmação do banner.</li>
            </ul>
            <p>Não usamos cookies de tracking publicitário ou de terceiros.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">9. Encarregado (DPO) e contato</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2 text-brand-text-muted">
            <p>
              O Encarregado de Tratamento de Dados (DPO) e o canal de comunicação para direitos do
              titular são definidos pela <strong className="text-brand-text">empresa que opera a
              instância</strong>. Procure o RH ou o administrador do bolão na sua empresa.
            </p>
            <p>
              Para questões sobre o código-fonte ou licença, veja{" "}
              <Link href="/sobre" className="text-brand-accent hover:underline">/sobre</Link>.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">10. Alterações</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2 text-brand-text-muted">
            <p>
              Esta política pode ser atualizada. Mudanças materiais serão comunicadas por email
              aos participantes ativos com pelo menos 7 dias de antecedência. A data acima sempre
              reflete a versão vigente.
            </p>
          </CardContent>
        </Card>

        <div className="text-sm text-brand-text-muted text-center py-4">
          <Link href="/" className="hover:text-brand-primary">← voltar à página inicial</Link>
          <span className="mx-2">·</span>
          <Link href="/termos" className="hover:text-brand-primary">Termos de uso</Link>
        </div>
      </main>
    </div>
  );
}
