"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { submitLogin } from "./actions";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        startTransition(async () => {
          const res = await submitLogin({ email, password });
          if (!res.ok) setError(res.error ?? "Erro");
        });
      }}
    >
      <Input
        type="email"
        placeholder="seu.email@empresa.com.br"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        autoFocus
      />
      <Input
        type="password"
        placeholder="Sua senha"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <Button type="submit" disabled={isPending || !email || !password}>
        {isPending ? "Entrando…" : "Entrar"}
      </Button>
      {error && <p className="text-sm text-brand-danger text-center">{error}</p>}
      <p className="text-sm text-center text-brand-text-muted mt-2">
        Não tem conta?{" "}
        <Link href="/cadastro" className="text-brand-primary hover:underline">
          Cadastrar
        </Link>
      </p>
    </form>
  );
}
