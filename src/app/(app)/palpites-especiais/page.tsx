import { db, schema } from "@/lib/db";
import { getCurrentSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { eq, asc } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SpecialsForm } from "./form";

export const dynamic = "force-dynamic";

export default async function PalpitesEspeciaisPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/login");

  const teams = await db.select().from(schema.teams).orderBy(asc(schema.teams.namePt));

  const firstMatch = await db
    .select({ at: schema.matches.scheduledAt })
    .from(schema.matches)
    .orderBy(asc(schema.matches.scheduledAt))
    .limit(1)
    .then((r) => r[0]);

  const now = Math.floor(Date.now() / 1000);
  const tournamentStarted = firstMatch ? now >= firstMatch.at : false;

  const existing = await db
    .select()
    .from(schema.specialPredictions)
    .where(eq(schema.specialPredictions.userId, session.user.id))
    .limit(1)
    .then((r) => r[0]);

  const isLocked = !!existing?.lockedAt || tournamentStarted;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-display text-3xl font-bold">Palpites especiais</h1>
        <p className="text-brand-text-muted mt-1">
          {isLocked
            ? "Palpites trancados — a Copa começou."
            : "Travam quando o primeiro jogo da Copa começar. Editáveis até lá."}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pontuação</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-brand-text-muted space-y-1">
          <div>Campeão · 15 pts</div>
          <div>Vice · 10 pts</div>
          <div>3º lugar · 5 pts</div>
          <div>Artilheiro · 7 pts</div>
          <div>Primeira eliminada na fase de grupos · 3 pts</div>
          <div>Seleção surpresa (chega às quartas) · 3 pts</div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="py-6">
          <SpecialsForm
            teams={teams.map((t) => ({ id: t.id, name: t.namePt, group: t.groupCode }))}
            isLocked={isLocked}
            initial={existing ? {
              championTeamId: existing.championTeamId,
              runnerupTeamId: existing.runnerupTeamId,
              thirdTeamId: existing.thirdTeamId,
              topScorerName: existing.topScorerName ?? "",
              firstEliminatedTeamId: existing.firstEliminatedTeamId,
              surpriseTeamId: existing.surpriseTeamId,
            } : null}
          />
        </CardContent>
      </Card>
    </div>
  );
}
