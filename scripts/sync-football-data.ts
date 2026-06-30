import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { eq } from "drizzle-orm";
import * as schema from "../src/lib/db/schema";
import { FootballDataClient, mapStage, mapStatus, groupCode } from "../src/lib/football-data/client";

const TEAM_NAMES_PT: Record<string, string> = {
  ARG: "Argentina", BRA: "Brasil", URU: "Uruguai", PAR: "Paraguai", COL: "Colômbia",
  ECU: "Equador", VEN: "Venezuela", BOL: "Bolívia", MEX: "México", CAN: "Canadá",
  USA: "Estados Unidos", JAM: "Jamaica", CRC: "Costa Rica", PAN: "Panamá", HAI: "Haiti",
  HON: "Honduras", JPN: "Japão", KOR: "Coreia do Sul", IRN: "Irã", KSA: "Arábia Saudita",
  AUS: "Austrália", UZB: "Uzbequistão", QAT: "Catar", JOR: "Jordânia",
  RSA: "África do Sul", MAR: "Marrocos", TUN: "Tunísia", EGY: "Egito", ALG: "Argélia",
  CIV: "Costa do Marfim", SEN: "Senegal", GHA: "Gana", CMR: "Camarões", NGA: "Nigéria",
  CPV: "Cabo Verde",
  ENG: "Inglaterra", FRA: "França", ESP: "Espanha", GER: "Alemanha", ITA: "Itália",
  POR: "Portugal", NED: "Holanda", BEL: "Bélgica", CRO: "Croácia", SUI: "Suíça",
  AUT: "Áustria", DEN: "Dinamarca", SWE: "Suécia", POL: "Polônia", NOR: "Noruega",
  CZE: "República Tcheca", SCO: "Escócia", WAL: "País de Gales", IRL: "Irlanda",
  TUR: "Turquia", SRB: "Sérvia", UKR: "Ucrânia", BIH: "Bósnia",
  NZL: "Nova Zelândia",
};

const TEAM_NAMES_ES: Record<string, string> = {
  ARG: "Argentina", BRA: "Brasil", URU: "Uruguay", PAR: "Paraguay", COL: "Colombia",
  ECU: "Ecuador", VEN: "Venezuela", BOL: "Bolivia", MEX: "México", CAN: "Canadá",
  USA: "Estados Unidos", RSA: "Sudáfrica", MAR: "Marruecos", KOR: "Corea del Sur",
  CZE: "República Checa", BIH: "Bosnia",
};

function fallback(map: Record<string, string>, code: string, fallbackName: string) {
  return map[code] ?? fallbackName;
}

async function main() {
  const apiKey = process.env.FOOTBALL_DATA_API_KEY;
  if (!apiKey) throw new Error("FOOTBALL_DATA_API_KEY não definida");

  const dbUrl = process.env.DATABASE_URL ?? "./data/bolao.db";
  const sqlite = new Database(dbUrl);
  sqlite.pragma("foreign_keys = ON");
  const db = drizzle(sqlite, { schema });

  const fd = new FootballDataClient(apiKey);
  const data = await fd.getWorldCupMatches(2026);
  console.log(`→ ${data.matches.length} jogos recebidos da Football-Data`);

  const teamMap = new Map<number, { tla: string; name: string; crest: string | null; group: string | null }>();
  for (const m of data.matches) {
    const grp = groupCode(m.group);
    if (m.homeTeam.id != null && !teamMap.has(m.homeTeam.id)) {
      teamMap.set(m.homeTeam.id, { tla: m.homeTeam.tla ?? "", name: m.homeTeam.name ?? "", crest: m.homeTeam.crest, group: grp });
    }
    if (m.awayTeam.id != null && !teamMap.has(m.awayTeam.id)) {
      teamMap.set(m.awayTeam.id, { tla: m.awayTeam.tla ?? "", name: m.awayTeam.name ?? "", crest: m.awayTeam.crest, group: grp });
    }
  }

  console.log(`→ ${teamMap.size} seleções identificadas`);

  for (const [externalId, t] of teamMap) {
    const code = (t.tla && t.tla.trim().length > 0 ? t.tla : `T${externalId}`).toUpperCase();
    const safeName = t.name && t.name.trim().length > 0 ? t.name : `Selecao ${externalId}`;
    const namePt = fallback(TEAM_NAMES_PT, code, safeName);
    const nameEs = fallback(TEAM_NAMES_ES, code, safeName);
    const existing = db.select().from(schema.teams).where(eq(schema.teams.externalId, externalId)).all();
    if (existing.length > 0) {
      db.update(schema.teams).set({
        code,
        namePt, nameEn: safeName, nameEs, flagUrl: t.crest, groupCode: t.group,
      }).where(eq(schema.teams.externalId, externalId)).run();
    } else {
      db.insert(schema.teams).values({
        externalId,
        code,
        namePt,
        nameEn: safeName,
        nameEs,
        flagUrl: t.crest,
        groupCode: t.group,
      }).run();
    }
  }

  const teamRows = db.select().from(schema.teams).all();
  const teamByExternal = new Map(teamRows.filter((r) => r.externalId).map((r) => [r.externalId!, r.id]));

  let inserted = 0;
  let updated = 0;
  for (const m of data.matches) {
    const externalId = String(m.id);
    const homeId = m.homeTeam.id != null ? teamByExternal.get(m.homeTeam.id) ?? null : null;
    const awayId = m.awayTeam.id != null ? teamByExternal.get(m.awayTeam.id) ?? null : null;
    const scheduledAt = Math.floor(new Date(m.utcDate).getTime() / 1000);
    const stage = mapStage(m.stage);
    const status = mapStatus(m.status);
    const grp = groupCode(m.group);

    const existing = db.select().from(schema.matches).where(eq(schema.matches.externalId, externalId)).all();

    const isShootout = m.score.duration === "PENALTY_SHOOTOUT";
    const homeScore = isShootout
      ? (m.score.regularTime?.home ?? 0) + (m.score.extraTime?.home ?? 0)
      : m.score.fullTime.home;
    const awayScore = isShootout
      ? (m.score.regularTime?.away ?? 0) + (m.score.extraTime?.away ?? 0)
      : m.score.fullTime.away;

    let winnerTeamId: number | null = null;
    if (m.score.winner === "HOME_TEAM") winnerTeamId = homeId;
    else if (m.score.winner === "AWAY_TEAM") winnerTeamId = awayId;
    else if (isShootout && m.score.fullTime.home != null && m.score.fullTime.away != null) {
      if (m.score.fullTime.home > m.score.fullTime.away) winnerTeamId = homeId;
      else if (m.score.fullTime.away > m.score.fullTime.home) winnerTeamId = awayId;
    }

    const fields = {
      stage,
      groupCode: grp,
      round: stage === "group" ? m.matchday : null,
      homeTeamId: homeId,
      awayTeamId: awayId,
      scheduledAt,
      status,
      homeScore,
      awayScore,
      homeScoreEt: m.score.extraTime?.home ?? null,
      awayScoreEt: m.score.extraTime?.away ?? null,
      homeScorePen: isShootout
        ? Math.max(0, (m.score.fullTime.home ?? 0) - (m.score.regularTime?.home ?? 0) - (m.score.extraTime?.home ?? 0))
        : null,
      awayScorePen: isShootout
        ? Math.max(0, (m.score.fullTime.away ?? 0) - (m.score.regularTime?.away ?? 0) - (m.score.extraTime?.away ?? 0))
        : null,
      winnerTeamId,
      finishedAt: m.status === "FINISHED" ? Math.floor(new Date(m.lastUpdated).getTime() / 1000) : null,
    };
    if (existing.length > 0) {
      db.update(schema.matches).set(fields).where(eq(schema.matches.externalId, externalId)).run();
      updated++;
    } else {
      db.insert(schema.matches).values({ externalId, ...fields }).run();
      inserted++;
    }
  }

  console.log(`✓ matches: ${inserted} inseridos, ${updated} atualizados`);
  sqlite.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
