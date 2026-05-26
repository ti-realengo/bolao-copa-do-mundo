"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const STORAGE_KEY = "bolao_pwa_dismissed";

export function InstallPwaBanner() {
  const [evt, setEvt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setDismissed(localStorage.getItem(STORAGE_KEY) === "1");

    const handler = (e: Event) => {
      e.preventDefault();
      setEvt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!evt || dismissed) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:max-w-sm bg-brand-card border border-brand-border rounded-2xl shadow-lg p-4 z-50">
      <div className="flex gap-3 items-start">
        <div className="text-2xl">📱</div>
        <div className="flex-1">
          <div className="font-semibold text-sm">Instalar o Bolão</div>
          <div className="text-xs text-brand-text-muted mt-1">
            Adicione à tela inicial pra acessar mais rápido durante a Copa.
          </div>
          <div className="flex gap-2 mt-3">
            <button
              className="text-xs bg-brand-primary text-white px-3 py-1.5 rounded-lg font-medium"
              onClick={async () => {
                await evt.prompt();
                const r = await evt.userChoice;
                if (r.outcome === "accepted" || r.outcome === "dismissed") setEvt(null);
              }}
            >
              Instalar
            </button>
            <button
              className="text-xs text-brand-text-muted px-2"
              onClick={() => {
                localStorage.setItem(STORAGE_KEY, "1");
                setDismissed(true);
              }}
            >
              Agora não
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
