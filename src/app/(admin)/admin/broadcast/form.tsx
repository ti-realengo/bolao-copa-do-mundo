"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { sendBroadcast } from "./actions";

export function BroadcastForm({ totalCount }: { totalCount: number }) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [isPending, start] = useTransition();

  const previewHtml = body
    .split("\n\n")
    .map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br/>")}</p>`)
    .join("");

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium">Assunto</label>
        <Input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          maxLength={120}
          placeholder="Ex: Lembrete da rodada de hoje"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium">Mensagem</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={8}
          maxLength={3000}
          placeholder="Texto plano. Linhas em branco viram parágrafos."
          className="w-full rounded-xl border border-brand-border bg-brand-card p-3 text-sm resize-y"
        />
        <span className="text-xs text-brand-text-muted">{body.length}/3000</span>
      </div>

      {body && (
        <div className="rounded-xl border border-brand-border bg-brand-surface p-4">
          <div className="text-xs uppercase text-brand-text-muted mb-2">Preview</div>
          <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: previewHtml }} />
        </div>
      )}

      {!confirming ? (
        <Button
          type="button"
          disabled={!subject || body.trim().length < 10}
          onClick={() => setConfirming(true)}
        >
          Revisar e enviar
        </Button>
      ) : (
        <div className="flex flex-col gap-2 rounded-xl border-2 border-brand-primary bg-brand-primary/5 p-4">
          <p className="text-sm">
            Confirmar envio para <strong>{totalCount}</strong> participantes? Não dá pra desfazer.
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              disabled={isPending}
              onClick={() => start(async () => {
                const r = await sendBroadcast({ subject, body });
                setResult(r.ok ? `✓ ${r.sent} enviados` : `Erro: ${r.error}`);
                if (r.ok) {
                  setSubject("");
                  setBody("");
                }
                setConfirming(false);
              })}
            >
              {isPending ? "Enviando…" : "Confirmar envio"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setConfirming(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {result && <p className="text-sm">{result}</p>}
    </div>
  );
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}
