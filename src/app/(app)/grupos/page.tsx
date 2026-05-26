import Link from "next/link";
import { db, schema } from "@/lib/db";
import { getCurrentSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { eq, sql, desc } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function GruposPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/login");

  const myLeagues = await db
    .select({
      league: schema.leagues,
      memberCount: sql<number>`(select count(*) from league_members where league_id = ${schema.leagues.id})`,
    })
    .from(schema.leagueMembers)
    .innerJoin(schema.leagues, eq(schema.leagues.id, schema.leagueMembers.leagueId))
    .where(eq(schema.leagueMembers.userId, session.user.id))
    .orderBy(desc(schema.leagues.createdAt));

  const ownedCount = myLeagues.filter((l) => l.league.ownerId === session.user.id).length;
  const canCreate = ownedCount < 3;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Grupos privados</h1>
          <p className="text-brand-text-muted mt-1">Crie um grupo fechado pra disputar com colegas próximos.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/grupos/entrar">
            <Button variant="outline">Entrar com código</Button>
          </Link>
          <Link href="/grupos/novo" aria-disabled={!canCreate}>
            <Button disabled={!canCreate}>Criar grupo</Button>
          </Link>
        </div>
      </div>

      {!canCreate && (
        <p className="text-sm text-brand-text-muted">Você já criou o limite de 3 grupos.</p>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        {myLeagues.map((row) => (
          <Link key={row.league.id} href={`/grupos/${row.league.id}`}>
            <Card className="hover:border-brand-primary transition">
              <CardHeader>
                <CardTitle>{row.league.name}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-brand-text-muted flex justify-between">
                <span>{Number(row.memberCount)} membros</span>
                {row.league.ownerId === session.user.id && (
                  <span className="text-brand-primary">você é o dono</span>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
        {myLeagues.length === 0 && (
          <p className="text-brand-text-muted">Você ainda não está em nenhum grupo.</p>
        )}
      </div>
    </div>
  );
}
