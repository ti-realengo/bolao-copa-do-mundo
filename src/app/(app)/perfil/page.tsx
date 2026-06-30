import Image from "next/image";
import { getCurrentSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { db, schema } from "@/lib/db";
import { desc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { parsePrefs } from "@/lib/email/prefs";
import { EmailPrefsForm } from "./email-prefs-form";
import { ProfileForm } from "./profile-form";
import { PasswordForm } from "./password-form";
import { CollapsibleSection } from "./collapsible-section";
import { BADGES } from "@/lib/badges/catalog";
import { ShareRankButton } from "./share-button";
import { DangerZone } from "./danger-zone";
import { LanguageSwitcher } from "./language-switcher";
import { getLocale, getMessages } from "@/lib/i18n";
import { PenaltiesBadge } from "@/components/match-score";

export const dynamic = "force-dynamic";

export default async function PerfilPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/login");

  const snap = await db.select().from(schema.rankingsSnapshot).where(eq(schema.rankingsSnapshot.userId, session.user.id)).limit(1).then((r) => r[0]);
  const preds = await db.select().from(schema.predictions).where(eq(schema.predictions.userId, session.user.id));
  const userBadges = await db.select().from(schema.achievements).where(eq(schema.achievements.userId, session.user.id));
  const userBadgeCodes = new Set(userBadges.map((b) => b.badgeCode));

  const currentLocale = await getLocale();
  const m = await getMessages();

  const home = alias(schema.teams, "home");
  const away = alias(schema.teams, "away");
  const history = await db
    .select({
      prediction: schema.predictions,
      match: schema.matches,
      home,
      away,
    })
    .from(schema.predictions)
    .innerJoin(schema.matches, eq(schema.matches.id, schema.predictions.matchId))
    .leftJoin(home, eq(schema.matches.homeTeamId, home.id))
    .leftJoin(away, eq(schema.matches.awayTeamId, away.id))
    .where(eq(schema.predictions.userId, session.user.id))
    .orderBy(desc(schema.matches.scheduledAt))
    .limit(50);

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          {session.user.avatarUrl && (
            <Image
              src={session.user.avatarUrl}
              alt=""
              width={48}
              height={48}
              className="h-12 w-12 rounded-full object-cover border border-brand-border"
              unoptimized
            />
          )}
          <h1 className="font-display text-3xl font-bold">{session.user.name ?? "Perfil"}</h1>
        </div>
        <ShareRankButton userId={session.user.id} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Meus dados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 overflow-hidden rounded-full border border-brand-border bg-brand-surface flex items-center justify-center shrink-0">
              {session.user.avatarUrl ? (
                <Image
                  src={session.user.avatarUrl}
                  alt=""
                  width={64}
                  height={64}
                  className="h-full w-full object-cover"
                  unoptimized
                />
              ) : (
                <span className="text-[10px] text-brand-text-muted">sem foto</span>
              )}
            </div>
            <div className="text-sm">
              <div className="font-semibold text-base">{session.user.name ?? "Sem nome"}</div>
              <div className="text-brand-text-muted">{session.user.email}</div>
            </div>
          </div>

          <CollapsibleSection buttonLabel="Editar perfil">
            <ProfileForm
              initialName={session.user.name ?? ""}
              initialAvatarUrl={session.user.avatarUrl ?? null}
              email={session.user.email}
            />
          </CollapsibleSection>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Senha</CardTitle>
        </CardHeader>
        <CardContent>
          <CollapsibleSection
            buttonLabel={session.user.passwordHash ? "Trocar senha" : "Definir senha"}
          >
            <PasswordForm hasPassword={!!session.user.passwordHash} />
          </CollapsibleSection>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Estatísticas</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm">
          <Stat label="Pontos" value={snap?.totalPoints ?? 0} />
          <Stat label="Posição" value={snap?.position ?? "—"} />
          <Stat label="Cravadas" value={snap?.exactCount ?? 0} />
          <Stat label="Palpites" value={preds.length} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Conquistas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.values(BADGES).map((b) => {
              const owned = userBadgeCodes.has(b.code);
              return (
                <div
                  key={b.code}
                  className={`rounded-xl border p-3 text-center ${owned ? "border-brand-primary bg-brand-primary/5" : "border-brand-border opacity-40"}`}
                  title={b.description}
                >
                  <div className="text-3xl">{b.emoji}</div>
                  <div className="text-sm font-semibold mt-1">{b.name}</div>
                  <div className="text-xs text-brand-text-muted">{b.description}</div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Conta</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2 text-brand-text-muted">
          <div><span className="text-brand-text font-medium">Email:</span> {session.user.email}</div>
          <div><span className="text-brand-text font-medium">Cadastro:</span> {new Date(session.user.createdAt * 1000).toLocaleDateString("pt-BR")}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{m.profile.languagePref}</CardTitle>
        </CardHeader>
        <CardContent>
          <LanguageSwitcher current={currentLocale} label={m.profile.languagePref} save={m.profile.save} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preferências de email</CardTitle>
        </CardHeader>
        <CardContent>
          <EmailPrefsForm initial={parsePrefs(session.user.emailPrefsJson)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Privacidade & dados (LGPD)</CardTitle>
        </CardHeader>
        <CardContent>
          <DangerZone canDelete={session.user.role !== "superadmin"} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de palpites</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {history.length === 0 ? (
            <p className="text-sm text-brand-text-muted p-6">Você ainda não palpitou.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-brand-surface text-left">
                <tr>
                  <th className="px-4 py-2">Jogo</th>
                  <th className="px-4 py-2 text-center">Palpite</th>
                  <th className="px-4 py-2 text-center">Resultado</th>
                  <th className="px-4 py-2 text-right">Pts</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.prediction.id} className="border-t border-brand-border">
                    <td className="px-4 py-2">
                      <div className="font-medium">{h.home?.namePt} × {h.away?.namePt}</div>
                      <div className="text-xs text-brand-text-muted">
                        {new Date(h.match.scheduledAt * 1000).toLocaleDateString("pt-BR")}
                      </div>
                    </td>
                    <td className="px-4 py-2 text-center font-mono">
                      {h.prediction.homeScore}–{h.prediction.awayScore}
                    </td>
                    <td className="px-4 py-2 text-center font-mono text-brand-text-muted">
                      {h.match.status === "finished" && h.match.homeScore != null
                        ? `${h.match.homeScore}–${h.match.awayScore}`
                        : "—"}
                      {h.match.homeScorePen != null && (
                        <PenaltiesBadge match={h.match} variant="inline" className="ml-1" />
                      )}
                    </td>
                    <td className="px-4 py-2 text-right font-mono">
                      {h.prediction.points == null ? "—" : (
                        <span className={h.prediction.isExact ? "text-brand-primary font-semibold" : ""}>
                          {h.prediction.points}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-brand-surface p-3">
      <div className="text-brand-text-muted text-xs uppercase">{label}</div>
      <div className="text-2xl font-display font-bold mt-1 font-mono">{value}</div>
    </div>
  );
}
