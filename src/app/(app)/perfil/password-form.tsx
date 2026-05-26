"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { changeOwnPassword } from "./actions";

export function PasswordForm({ hasPassword }: { hasPassword: boolean }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);
  const [isPending, start] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);
    if (next.length < 12) {
      setStatus({ kind: "err", msg: "Mínimo 12 caracteres" });
      return;
    }
    if (next !== confirm) {
      setStatus({ kind: "err", msg: "Senhas não conferem" });
      return;
    }
    start(async () => {
      const res = await changeOwnPassword({ current: hasPassword ? current : undefined, next });
      if (res.ok) {
        setStatus({ kind: "ok", msg: hasPassword ? "Senha atualizada!" : "Senha definida!" });
        setCurrent("");
        setNext("");
        setConfirm("");
      } else {
        setStatus({ kind: "err", msg: res.error ?? "Erro" });
      }
    });
  }

  return (
    <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
      {!hasPassword && (
        <p className="text-sm text-brand-text-muted">
          Você ainda não tem uma senha definida. Defina uma agora pra acessar o bolão.
        </p>
      )}
      {hasPassword && (
        <Input
          type="password"
          placeholder="Senha atual"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          required
        />
      )}
      <Input
        type="password"
        placeholder="Nova senha (mín 12 caracteres)"
        value={next}
        onChange={(e) => setNext(e.target.value)}
        required
        minLength={12}
      />
      <Input
        type="password"
        placeholder="Confirme a nova senha"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        required
        minLength={12}
      />
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Salvando…" : hasPassword ? "Trocar senha" : "Definir senha"}
        </Button>
        {status && (
          <span className={`text-sm ${status.kind === "ok" ? "text-emerald-600" : "text-red-500"}`}>
            {status.msg}
          </span>
        )}
      </div>
    </form>
  );
}
