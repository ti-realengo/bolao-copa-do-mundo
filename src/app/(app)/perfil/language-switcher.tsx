"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { saveLocale } from "./actions";

const OPTIONS: { code: "pt-BR" | "en" | "es"; label: string }[] = [
  { code: "pt-BR", label: "Português (BR)" },
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
];

export function LanguageSwitcher({ current, label, save }: { current: string; label: string; save: string }) {
  const [value, setValue] = useState(current);
  const [status, setStatus] = useState<string | null>(null);
  const [isPending, start] = useTransition();
  const router = useRouter();

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium">{label}</label>
      <div className="flex gap-2 flex-wrap">
        {OPTIONS.map((o) => (
          <button
            key={o.code}
            type="button"
            onClick={() => setValue(o.code)}
            className={`px-3 py-1.5 rounded-lg text-sm border ${value === o.code ? "border-brand-primary bg-brand-primary/10" : "border-brand-border"}`}
          >
            {o.label}
          </button>
        ))}
      </div>
      <Button
        type="button"
        size="sm"
        className="self-start mt-1"
        disabled={isPending || value === current}
        onClick={() => start(async () => {
          const r = await saveLocale(value);
          setStatus(r.ok ? "✓" : "Erro");
          if (r.ok) router.refresh();
        })}
      >
        {isPending ? "…" : save}
      </Button>
      {status && <span className="text-sm text-brand-text-muted">{status}</span>}
    </div>
  );
}
