"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { saveRules, resetRulesToDefault } from "./actions";

export function RulesEditor({ initial, defaultContent }: { initial: string; defaultContent: string }) {
  const [md, setMd] = useState(initial);
  const [status, setStatus] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isPending, start] = useTransition();

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-xs text-brand-text-muted">{md.length} caracteres · markdown</span>
        <button
          type="button"
          onClick={() => setShowPreview((v) => !v)}
          className="text-xs text-brand-accent hover:underline"
        >
          {showPreview ? "Ocultar preview" : "Ver preview"}
        </button>
      </div>

      <textarea
        value={md}
        onChange={(e) => setMd(e.target.value)}
        rows={20}
        className="w-full rounded-xl border border-brand-border bg-brand-card p-3 text-sm font-mono resize-y"
      />

      {showPreview && (
        <div className="rounded-xl border border-brand-border bg-brand-surface p-4 max-h-96 overflow-auto">
          <pre className="text-xs whitespace-pre-wrap break-words text-brand-text-muted">{md}</pre>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          disabled={isPending || md === initial}
          onClick={() => start(async () => {
            const r = await saveRules(md);
            setStatus(r.ok ? { kind: "ok", msg: "✓ Salvo" } : { kind: "err", msg: r.error ?? "Erro" });
          })}
        >
          {isPending ? "Salvando…" : "Salvar"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={isPending || md === defaultContent}
          onClick={() => setMd(defaultContent)}
        >
          Carregar padrão no editor
        </Button>
        <Button
          type="button"
          variant="ghost"
          disabled={isPending}
          onClick={() => {
            if (!confirm("Restaurar conteúdo padrão? A versão atual será perdida.")) return;
            start(async () => {
              const r = await resetRulesToDefault();
              if (r.ok) {
                setMd(defaultContent);
                setStatus({ kind: "ok", msg: "✓ Restaurado para padrão" });
              }
            });
          }}
        >
          Restaurar padrão
        </Button>
      </div>

      {status && (
        <p className={`text-sm ${status.kind === "ok" ? "text-emerald-600" : "text-red-500"}`}>
          {status.msg}
        </p>
      )}

      <details className="text-xs text-brand-text-muted">
        <summary className="cursor-pointer">Markdown suportado</summary>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li><code># Título</code>, <code>## Subtítulo</code>, <code>### Sub-sub</code></li>
          <li><code>**negrito**</code>, <code>*itálico*</code></li>
          <li><code>- item de lista</code> · <code>1. lista numerada</code></li>
          <li><code>[texto](url)</code> para links</li>
          <li>Tags HTML como <code>&lt;script&gt;</code> são removidas por segurança.</li>
        </ul>
      </details>
    </div>
  );
}
