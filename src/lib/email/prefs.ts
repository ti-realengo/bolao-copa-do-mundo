export interface EmailPrefs {
  reminders: boolean;
  recap: boolean;
  broadcast: boolean;
}

export const DEFAULT_PREFS: EmailPrefs = {
  reminders: true,
  recap: true,
  broadcast: true,
};

export function parsePrefs(json: string | null | undefined): EmailPrefs {
  if (!json) return { ...DEFAULT_PREFS };
  try {
    const parsed = JSON.parse(json) as Partial<EmailPrefs>;
    return {
      reminders: parsed.reminders ?? DEFAULT_PREFS.reminders,
      recap: parsed.recap ?? DEFAULT_PREFS.recap,
      broadcast: parsed.broadcast ?? DEFAULT_PREFS.broadcast,
    };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}
