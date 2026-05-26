"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { syncMatches, recomputeAll } from "./actions";

export function SyncButton() {
  const [isPending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <div className="flex flex-col gap-1">
      <Button onClick={() => start(async () => { const r = await syncMatches(); setMsg(r.ok ? `✓ ${r.message}` : `Erro: ${r.error}`); })} disabled={isPending}>
        {isPending ? "Sincronizando…" : "Sincronizar com Football-Data"}
      </Button>
      {msg && <span className="text-xs">{msg}</span>}
    </div>
  );
}

export function RecomputeButton() {
  const [isPending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <div className="flex flex-col gap-1">
      <Button variant="outline" onClick={() => start(async () => { const r = await recomputeAll(); setMsg(r.ok ? `✓ ${r.message}` : `Erro`); })} disabled={isPending}>
        {isPending ? "Recalculando…" : "Recalcular tudo"}
      </Button>
      {msg && <span className="text-xs">{msg}</span>}
    </div>
  );
}
