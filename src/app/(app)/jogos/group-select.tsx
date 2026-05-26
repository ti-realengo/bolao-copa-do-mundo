"use client";

import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";

interface Props {
  groupCodes: string[];
  current: string;
  filter: string;
  view: string;
}

export function GroupSelect({ groupCodes, current, filter, view }: Props) {
  const router = useRouter();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const sp = new URLSearchParams();
    if (filter !== "all") sp.set("filter", filter);
    if (view !== "grid") sp.set("view", view);
    if (e.target.value !== "all") sp.set("group", e.target.value);
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
        <option value="all">Todos os grupos</option>
        {groupCodes.map((g) => (
          <option key={g} value={g}>
            Grupo {g}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-text-muted pointer-events-none" />
    </div>
  );
}
