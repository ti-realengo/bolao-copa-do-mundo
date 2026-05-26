"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { saveSpecials } from "./actions";

interface Team {
  id: number;
  name: string;
  group: string | null;
}

interface Initial {
  championTeamId: number | null;
  runnerupTeamId: number | null;
  thirdTeamId: number | null;
  topScorerName: string;
  firstEliminatedTeamId: number | null;
  surpriseTeamId: number | null;
}

const FIELDS: { key: keyof Omit<Initial, "topScorerName">; label: string }[] = [
  { key: "championTeamId", label: "Campeão" },
  { key: "runnerupTeamId", label: "Vice-campeão" },
  { key: "thirdTeamId", label: "3º lugar" },
  { key: "firstEliminatedTeamId", label: "1ª eliminada na fase de grupos" },
  { key: "surpriseTeamId", label: "Seleção surpresa (chega às quartas)" },
];

export function SpecialsForm({ teams, isLocked, initial }: { teams: Team[]; isLocked: boolean; initial: Initial | null }) {
  const [values, setValues] = useState<Initial>(initial ?? {
    championTeamId: null, runnerupTeamId: null, thirdTeamId: null,
    topScorerName: "", firstEliminatedTeamId: null, surpriseTeamId: null,
  });
  const [status, setStatus] = useState<string | null>(null);
  const [isPending, start] = useTransition();

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        setStatus(null);
        start(async () => {
          const res = await saveSpecials(values);
          setStatus(res.ok ? "Salvo!" : (res.error ?? "Erro"));
        });
      }}
    >
      {FIELDS.map((f) => (
        <div key={f.key} className="flex flex-col gap-1">
          <label className="text-sm font-medium">{f.label}</label>
          <select
            disabled={isLocked}
            value={values[f.key] ?? ""}
            onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value ? Number(e.target.value) : null }))}
            className="h-10 rounded-xl border border-brand-border bg-brand-card px-3 text-sm"
          >
            <option value="">— escolha —</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}{t.group ? ` (${t.group})` : ""}
              </option>
            ))}
          </select>
        </div>
      ))}

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium">Artilheiro (nome do jogador)</label>
        <Input
          disabled={isLocked}
          value={values.topScorerName}
          onChange={(e) => setValues((v) => ({ ...v, topScorerName: e.target.value }))}
          placeholder="Ex: Vinícius Júnior"
          maxLength={80}
        />
      </div>

      {!isLocked && (
        <Button type="submit" disabled={isPending}>
          {isPending ? "Salvando…" : "Salvar palpites"}
        </Button>
      )}

      {status && <p className="text-sm text-brand-text-muted">{status}</p>}
    </form>
  );
}
