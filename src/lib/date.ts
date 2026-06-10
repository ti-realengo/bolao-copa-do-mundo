export const BR_TIMEZONE = "America/Sao_Paulo";

export function brDateFormat(
  options?: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: BR_TIMEZONE, ...options });
}

export function brDateKey(epochSeconds: number): string {
  return new Date(epochSeconds * 1000).toLocaleDateString("sv-SE", {
    timeZone: BR_TIMEZONE,
  });
}