"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { saveEmailPrefs } from "./actions";
import type { EmailPrefs } from "@/lib/email/prefs";

const FIELDS: { key: keyof EmailPrefs; label: string; description: string }[] = [
  { key: "reminders", label: "Lembretes de palpite", description: "Aviso quando faltam jogos sem palpite e o horário se aproxima" },
  { key: "recap", label: "Recap diário", description: "Resumo dos resultados e top 5 do dia" },
  { key: "broadcast", label: "Avisos do administrador", description: "Comunicados gerais (raro)" },
];

export function EmailPrefsForm({ initial }: { initial: EmailPrefs }) {
  const [prefs, setPrefs] = useState(initial);
  const [status, setStatus] = useState<string | null>(null);
  const [isPending, start] = useTransition();

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        setStatus(null);
        start(async () => {
          const r = await saveEmailPrefs(prefs);
          setStatus(r.ok ? "Salvo!" : "Erro");
        });
      }}
    >
      {FIELDS.map((f) => (
        <label key={f.key} className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={prefs[f.key]}
            onChange={(e) => setPrefs((p) => ({ ...p, [f.key]: e.target.checked }))}
            className="mt-1"
          />
          <span className="text-sm">
            <span className="font-medium">{f.label}</span>
            <span className="block text-brand-text-muted text-xs">{f.description}</span>
          </span>
        </label>
      ))}
      <Button type="submit" disabled={isPending} className="self-start mt-2">
        {isPending ? "Salvando…" : "Salvar"}
      </Button>
      {status && <p className="text-sm text-brand-text-muted">{status}</p>}
    </form>
  );
}
