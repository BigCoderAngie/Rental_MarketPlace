import { describe, expect, it } from "vitest";
import { FAQ } from "./faq";

describe("homepage FAQ", () => {
  it("has the ten questions, each with an answer", () => {
    expect(FAQ).toHaveLength(10);
    for (const { question, answer } of FAQ) {
      expect(question.trim().endsWith("?")).toBe(true);
      expect(answer.trim().length).toBeGreaterThan(20);
    }
  });

  it("has no repeated questions", () => {
    expect(new Set(FAQ.map((f) => f.question)).size).toBe(FAQ.length);
  });

  it("never says the platform holds rental money", () => {
    const answer = FAQ.find((f) => f.question.includes("cut of my rental money"))!.answer;
    expect(answer).toMatch(/never hold your rental money/);
  });
});
