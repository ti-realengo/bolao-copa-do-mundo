import { describe, it, expect } from "vitest";
import { BADGES } from "./catalog";

describe("BADGES catalog", () => {
  it("has 4 unique badges with required fields", () => {
    const codes = Object.keys(BADGES);
    expect(codes.length).toBe(4);
    expect(new Set(codes).size).toBe(codes.length);
    for (const b of Object.values(BADGES)) {
      expect(b.code).toBeTruthy();
      expect(b.emoji).toBeTruthy();
      expect(b.name).toBeTruthy();
      expect(b.description).toBeTruthy();
    }
  });

  it("badge codes match keys", () => {
    for (const [key, b] of Object.entries(BADGES)) {
      expect(key).toBe(b.code);
    }
  });
});
