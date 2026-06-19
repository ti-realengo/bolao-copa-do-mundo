"use client";

import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";

const OPTIONS = [
  { value: "all", label: "Todos os jogos" },
  { value: "group", label: "Fase de Grupos" },
  { value: "knockout", label: "Mata-mata" },
  { value: "mine", label: "Meus jogos" },
];

interface Props {
  current: string;
  group: string;
  view: string;
}

export function FilterSelect({ current, group, view }: Props) {
  const router = useRouter();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const sp = new URLSearchParams();
    const val = e.target.value;
    if (val !== "all") sp.set("filter", val);
    if (val !== "knockout" && group !== "all") sp.set("group", group);
    if (view !== "grid") sp.set("view", view);
    const qs = sp.toString();
    router.push(`/jogos${qs ? `?${qs}` : ""}`);
  }

  return (
    <div className="relative">
      <select
        defaultValue={current}
        onChange={onChange}
        className="appearance-none rounded-xl bg-brand-card border border-brand-border pl-4 pr-9 py-2 text-sm text-brand-text-muted hover:text-brand-text hover:border-brand-border-strong focus:outline-none focus:ring-2 focus:ring-brand-primary/30 cursor-pointer"
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-text-muted pointer-events-none" />
    </div>
  );
}