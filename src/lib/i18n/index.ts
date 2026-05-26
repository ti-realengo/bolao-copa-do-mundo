import { cookies, headers } from "next/headers";
import { ptBR, type Messages } from "./messages/pt-BR";
import { en } from "./messages/en";
import { es } from "./messages/es";

export const LOCALES = ["pt-BR", "en", "es"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "pt-BR";

const MESSAGES: Record<Locale, Messages> = { "pt-BR": ptBR, en, es };

export type { Messages };

const COOKIE_NAME = "bolao_locale";

function negotiateFromAccept(header: string | null): Locale {
  if (!header) return DEFAULT_LOCALE;
  const lower = header.toLowerCase();
  if (lower.includes("pt")) return "pt-BR";
  if (lower.includes("es")) return "es";
  if (lower.includes("en")) return "en";
  return DEFAULT_LOCALE;
}

export async function getLocale(): Promise<Locale> {
  try {
    const cookieStore = await cookies();
    const cookieValue = cookieStore.get(COOKIE_NAME)?.value;
    if (cookieValue && (LOCALES as readonly string[]).includes(cookieValue)) {
      return cookieValue as Locale;
    }
    const h = await headers();
    return negotiateFromAccept(h.get("accept-language"));
  } catch {
    return DEFAULT_LOCALE;
  }
}

export async function getMessages(locale?: Locale): Promise<Messages> {
  const l = locale ?? (await getLocale());
  return MESSAGES[l];
}

export function t(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));
}
