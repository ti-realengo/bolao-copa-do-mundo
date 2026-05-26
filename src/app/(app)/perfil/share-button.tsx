"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function ShareRankButton({ userId }: { userId: string }) {
  const [copied, setCopied] = useState(false);
  const ogUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/api/og/rank/${userId}`;

  async function handleShare() {
    const url = ogUrl;
    const text = "Confere meu bolão da Copa 2026 ⚽";
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({ title: "Bolão Copa 2026", text, url });
        return;
      } catch {}
    }
    try {
      await navigator.clipboard.writeText(`${text} ${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  return (
    <Button variant="outline" onClick={handleShare} type="button">
      {copied ? "✓ Link copiado" : "Compartilhar minha posição"}
    </Button>
  );
}
