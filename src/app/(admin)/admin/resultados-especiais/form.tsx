"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { saveSpecialResults } from "./actions";

interface Team { id: number; name: string; }

interface Results {
  championTeamId: number | null;
  runnerupTeamId: number | null;
  thirdTeamId: number | null;
  topScorerName: string | null;
  firstEliminatedTeamId: number | null;
  surpriseTeamId: number | null;
}

const FIELDS: { key: keyof Omit<Results, "topScorerName">; label: string }[] = [
  { key: "championTeamId", label: "Campeão" },
  { key: "runnerupTeamId", label: "Vice-campeão" },
  { key: "thirdTeamId", label: "3º lugar" },
  { key: "firstEliminatedTeamId", label: "1ª eliminada na fase de grupos" },
  { key: "surpriseTeamId", label: "Seleção surpresa" },
];

function parseInitial(json: string): Results {
  try {
    const parsed = JSON.parse(json);
    return {
      championTeamId: parsed.championTeamId ?? null,
      runnerupTeamId: parsed.runnerupTeamId ?? null,
      thirdTeamId: parsed.thirdTeamId ?? null,
      topScorerName: parsed.topScorerName ?? "",
      firstEliminatedTeamId: parsed.firstEliminatedTeamId ?? null,
      surpriseTeamId: parsed.surpriseTeamId ?? null,
    };
  } catch {
    return { championTeamId: null, runnerupTeamId: null, thirdTeamId: null, topScorerName: "", firstEliminatedTeamId: null, surpriseTeamId: null };
  }
}

export function SpecialResultsForm({ teams, initialJson }: { teams: Team[]; initialJson: string }) {
  const [values, setValues] = useState<Results>(parseInitial(initialJson));
  const [status, setStatus] = useState<string | null>(null);
  const [isPending, start] = useTransition();

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        setStatus(null);
        start(async () => {
          const r = await saveSpecialResults(values);
          setStatus(r.ok ? `✓ ${r.message ?? "Salvo"}` : `Erro: ${r.error}`);
        });
      }}
    >
      {FIELDS.map((f) => (
        <div key={f.key} className="flex flex-col gap-1">
          <label className="text-sm font-medium">{f.label}</label>
          <select
            value={values[f.key] ?? ""}
            onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value ? Number(e.target.value) : null }))}
            className="h-10 rounded-xl border border-brand-border bg-brand-card px-3 text-sm"
          >
            <option value="">— não definido —</option>
            {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
      ))}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium">Artilheiro (nome)</label>
        <Input
          value={values.topScorerName ?? ""}
          onChange={(e) => setValues((v) => ({ ...v, topScorerName: e.target.value }))}
          maxLength={80}
        />
      </div>
      <Button type="submit" disabled={isPending}>{isPending ? "Salvando…" : "Salvar e recalcular"}</Button>
      {status && <p className="text-sm">{status}</p>}
    </form>
  );
}
