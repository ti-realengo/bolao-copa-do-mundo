"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { backupToR2 } from "./actions";

export function BackupButton() {
  const [result, setResult] = useState<string | null>(null);
  const [isPending, start] = useTransition();

  return (
    <div className="space-y-3">
      <Button
        type="button"
        disabled={isPending}
        onClick={() => start(async () => {
          const r = await backupToR2();
          if (r.ok) {
            setResult(`✓ Backup criado: ${r.filename}`);
          } else {
            setResult(`Erro: ${r.error}`);
          }
        })}
      >
        {isPending ? "Exportando…" : "Exportar backup"}
      </Button>
      {result && (
        <p className={`text-sm ${result.startsWith("✓") ? "text-green-600" : "text-red-600"}`}>
          {result}
        </p>
      )}
    </div>
  );
}