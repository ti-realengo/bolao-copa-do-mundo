"use client";

import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { saveProfile } from "./actions";

export function ProfileForm({
  initialName,
  initialAvatarUrl,
  email,
}: {
  initialName: string;
  initialAvatarUrl: string | null;
  email: string;
}) {
  const [name, setName] = useState(initialName);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);
  const [isPending, start] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleUpload(file: File) {
    setUploading(true);
    setStatus(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload/avatar", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        setStatus({ kind: "err", msg: data?.error ?? "Falha no upload" });
        return;
      }
      setAvatarUrl(data.url);
    } catch {
      setStatus({ kind: "err", msg: "Falha no upload" });
    } finally {
      setUploading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);
    if (name.trim().length < 2) {
      setStatus({ kind: "err", msg: "Nome muito curto" });
      return;
    }
    start(async () => {
      const res = await saveProfile({ name, avatarUrl });
      if (res.ok) setStatus({ kind: "ok", msg: "Perfil atualizado!" });
      else setStatus({ kind: "err", msg: res.error ?? "Erro ao salvar" });
    });
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <div className="flex items-center gap-4">
        <div className="h-20 w-20 overflow-hidden rounded-full border border-brand-border bg-brand-surface flex items-center justify-center">
          {avatarUrl ? (
            <Image src={avatarUrl} alt="avatar" width={80} height={80} className="h-full w-full object-cover" unoptimized />
          ) : (
            <span className="text-xs text-brand-text-muted">sem foto</span>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleUpload(f);
              e.target.value = "";
            }}
          />
          <Button type="button" size="sm" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading}>
            {uploading ? "Enviando…" : avatarUrl ? "Trocar foto" : "Enviar foto"}
          </Button>
          {avatarUrl && (
            <Button type="button" size="sm" variant="ghost" onClick={() => setAvatarUrl(null)}>
              Remover foto
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium">Nome</label>
        <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={50} required />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium">Email</label>
        <Input value={email} disabled />
        <p className="text-xs text-brand-text-muted">O email é usado para login e não pode ser alterado.</p>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending}>{isPending ? "Salvando…" : "Salvar"}</Button>
        {status && (
          <span className={`text-sm ${status.kind === "ok" ? "text-emerald-600" : "text-red-500"}`}>
            {status.msg}
          </span>
        )}
      </div>
    </form>
  );
}
