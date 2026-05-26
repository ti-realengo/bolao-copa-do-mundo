"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createLeague } from "../actions";

export function CreateLeagueForm() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isOpen, setIsOpen] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, start] = useTransition();

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        start(async () => {
          const r = await createLeague({ name, description, isOpen });
          if (!r.ok) setError(r.error ?? "Erro");
        });
      }}
    >
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium">Nome</label>
        <Input value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={60} />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium">Descrição (opcional)</label>
        <Input value={description} onChange={(e) => setDescription(e.target.value)} maxLength={280} />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={isOpen} onChange={(e) => setIsOpen(e.target.checked)} />
        Aberto: qualquer um com o link entra (caso contrário, requer aprovação)
      </label>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <Button type="submit" disabled={isPending || name.length < 2}>
        {isPending ? "Criando…" : "Criar grupo"}
      </Button>
    </form>
  );
}
