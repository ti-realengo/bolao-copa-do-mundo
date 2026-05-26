"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { resetUserPassword } from "./actions";

interface Props {
  userId: string;
  userEmail: string;
}

export function ResetPasswordButton({ userId, userEmail }: Props) {
  const [open, setOpen] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  function close() {
    setOpen(false);
    setTempPassword(null);
    setError(null);
    setCopied(false);
  }

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      const res = await resetUserPassword(userId);
      if (!res.ok || !res.password) {
        setError(res.error ?? "Erro ao resetar senha");
        return;
      }
      setTempPassword(res.password);
    });
  }

  async function copyToClipboard() {
    if (!tempPassword) return;
    try {
      await navigator.clipboard.writeText(tempPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }

  return (
    <>
      <Button type="button" size="sm" variant="outline" onClick={() => setOpen(true)}>
        Resetar senha
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={close} aria-hidden />
          <div className="relative w-full max-w-md rounded-2xl border border-brand-border bg-brand-card p-6 shadow-xl">
            {!tempPassword ? (
              <>
                <h2 className="font-display text-lg font-semibold mb-2">Resetar senha</h2>
                <p className="text-sm text-brand-text-muted mb-5">
                  Vai gerar uma senha temporária para <strong className="text-brand-text">{userEmail}</strong>.
                  No próximo login, o usuário será obrigado a definir uma nova senha.
                </p>
                {error && <p className="text-sm text-brand-danger mb-3">{error}</p>}
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="ghost" onClick={close} disabled={isPending}>
                    Cancelar
                  </Button>
                  <Button type="button" onClick={handleConfirm} disabled={isPending}>
                    {isPending ? "Gerando…" : "Confirmar reset"}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <h2 className="font-display text-lg font-semibold mb-2">Senha temporária gerada</h2>
                <p className="text-sm text-brand-text-muted mb-4">
                  Copie agora — <strong>não será mostrada de novo</strong>. Entregue ao usuário por canal seguro.
                </p>
                <div className="flex items-center gap-2 mb-5">
                  <code className="flex-1 rounded-lg border border-brand-border bg-brand-surface-2 px-3 py-2 font-mono text-sm break-all">
                    {tempPassword}
                  </code>
                  <Button type="button" size="sm" variant="outline" onClick={copyToClipboard}>
                    {copied ? "Copiado!" : "Copiar"}
                  </Button>
                </div>
                <div className="flex justify-end">
                  <Button type="button" onClick={close}>
                    Fechar
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
