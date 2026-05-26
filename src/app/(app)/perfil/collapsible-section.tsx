"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function CollapsibleSection({
  buttonLabel,
  closeLabel = "Fechar",
  children,
  defaultOpen = false,
}: {
  buttonLabel: string;
  closeLabel?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  if (!open) {
    return (
      <Button type="button" variant="outline" onClick={() => setOpen(true)}>
        ✏️ {buttonLabel}
      </Button>
    );
  }

  return (
    <div className="space-y-3">
      {children}
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="text-xs text-brand-text-muted hover:underline"
      >
        {closeLabel}
      </button>
    </div>
  );
}
