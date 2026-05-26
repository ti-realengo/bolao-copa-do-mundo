import { sqliteTable, text, integer, primaryKey, uniqueIndex, index } from "drizzle-orm/sqlite-core";

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const allowedDomains = sqliteTable("allowed_domains", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  domain: text("domain").notNull().unique(),
  isWildcard: integer("is_wildcard").notNull().default(0),
  createdAt: integer("created_at").notNull(),
});

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  avatarUrl: text("avatar_url"),
  phone: text("phone"),
  role: text("role").notNull().default("participant"),
  passwordHash: text("password_hash"),
  passwordMustChange: integer("password_must_change").notNull().default(0),
  totpSecret: text("totp_secret"),
  consentLgpd: integer("consent_lgpd").notNull().default(0),
  consentLgpdAt: integer("consent_lgpd_at"),
  emailPrefsJson: text("email_prefs_json"),
  createdAt: integer("created_at").notNull(),
  lastLoginAt: integer("last_login_at"),
  deletedAt: integer("deleted_at"),
});

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  expiresAt: integer("expires_at").notNull(),
  userAgent: text("user_agent"),
  ipHash: text("ip_hash"),
});

export const teams = sqliteTable("teams", {
  id: integer("id").primaryKey(),
  externalId: integer("external_id").unique(),
  code: text("code").notNull().unique(),
  namePt: text("name_pt").notNull(),
  nameEn: text("name_en").notNull(),
  nameEs: text("name_es").notNull(),
  flagUrl: text("flag_url"),
  groupCode: text("group_code"),
});

export const matches = sqliteTable("matches", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  externalId: text("external_id").unique(),
  stage: text("stage").notNull(),
  groupCode: text("group_code"),
  round: integer("round"),
  homeTeamId: integer("home_team_id").references(() => teams.id),
  awayTeamId: integer("away_team_id").references(() => teams.id),
  scheduledAt: integer("scheduled_at").notNull(),
  venue: text("venue"),
  status: text("status").notNull().default("scheduled"),
  homeScore: integer("home_score"),
  awayScore: integer("away_score"),
  homeScoreEt: integer("home_score_et"),
  awayScoreEt: integer("away_score_et"),
  homeScorePen: integer("home_score_pen"),
  awayScorePen: integer("away_score_pen"),
  winnerTeamId: integer("winner_team_id"),
  finishedAt: integer("finished_at"),
}, (t) => ({
  scheduledIdx: index("matches_scheduled_idx").on(t.scheduledAt),
  statusIdx: index("matches_status_idx").on(t.status),
}));

export const predictions = sqliteTable("predictions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull().references(() => users.id),
  matchId: integer("match_id").notNull().references(() => matches.id),
  homeScore: integer("home_score").notNull(),
  awayScore: integer("away_score").notNull(),
  advancingTeamId: integer("advancing_team_id"),
  points: integer("points"),
  isExact: integer("is_exact").notNull().default(0),
  isWinnerCorrect: integer("is_winner_correct").notNull().default(0),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
}, (t) => ({
  uniqUserMatch: uniqueIndex("predictions_user_match_unique").on(t.userId, t.matchId),
  matchIdx: index("predictions_match_idx").on(t.matchId),
}));

export const specialPredictions = sqliteTable("special_predictions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull().unique().references(() => users.id),
  championTeamId: integer("champion_team_id"),
  runnerupTeamId: integer("runnerup_team_id"),
  thirdTeamId: integer("third_team_id"),
  topScorerName: text("top_scorer_name"),
  firstEliminatedTeamId: integer("first_eliminated_team_id"),
  surpriseTeamId: integer("surprise_team_id"),
  points: integer("points").notNull().default(0),
  lockedAt: integer("locked_at"),
});

export const leagues = sqliteTable("leagues", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  ownerId: text("owner_id").notNull().references(() => users.id),
  inviteCode: text("invite_code").notNull().unique(),
  isOpen: integer("is_open").notNull().default(1),
  maxMembers: integer("max_members").notNull().default(50),
  createdAt: integer("created_at").notNull(),
});

export const leagueMembers = sqliteTable("league_members", {
  leagueId: text("league_id").notNull().references(() => leagues.id),
  userId: text("user_id").notNull().references(() => users.id),
  joinedAt: integer("joined_at").notNull(),
}, (t) => ({
  pk: primaryKey({ columns: [t.leagueId, t.userId] }),
}));

export const achievements = sqliteTable("achievements", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull().references(() => users.id),
  badgeCode: text("badge_code").notNull(),
  unlockedAt: integer("unlocked_at").notNull(),
  matchId: integer("match_id"),
}, (t) => ({
  uniqUserBadge: uniqueIndex("achievements_user_badge_unique").on(t.userId, t.badgeCode),
}));

export const matchComments = sqliteTable("match_comments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  matchId: integer("match_id").notNull().references(() => matches.id),
  userId: text("user_id").notNull().references(() => users.id),
  body: text("body").notNull(),
  createdAt: integer("created_at").notNull(),
  hiddenAt: integer("hidden_at"),
}, (t) => ({
  uniqMatchUser: uniqueIndex("match_comments_match_user_unique").on(t.matchId, t.userId),
  matchIdx: index("match_comments_match_idx").on(t.matchId),
}));

export const auditLog = sqliteTable("audit_log", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id"),
  action: text("action").notNull(),
  target: text("target"),
  metadataJson: text("metadata_json"),
  ipHash: text("ip_hash"),
  createdAt: integer("created_at").notNull(),
});

export const emailDispatches = sqliteTable("email_dispatches", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull().references(() => users.id),
  template: text("template").notNull(),
  contextJson: text("context_json"),
  sentAt: integer("sent_at"),
  status: text("status").notNull().default("pending"),
});

export const rankingsSnapshot = sqliteTable("rankings_snapshot", {
  userId: text("user_id").primaryKey().references(() => users.id),
  totalPoints: integer("total_points").notNull().default(0),
  exactCount: integer("exact_count").notNull().default(0),
  winnerCount: integer("winner_count").notNull().default(0),
  specialPoints: integer("special_points").notNull().default(0),
  position: integer("position"),
  positionChange: integer("position_change"),
  updatedAt: integer("updated_at").notNull(),
});

export type User = typeof users.$inferSelect;
export type Team = typeof teams.$inferSelect;
export type Match = typeof matches.$inferSelect;
export type Prediction = typeof predictions.$inferSelect;
