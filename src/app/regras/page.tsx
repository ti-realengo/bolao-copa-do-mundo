import { Card, CardContent } from "@/components/ui/card";
import { getRulesMarkdown, renderMarkdown } from "@/lib/rules";
import { loadScoringConfig } from "@/lib/scoring/config";
import { PublicHeader } from "@/components/public-header";

export const dynamic = "force-dynamic";

export default async function RegrasPage() {
  const [md, scoring] = await Promise.all([getRulesMarkdown(), loadScoringConfig()]);
  const html = renderMarkdown(md);

  return (
    <div className="min-h-screen flex flex-col bg-brand-surface text-brand-text">
      <PublicHeader />
      <main className="flex-1 container py-8 max-w-3xl space-y-6">
        <Card>
          <CardContent className="py-6">
            <article
              className="prose prose-sm md:prose-base max-w-none [&_h1]:font-display [&_h1]:text-3xl [&_h1]:font-bold [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-6 [&_h2]:mb-2 [&_h3]:font-semibold [&_h3]:mt-4 [&_p]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-1 [&_a]:text-brand-accent [&_a]:underline [&_strong]:font-semibold [&_code]:font-mono [&_code]:text-sm"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-6">
            <h2 className="font-display text-xl font-semibold mb-4">Tabela de pontuação</h2>

            <h3 className="font-semibold text-sm uppercase text-brand-text-muted mt-4 mb-2">Por jogo</h3>
            <table className="w-full text-sm border-collapse">
              <tbody>
                <ScoreRow label="Placar exato" value={scoring.exact} />
                <ScoreRow label="Vencedor correto OU empate (placar errado)" value={scoring.winnerOrDraw} />
                <ScoreRow label="Erro completo" value={0} />
                <ScoreRow
                  label="Mata-mata: bônus por acertar quem se classifica (com placar errado)"
                  value={scoring.knockoutAdvancingBonus}
                  prefix="+"
                />
              </tbody>
            </table>

            <h3 className="font-semibold text-sm uppercase text-brand-text-muted mt-6 mb-2">Palpites especiais</h3>
            <table className="w-full text-sm border-collapse">
              <tbody>
                <ScoreRow label="Campeão" value={scoring.specials.champion} />
                <ScoreRow label="Vice" value={scoring.specials.runnerup} />
                <ScoreRow label="3º lugar" value={scoring.specials.third} />
                <ScoreRow label="Artilheiro" value={scoring.specials.topScorer} />
                <ScoreRow label="1ª eliminada na fase de grupos" value={scoring.specials.firstEliminated} />
                <ScoreRow label="Seleção surpresa (chega às quartas)" value={scoring.specials.surprise} />
              </tbody>
            </table>

            <p className="text-xs text-brand-text-muted mt-4">
              Os pesos podem ser ajustados pelo administrador do bolão antes do início da Copa.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function ScoreRow({ label, value, prefix }: { label: string; value: number; prefix?: string }) {
  return (
    <tr className="border-b border-brand-border last:border-0">
      <td className="py-2 pr-4">{label}</td>
      <td className="py-2 text-right font-mono font-semibold whitespace-nowrap">
        {prefix ?? ""}{value} {value === 1 ? "pt" : "pts"}
      </td>
    </tr>
  );
}
