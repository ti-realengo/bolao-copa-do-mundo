"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { deleteAccount } from "./actions";

export function DangerZone({ canDelete }: { canDelete: boolean }) {
  const [isPending, start] = useTransition();
  return (
    <div className="space-y-3">
      <a href="/api/export-data" download>
        <Button variant="outline" type="button">📥 Exportar meus dados</Button>
      </a>
      {canDelete && (
        <div>
          <Button
            variant="outline"
            type="button"
            disabled={isPending}
            onClick={() => {
              if (!confirm("Excluir sua conta? Seu nome e email serão anonimizados. Você sairá imediatamente.")) return;
              start(async () => { await deleteAccount(); });
            }}
            className="border-red-300 text-red-600 hover:bg-red-50"
          >
            {isPending ? "Excluindo…" : "Excluir minha conta"}
          </Button>
          <p className="text-xs text-brand-text-muted mt-1">
            Soft delete imediato. Exclusão definitiva em 30 dias (job mensal).
          </p>
        </div>
      )}
    </div>
  );
}
