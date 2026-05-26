import { describe, it, expect } from "vitest";
import { computeSpecialsForUser, type SpecialResults } from "./specials";

const blank = {
  id: 1, userId: "u", championTeamId: null, runnerupTeamId: null, thirdTeamId: null,
  topScorerName: null, firstEliminatedTeamId: null, surpriseTeamId: null,
  points: 0, lockedAt: null,
};

const fullResults: SpecialResults = {
  championTeamId: 10, runnerupTeamId: 11, thirdTeamId: 12,
  topScorerName: "Vinicius Junior", firstEliminatedTeamId: 13, surpriseTeamId: 14,
};

describe("computeSpecialsForUser", () => {
  it("acertou tudo: 5+3+2+3+2+3 = 18", () => {
    const pred = { ...blank, championTeamId: 10, runnerupTeamId: 11, thirdTeamId: 12, topScorerName: "Vinicius Junior", firstEliminatedTeamId: 13, surpriseTeamId: 14 };
    expect(computeSpecialsForUser(pred, fullResults)).toBe(18);
  });

  it("só campeão", () => {
    const pred = { ...blank, championTeamId: 10 };
    expect(computeSpecialsForUser(pred, fullResults)).toBe(5);
  });

  it("artilheiro com case e acentos diferentes", () => {
    const pred = { ...blank, topScorerName: "vinícius júnior" };
    expect(computeSpecialsForUser(pred, fullResults)).toBe(3);
  });

  it("artilheiro errado", () => {
    const pred = { ...blank, topScorerName: "Lionel Messi" };
    expect(computeSpecialsForUser(pred, fullResults)).toBe(0);
  });

  it("sem palpites = 0", () => {
    expect(computeSpecialsForUser(blank, fullResults)).toBe(0);
  });
});
