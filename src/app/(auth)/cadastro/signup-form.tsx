"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { submitSignup } from "./actions";

export function SignupForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const passwordsMatch = password === confirm;
  const canSubmit = name.length >= 2 && email.includes("@") && password.length >= 12 && passwordsMatch && consent;

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        if (!passwordsMatch) {
          setError("Senhas não conferem");
          return;
        }
        startTransition(async () => {
          const res = await submitSignup({ email, password, name, consent });
          if (!res.ok) setError(res.error ?? "Erro ao criar conta");
        });
      }}
    >
      <Input
        type="text"
        placeholder="Seu nome"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        autoFocus
        minLength={2}
        maxLength={50}
      />
      <Input
        type="email"
        placeholder="seu.email@empresa.com.br"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <Input
        type="password"
        placeholder="Senha (mínimo 12 caracteres)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        minLength={12}
      />
      <Input
        type="password"
        placeholder="Confirme a senha"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        required
        minLength={12}
      />
      {confirm && !passwordsMatch && (
        <p className="text-xs text-brand-danger -mt-1">Senhas não conferem</p>
      )}

      <label className="flex items-start gap-2 text-sm text-brand-text-muted mt-1">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-1 shrink-0"
          required
        />
        <span>
          Li e aceito os{" "}
          <Link href="/termos" className="text-brand-primary hover:underline">
            Termos de Uso
          </Link>{" "}
          e a{" "}
          <Link href="/privacidade" className="text-brand-primary hover:underline">
            Política de Privacidade
          </Link>
          .
        </span>
      </label>

      <Button type="submit" disabled={isPending || !canSubmit}>
        {isPending ? "Criando conta…" : "Criar conta"}
      </Button>

      {error && <p className="text-sm text-brand-danger text-center">{error}</p>}

      <p className="text-sm text-center text-brand-text-muted mt-2">
        Já tem conta?{" "}
        <Link href="/login" className="text-brand-primary hover:underline">
          Entrar
        </Link>
      </p>
    </form>
  );
}
