"use client";

import Image from "next/image";
import { useMemo, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { savePrizes } from "./actions";

interface Prize {
  position: number;
  title: string;
  description?: string;
  link?: string;
  imageUrl?: string;
}

function parseInitial(initial: string): Prize[] {
  try {
    const parsed = JSON.parse(initial);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((p) => ({
        position: Number(p?.position) || 0,
        title: typeof p?.title === "string" ? p.title : "",
        description: typeof p?.description === "string" ? p.description : "",
        link: typeof p?.link === "string" ? p.link : "",
        imageUrl: typeof p?.imageUrl === "string" ? p.imageUrl : "",
      }))
      .sort((a, b) => a.position - b.position);
  } catch {
    return [];
  }
}

function PrizeImage({
  url,
  uploading,
  onUpload,
  onRemove,
}: {
  url: string;
  uploading: boolean;
  onUpload: (file: File) => void;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="h-24 w-24 overflow-hidden rounded-lg border border-brand-border bg-brand-surface flex items-center justify-center">
        {url ? (
          <Image src={url} alt="prêmio" width={96} height={96} className="h-full w-full object-cover" unoptimized />
        ) : (
          <span className="text-[10px] text-brand-text-muted text-center px-2">sem imagem</span>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onUpload(f);
          e.target.value = "";
        }}
      />
      <div className="flex flex-col gap-1 w-24">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? "Enviando…" : url ? "Trocar" : "Enviar"}
        </Button>
        {url && (
          <Button type="button" size="sm" variant="ghost" onClick={onRemove}>
            Remover
          </Button>
        )}
      </div>
    </div>
  );
}

export function PrizesEditor({ initial }: { initial: string }) {
  const [prizes, setPrizes] = useState<Prize[]>(() => parseInitial(initial));
  const [status, setStatus] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [isPending, start] = useTransition();

  const nextPosition = useMemo(() => {
    if (prizes.length === 0) return 1;
    return Math.max(...prizes.map((p) => p.position)) + 1;
  }, [prizes]);

  function update(index: number, patch: Partial<Prize>) {
    setPrizes((prev) => prev.map((p, i) => (i === index ? { ...p, ...patch } : p)));
    setStatus(null);
  }

  function add() {
    setPrizes((prev) => [...prev, { position: nextPosition, title: "", description: "", link: "", imageUrl: "" }]);
    setStatus(null);
  }

  function remove(index: number) {
    setPrizes((prev) => prev.filter((_, i) => i !== index));
    setStatus(null);
  }

  function move(index: number, dir: -1 | 1) {
    setPrizes((prev) => {
      const target = index + dir;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    setStatus(null);
  }

  async function uploadImage(index: number, file: File) {
    setUploadingIndex(index);
    setStatus(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "prizes");
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        setStatus({ kind: "err", msg: data?.error ?? "Falha no upload" });
        return;
      }
      update(index, { imageUrl: data.url });
    } catch {
      setStatus({ kind: "err", msg: "Falha no upload" });
    } finally {
      setUploadingIndex(null);
    }
  }

  function handleSave() {
    for (const p of prizes) {
      if (!p.title.trim()) {
        setStatus({ kind: "err", msg: "Todo prêmio precisa de um título." });
        return;
      }
      if (!Number.isInteger(p.position) || p.position < 1) {
        setStatus({ kind: "err", msg: "A posição precisa ser um número inteiro a partir de 1." });
        return;
      }
      if (p.link?.trim() && !/^https?:\/\//i.test(p.link.trim())) {
        setStatus({ kind: "err", msg: "Os links devem começar com http:// ou https://" });
        return;
      }
    }
    const positions = prizes.map((p) => p.position);
    if (new Set(positions).size !== positions.length) {
      setStatus({ kind: "err", msg: "Há posições duplicadas — cada prêmio precisa de uma posição única." });
      return;
    }

    const payload = prizes
      .map((p) => ({
        position: p.position,
        title: p.title.trim(),
        ...(p.description?.trim() ? { description: p.description.trim() } : {}),
        ...(p.link?.trim() ? { link: p.link.trim() } : {}),
        ...(p.imageUrl?.trim() ? { imageUrl: p.imageUrl.trim() } : {}),
      }))
      .sort((a, b) => a.position - b.position);

    start(async () => {
      const res = await savePrizes(JSON.stringify(payload));
      if (res.ok) setStatus({ kind: "ok", msg: "Prêmios salvos!" });
      else setStatus({ kind: "err", msg: res.error ?? "Erro ao salvar." });
    });
  }

  return (
    <div className="space-y-4">
      {prizes.length === 0 && (
        <p className="text-sm text-brand-text-muted">
          Nenhum prêmio cadastrado. Clique em <strong>Adicionar prêmio</strong> para começar.
        </p>
      )}

      <div className="space-y-3">
        {prizes.map((p, i) => (
          <div
            key={i}
            className="grid gap-4 rounded-xl border border-brand-border bg-brand-card/40 p-4 md:grid-cols-[auto_80px_1fr_auto]"
          >
            <PrizeImage
              url={p.imageUrl ?? ""}
              uploading={uploadingIndex === i}
              onUpload={(f) => uploadImage(i, f)}
              onRemove={() => update(i, { imageUrl: "" })}
            />

            <div className="flex flex-col gap-1">
              <label className="text-xs text-brand-text-muted">Posição</label>
              <Input
                type="number"
                min={1}
                value={p.position}
                onChange={(e) => update(i, { position: Number(e.target.value) || 0 })}
              />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-brand-text-muted">Título</label>
                <Input
                  value={p.title}
                  placeholder="Ex: Camisa oficial do Brasil"
                  onChange={(e) => update(i, { title: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-brand-text-muted">Descrição (opcional)</label>
                <Input
                  value={p.description ?? ""}
                  placeholder="Detalhe opcional sobre o prêmio"
                  onChange={(e) => update(i, { description: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-brand-text-muted">Link (opcional)</label>
                <Input
                  value={p.link ?? ""}
                  placeholder="https://magazineluiza.com.br/..."
                  onChange={(e) => update(i, { link: e.target.value })}
                />
              </div>
            </div>

            <div className="flex flex-row items-start gap-1 md:flex-col md:items-stretch">
              <Button type="button" variant="ghost" size="sm" onClick={() => move(i, -1)} disabled={i === 0} title="Subir">
                ↑
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => move(i, 1)}
                disabled={i === prizes.length - 1}
                title="Descer"
              >
                ↓
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => remove(i)} title="Remover">
                Remover
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-2">
        <Button type="button" variant="outline" onClick={add}>
          + Adicionar prêmio
        </Button>
        <Button type="button" onClick={handleSave} disabled={isPending}>
          {isPending ? "Salvando…" : "Salvar"}
        </Button>
        {status && (
          <span className={`text-sm ${status.kind === "ok" ? "text-emerald-600" : "text-red-500"}`}>
            {status.msg}
          </span>
        )}
      </div>
    </div>
  );
}
