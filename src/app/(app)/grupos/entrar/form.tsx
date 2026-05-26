"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { joinLeague } from "../actions";

export function JoinLeagueForm() {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, start] = useTransition();
  const router = useRouter();

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        start(async () => {
          const r = await joinLeague({ inviteCode: code });
          if (!r.ok) {
            setError(r.error ?? "Erro");
          } else if (r.leagueId) {
            router.push(`/grupos/${r.leagueId}`);
          }
        });
      }}
    >
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium">Código do convite</label>
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="bola-XXXX-YYYY"
          required
          autoFocus
        />
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <Button type="submit" disabled={isPending || code.length < 4}>
        {isPending ? "Entrando…" : "Entrar"}
      </Button>
    </form>
  );
}
