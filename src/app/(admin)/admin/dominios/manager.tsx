"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addDomain, removeDomain } from "./actions";

interface Domain {
  id: number;
  domain: string;
  isWildcard: number;
}

export function DomainsManager({ initial }: { initial: Domain[] }) {
  const [list, setList] = useState(initial);
  const [domain, setDomain] = useState("");
  const [wildcard, setWildcard] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <form
        className="flex gap-2 items-center"
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          startTransition(async () => {
            const res = await addDomain({ domain, isWildcard: wildcard });
            if (res.ok && res.created) {
              setList((l) => [...l, res.created!]);
              setDomain("");
              setWildcard(false);
            } else {
              setError(res.error ?? "Erro");
            }
          });
        }}
      >
        <Input
          placeholder="empresa.com.br"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          required
        />
        <label className="text-sm flex items-center gap-1">
          <input type="checkbox" checked={wildcard} onChange={(e) => setWildcard(e.target.checked)} />
          subdomínios
        </label>
        <Button type="submit" disabled={isPending || !domain}>Adicionar</Button>
      </form>
      {error && <p className="text-sm text-red-500">{error}</p>}

      <ul className="divide-y divide-brand-border">
        {list.map((d) => (
          <li key={d.id} className="flex items-center justify-between py-2 text-sm">
            <span className="font-mono">
              {d.isWildcard ? `*.${d.domain}` : d.domain}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                startTransition(async () => {
                  const res = await removeDomain(d.id);
                  if (res.ok) setList((l) => l.filter((x) => x.id !== d.id));
                });
              }}
            >
              remover
            </Button>
          </li>
        ))}
        {list.length === 0 && (
          <li className="text-sm text-brand-text-muted py-4">Nenhum domínio cadastrado.</li>
        )}
      </ul>
    </div>
  );
}
