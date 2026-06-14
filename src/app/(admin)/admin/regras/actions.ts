"use server";

import { db, schema } from "@/lib/db";
import { getCurrentSession } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit/log";
import { saveRulesMarkdown, DEFAULT_RULES_MD } from "@/lib/rules";
import { saveScoringConfig, type ScoringConfig, parseScoringConfig } from "@/lib/scoring/config";
import { computeMatchPoints, refreshRankingsSnapshot } from "@/lib/scoring/compute";
import { eq, sql } from "drizzle-orm";

async function requireSuperadmin() {
  const session = await getCurrentSession();
  if (!session || session.user.role !== "superadmin") throw new Error("forbidden");
  return session;
}

export async function saveRules(markdown: string): Promise<{ ok: boolean; error?: string }> {
  const session = await requireSuperadmin();
  if (typeof markdown !== "string") return { ok: false, error: "Conteúdo inválido" };
  if (markdown.length > 50_000) return { ok: false, error: "Texto muito longo (máx 50.000 chars)" };
  await saveRulesMarkdown(markdown);
  await logAudit(session.user.id, "admin.rules.update", null, { length: markdown.length });
  return { ok: true };
}

export async function resetRulesToDefault(): Promise<{ ok: boolean }> {
  const session = await requireSuperadmin();
  await db.delete(schema.settings).where(eq(schema.settings.key, "rules_markdown"));
  await logAudit(session.user.id, "admin.rules.reset");
  return { ok: true };
}

export async function saveScoring(input: ScoringConfig): Promise<{ ok: boolean; message?: string; error?: string }> {
  const session = await requireSuperadmin();
  const config = parseScoringConfig(JSON.stringify(input));
  await saveScoringConfig(config);

  const finishedMatches = await db
    .select({ id: schema.matches.id })
    .from(schema.matches)
    .where(sql`${schema.matches.status} = 'finished'`);
  for (const m of finishedMatches) {
    await computeMatchPoints(m.id);
  }
  const usersScored = await refreshRankingsSnapshot({ recomputeSpecials: true });
  await logAudit(session.user.id, "admin.scoring.update", null, {
    config,
    matchesRecomputed: finishedMatches.length,
    usersScored,
  });
  return {
    ok: true,
    message: `${finishedMatches.length} jogos recalculados, ${usersScored} usuários no ranking.`,
  };
}
