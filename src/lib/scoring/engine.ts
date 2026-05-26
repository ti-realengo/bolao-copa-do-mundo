export interface MatchResult {
  homeScore: number;
  awayScore: number;
  stage: string;
  homeTeamId: number;
  awayTeamId: number;
  winnerTeamId?: number | null;
}

export interface PredictionInput {
  homeScore: number;
  awayScore: number;
  advancingTeamId?: number | null;
}

export interface ScoringResult {
  points: number;
  isExact: boolean;
  isWinnerCorrect: boolean;
}

export interface EngineWeights {
  exact: number;
  winnerOrDraw: number;
  knockoutAdvancingBonus: number;
}

export const DEFAULT_WEIGHTS: EngineWeights = {
  exact: 3,
  winnerOrDraw: 1,
  knockoutAdvancingBonus: 1,
};

function actualOutcome(home: number, away: number): "home" | "away" | "draw" {
  if (home > away) return "home";
  if (home < away) return "away";
  return "draw";
}

export function scorePrediction(
  prediction: PredictionInput,
  match: MatchResult,
  weights: EngineWeights = DEFAULT_WEIGHTS,
): ScoringResult {
  const isExact =
    prediction.homeScore === match.homeScore && prediction.awayScore === match.awayScore;

  const predictedOutcome = actualOutcome(prediction.homeScore, prediction.awayScore);
  const realOutcome = actualOutcome(match.homeScore, match.awayScore);
  const isWinnerCorrect = predictedOutcome === realOutcome;

  let points = 0;
  if (isExact) {
    points = weights.exact;
  } else if (isWinnerCorrect) {
    points = weights.winnerOrDraw;
  }

  if (match.stage !== "group" && prediction.advancingTeamId && match.winnerTeamId) {
    if (prediction.advancingTeamId === match.winnerTeamId && !isExact) {
      points += weights.knockoutAdvancingBonus;
    }
  }

  return { points, isExact, isWinnerCorrect };
}
