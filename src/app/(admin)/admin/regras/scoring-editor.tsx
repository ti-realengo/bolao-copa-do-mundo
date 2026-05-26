"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { saveScoring } from "./actions";
import type { ScoringConfig } from "@/lib/scoring/config-types";
import { DEFAULT_SCORING } from "@/lib/scoring/config-types";

interface FieldDef {
  path: string;
  label: string;
  hint?: string;
}

const MATCH_FIELDS: FieldDef[] = [
  { path: "exact", label: "Placar exato", hint: "Pontos quando o usuário acerta o placar exato." },
  { path: "winnerOrDraw", label: "Vencedor correto / empate", hint: "Acertou quem ganhou (ou empate) com placar errado." },
  { path: "knockoutAdvancingBonus", label: "Bônus mata-mata", hint: "Pontos extras por acertar quem se classifica (placar errado)." },
];

const SPECIAL_FIELDS: FieldDef[] = [
  { path: "specials.champion", label: "Campeão" },
  { path: "specials.runnerup", label: "Vice-campeão" },
  { path: "specials.third", label: "3º lugar" },
  { path: "specials.topScorer", label: "Artilheiro" },
  { path: "specials.firstEliminated", label: "1ª eliminada" },
  { path: "specials.surprise", label: "Seleção surpresa" },
];

function getByPath(obj: ScoringConfig, path: string): number {
  if (path.startsWith("specials.")) {
    const k = path.slice("specials.".length) as keyof ScoringConfig["specials"];
    return obj.specials[k];
  }
  return (obj as unknown as Record<string, number>)[path];
}

function setByPath(obj: ScoringConfig, path: string, value: number): ScoringConfig {
  if (path.startsWith("specials.")) {
    const k = path.slice("specials.".length) as keyof ScoringConfig["specials"];
    return { ...obj, specials: { ...obj.specials, [k]: value } };
  }
  return { ...obj, [path]: value };
}

export function ScoringEditor({ initial }: { initial: ScoringConfig }) {
  const [config, setConfig] = useState<ScoringConfig>(initial);
  const [status, setStatus] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);
  const [isPending, start] = useTransition();

  function update(path: string, value: string) {
    const n = parseInt(value, 10);
    if (isNaN(n) || n < 0 || n > 100) return;
    setConfig((c) => setByPath(c, path, n));
    setStatus(null);
  }

  return (
    <div className="space-y-5">
      <Section title="Por jogo" fields={MATCH_FIELDS} config={config} onChange={update} />
      <Section title="Palpites especiais" fields={SPECIAL_FIELDS} config={config} onChange={update} />

      <p className="text-xs text-brand-text-muted">
        Salvar dispara <strong>recálculo de toda a pontuação e do ranking</strong> com os novos pesos.
      </p>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          disabled={isPending || JSON.stringify(config) === JSON.stringify(initial)}
          onClick={() => start(async () => {
            const r = await saveScoring(config);
            setStatus(r.ok
              ? { kind: "ok", msg: `✓ Salvo. ${r.message ?? ""}` }
              : { kind: "err", msg: r.error ?? "Erro" });
          })}
        >
          {isPending ? "Salvando + recalculando…" : "Salvar e recalcular"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={() => setConfig(DEFAULT_SCORING)}
        >
          Restaurar padrão
        </Button>
      </div>

      {status && (
        <p className={`text-sm ${status.kind === "ok" ? "text-emerald-600" : "text-red-500"}`}>
          {status.msg}
        </p>
      )}
    </div>
  );
}

function Section({ title, fields, config, onChange }: {
  title: string;
  fields: FieldDef[];
  config: ScoringConfig;
  onChange: (path: string, value: string) => void;
}) {
  return (
    <div>
      <h3 className="font-semibold text-sm uppercase text-brand-text-muted mb-3">{title}</h3>
      <div className="space-y-2">
        {fields.map((f) => (
          <div key={f.path} className="grid grid-cols-[1fr_auto] gap-3 items-center">
            <div>
              <div className="text-sm font-medium">{f.label}</div>
              {f.hint && <div className="text-xs text-brand-text-muted">{f.hint}</div>}
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                max={100}
                value={getByPath(config, f.path)}
                onChange={(e) => onChange(f.path, e.target.value)}
                className="w-20 text-center font-mono"
              />
              <span className="text-xs text-brand-text-muted">pts</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
