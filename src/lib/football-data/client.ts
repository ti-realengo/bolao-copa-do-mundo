const BASE = "https://api.football-data.org/v4";

export interface FdMatch {
  id: number;
  utcDate: string;
  status: "TIMED" | "SCHEDULED" | "IN_PLAY" | "PAUSED" | "FINISHED" | "POSTPONED" | "CANCELLED" | "SUSPENDED";
  matchday: number;
  stage: string;
  group: string | null;
  homeTeam: { id: number | null; name: string | null; shortName: string | null; tla: string | null; crest: string | null };
  awayTeam: { id: number | null; name: string | null; shortName: string | null; tla: string | null; crest: string | null };
  score: {
    winner: "HOME_TEAM" | "AWAY_TEAM" | "DRAW" | null;
    duration: "REGULAR" | "EXTRA_TIME" | "PENALTY_SHOOTOUT";
    fullTime: { home: number | null; away: number | null };
    halfTime: { home: number | null; away: number | null };
    extraTime?: { home: number | null; away: number | null };
    penalties?: { home: number | null; away: number | null };
  };
  lastUpdated: string;
}

export interface FdMatchesResponse {
  filters: { season: number };
  resultSet: { count: number; first: string; last: string; played: number };
  matches: FdMatch[];
}

export class FootballDataClient {
  constructor(private apiKey: string) {}

  private async get<T>(path: string): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25_000);
    let res: Response;
    try {
      res = await fetch(`${BASE}${path}`, {
        headers: { "X-Auth-Token": this.apiKey },
        signal: controller.signal,
      });
    } catch (e) {
      const err = e as Error & { name?: string };
      if (err.name === "AbortError") {
        throw new Error("Football-Data API: timeout (25s sem resposta)");
      }
      throw new Error(`Football-Data API: falha de rede (${err.message ?? "desconhecida"})`);
    } finally {
      clearTimeout(timeout);
    }
    if (!res.ok) {
      // 5xx from Cloudflare in front of football-data.org (522 = upstream
      // timeout, 521 = origin down, 520 = unknown) is transient — surface a
      // friendly hint instead of just the raw status text.
      const cfTransient = res.status >= 520 && res.status <= 530;
      const detail = await res.text().catch(() => "");
      const hint = cfTransient
        ? " (provavelmente instabilidade na Football-Data; tente de novo em alguns minutos)"
        : "";
      throw new Error(`Football-Data API ${res.status}${hint}: ${detail.slice(0, 200)}`);
    }
    return res.json() as Promise<T>;
  }

  async getWorldCupMatches(season = 2026): Promise<FdMatchesResponse> {
    return this.get<FdMatchesResponse>(`/competitions/WC/matches?season=${season}`);
  }
}

export function mapStage(fdStage: string): string {
  const map: Record<string, string> = {
    GROUP_STAGE: "group",
    LAST_32: "r32",
    ROUND_OF_32: "r32",
    LAST_16: "r16",
    QUARTER_FINALS: "qf",
    SEMI_FINALS: "sf",
    THIRD_PLACE: "3rd",
    FINAL: "final",
  };
  return map[fdStage] ?? fdStage.toLowerCase();
}

export function mapStatus(fdStatus: FdMatch["status"]): string {
  const map: Record<FdMatch["status"], string> = {
    TIMED: "scheduled",
    SCHEDULED: "scheduled",
    IN_PLAY: "live",
    PAUSED: "live",
    FINISHED: "finished",
    POSTPONED: "postponed",
    CANCELLED: "cancelled",
    SUSPENDED: "postponed",
  };
  return map[fdStatus];
}

export function groupCode(fdGroup: string | null): string | null {
  if (!fdGroup) return null;
  const m = fdGroup.match(/GROUP_([A-L])/);
  return m ? m[1] : null;
}
