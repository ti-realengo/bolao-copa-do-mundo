export interface ScoringConfig {
  exact: number;
  winnerOrDraw: number;
  knockoutAdvancingBonus: number;
  specials: {
    champion: number;
    runnerup: number;
    third: number;
    topScorer: number;
    firstEliminated: number;
    surprise: number;
  };
}

export const DEFAULT_SCORING: ScoringConfig = {
  exact: 3,
  winnerOrDraw: 1,
  knockoutAdvancingBonus: 1,
  specials: {
    champion: 5,
    runnerup: 3,
    third: 2,
    topScorer: 3,
    firstEliminated: 2,
    surprise: 3,
  },
};

function clamp(n: unknown, min = 0, max = 100): number | null {
  if (typeof n !== "number" || !Number.isFinite(n)) return null;
  if (n < min || n > max) return null;
  return Math.round(n);
}

export function parseScoringConfig(raw: string | null | undefined): ScoringConfig {
  if (!raw) return { ...DEFAULT_SCORING, specials: { ...DEFAULT_SCORING.specials } };
  try {
    const parsed = JSON.parse(raw) as Partial<ScoringConfig>;
    const specialsRaw = (parsed.specials ?? {}) as Partial<ScoringConfig["specials"]>;
    return {
      exact: clamp(parsed.exact) ?? DEFAULT_SCORING.exact,
      winnerOrDraw: clamp(parsed.winnerOrDraw) ?? DEFAULT_SCORING.winnerOrDraw,
      knockoutAdvancingBonus: clamp(parsed.knockoutAdvancingBonus) ?? DEFAULT_SCORING.knockoutAdvancingBonus,
      specials: {
        champion: clamp(specialsRaw.champion) ?? DEFAULT_SCORING.specials.champion,
        runnerup: clamp(specialsRaw.runnerup) ?? DEFAULT_SCORING.specials.runnerup,
        third: clamp(specialsRaw.third) ?? DEFAULT_SCORING.specials.third,
        topScorer: clamp(specialsRaw.topScorer) ?? DEFAULT_SCORING.specials.topScorer,
        firstEliminated: clamp(specialsRaw.firstEliminated) ?? DEFAULT_SCORING.specials.firstEliminated,
        surprise: clamp(specialsRaw.surprise) ?? DEFAULT_SCORING.specials.surprise,
      },
    };
  } catch {
    return { ...DEFAULT_SCORING, specials: { ...DEFAULT_SCORING.specials } };
  }
}
