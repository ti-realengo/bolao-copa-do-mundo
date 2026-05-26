import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getRulesMarkdown, DEFAULT_RULES_MD } from "@/lib/rules";
import { loadScoringConfig } from "@/lib/scoring/config";
import { RulesEditor } from "./rules-editor";
import { ScoringEditor } from "./scoring-editor";

export const dynamic = "force-dynamic";

export default async function AdminRegrasPage() {
  const [md, scoring] = await Promise.all([getRulesMarkdown(), loadScoringConfig()]);
  const isCustom = md !== DEFAULT_RULES_MD;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-display text-3xl font-bold">Regras & pontuação</h1>
        <p className="text-sm text-brand-text-muted mt-1">
          Customize o conteúdo da página &quot;como funciona&quot; e os pesos de pontuação.
          Mudanças nos pesos disparam recálculo automático do ranking.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Conteúdo de /regras (Markdown)
            {!isCustom && <span className="ml-2 text-xs font-normal text-brand-text-muted">— usando padrão</span>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RulesEditor initial={md} defaultContent={DEFAULT_RULES_MD} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pesos de pontuação</CardTitle>
        </CardHeader>
        <CardContent>
          <ScoringEditor initial={scoring} />
        </CardContent>
      </Card>
    </div>
  );
}
