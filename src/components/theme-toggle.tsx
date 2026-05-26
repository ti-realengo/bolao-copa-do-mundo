"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

type Theme = "light" | "dark" | "system";

function readCookie(): Theme {
  if (typeof document === "undefined") return "system";
  const m = document.cookie.match(/(?:^|; )bolao_theme=([^;]+)/);
  return (m?.[1] as Theme) ?? "system";
}

function apply(theme: Theme) {
  const html = document.documentElement;
  const resolved = theme === "system"
    ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
    : theme;
  html.classList.toggle("dark", resolved === "dark");
  document.cookie = `bolao_theme=${theme}; path=/; max-age=${60 * 60 * 24 * 365}`;
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    setTheme(readCookie());
  }, []);

  function cycle() {
    const next: Theme = theme === "light" ? "dark" : theme === "dark" ? "system" : "light";
    setTheme(next);
    apply(next);
  }

  const isDark = theme === "dark" || (theme === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  return (
    <button
      type="button"
      onClick={cycle}
      title={`Tema: ${theme}`}
      className="p-2 rounded-lg hover:bg-brand-surface text-brand-text-muted hover:text-brand-text"
      aria-label="Alternar tema"
    >
      {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );
}
