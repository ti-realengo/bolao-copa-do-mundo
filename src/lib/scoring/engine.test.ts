import { describe, it, expect } from "vitest";
import { scorePrediction } from "./engine";

const groupMatch = (home: number, away: number) => ({
  homeScore: home, awayScore: away, stage: "group", homeTeamId: 1, awayTeamId: 2,
});

const koMatch = (home: number, away: number, winnerTeamId: number) => ({
  homeScore: home, awayScore: away, stage: "r16", homeTeamId: 1, awayTeamId: 2, winnerTeamId,
});

describe("scorePrediction", () => {
  it("placar exato vale 3 pts", () => {
    const r = scorePrediction({ homeScore: 2, awayScore: 1 }, groupMatch(2, 1));
    expect(r.points).toBe(3);
    expect(r.isExact).toBe(true);
    expect(r.isWinnerCorrect).toBe(true);
  });

  it("vencedor correto com placar errado vale 1 pt", () => {
    const r = scorePrediction({ homeScore: 3, awayScore: 0 }, groupMatch(2, 1));
    expect(r.points).toBe(1);
    expect(r.isExact).toBe(false);
    expect(r.isWinnerCorrect).toBe(true);
  });

  it("empate com placar errado vale 1 pt", () => {
    const r = scorePrediction({ homeScore: 1, awayScore: 1 }, groupMatch(2, 2));
    expect(r.points).toBe(1);
    expect(r.isWinnerCorrect).toBe(true);
  });

  it("vencedor errado vale 0", () => {
    const r = scorePrediction({ homeScore: 2, awayScore: 1 }, groupMatch(0, 1));
    expect(r.points).toBe(0);
    expect(r.isExact).toBe(false);
    expect(r.isWinnerCorrect).toBe(false);
  });

  it("mata-mata: placar exato continua valendo 3 sem bônus extra", () => {
    const r = scorePrediction(
      { homeScore: 1, awayScore: 1, advancingTeamId: 1 },
      koMatch(1, 1, 1),
    );
    expect(r.points).toBe(3);
  });

  it("mata-mata: errou placar mas acertou quem passou → 1 + 1 bônus", () => {
    const r = scorePrediction(
      { homeScore: 2, awayScore: 0, advancingTeamId: 1 },
      koMatch(1, 0, 1),
    );
    expect(r.points).toBe(2);
  });

  it("mata-mata: errou placar e quem passou → 0", () => {
    const r = scorePrediction(
      { homeScore: 0, awayScore: 1, advancingTeamId: 2 },
      koMatch(2, 1, 1),
    );
    expect(r.points).toBe(0);
  });

  it("mata-mata: empate em 90min, palpite com placar errado mas acertou quem passa nos pênaltis", () => {
    const r = scorePrediction(
      { homeScore: 2, awayScore: 2, advancingTeamId: 1 },
      koMatch(1, 1, 1),
    );
    expect(r.points).toBe(2);
    expect(r.isWinnerCorrect).toBe(true);
  });

  it("usa pesos customizados quando passados", () => {
    const r = scorePrediction(
      { homeScore: 2, awayScore: 1 },
      groupMatch(2, 1),
      { exact: 10, winnerOrDraw: 4, knockoutAdvancingBonus: 2 },
    );
    expect(r.points).toBe(10);
  });

  it("respeita peso zero para vencedor", () => {
    const r = scorePrediction(
      { homeScore: 3, awayScore: 0 },
      groupMatch(2, 1),
      { exact: 5, winnerOrDraw: 0, knockoutAdvancingBonus: 1 },
    );
    expect(r.points).toBe(0);
    expect(r.isWinnerCorrect).toBe(true);
  });
});
