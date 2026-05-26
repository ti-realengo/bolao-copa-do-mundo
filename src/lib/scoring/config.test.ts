import { describe, it, expect } from "vitest";
import { parseScoringConfig, DEFAULT_SCORING } from "./config";

describe("parseScoringConfig", () => {
  it("returns defaults when given null", () => {
    expect(parseScoringConfig(null)).toEqual(DEFAULT_SCORING);
  });

  it("returns defaults when JSON is invalid", () => {
    expect(parseScoringConfig("not-json")).toEqual(DEFAULT_SCORING);
  });

  it("merges partial config with defaults", () => {
    const result = parseScoringConfig(JSON.stringify({ exact: 5 }));
    expect(result.exact).toBe(5);
    expect(result.winnerOrDraw).toBe(DEFAULT_SCORING.winnerOrDraw);
    expect(result.specials.champion).toBe(DEFAULT_SCORING.specials.champion);
  });

  it("rejects negative or out-of-range values", () => {
    const result = parseScoringConfig(JSON.stringify({ exact: -1, winnerOrDraw: 999 }));
    expect(result.exact).toBe(DEFAULT_SCORING.exact);
    expect(result.winnerOrDraw).toBe(DEFAULT_SCORING.winnerOrDraw);
  });

  it("accepts custom specials", () => {
    const result = parseScoringConfig(JSON.stringify({
      specials: { champion: 10, runnerup: 7, third: 4, topScorer: 5, firstEliminated: 3, surprise: 6 },
    }));
    expect(result.specials.champion).toBe(10);
    expect(result.specials.runnerup).toBe(7);
    expect(result.specials.third).toBe(4);
  });

  it("rounds non-integer values", () => {
    const result = parseScoringConfig(JSON.stringify({ exact: 3.7 }));
    expect(result.exact).toBe(4);
  });

  it("coerces zero correctly (0 is valid)", () => {
    const result = parseScoringConfig(JSON.stringify({ winnerOrDraw: 0 }));
    expect(result.winnerOrDraw).toBe(0);
  });
});
