import { describe, expect, it } from "vitest";
import { OWNER_FAQ, RENTER_FAQ } from "./faq";

const ALL = [...RENTER_FAQ, ...OWNER_FAQ];
const answerTo = (words: string) => ALL.find((f) => f.question.includes(words))!.answer;

describe("homepage FAQ", () => {
  it("has four renter and five owner questions, each with an answer", () => {
    expect(RENTER_FAQ).toHaveLength(4);
    expect(OWNER_FAQ).toHaveLength(5);
    for (const { question, answer } of ALL) {
      expect(question.trim().endsWith("?")).toBe(true);
      expect(answer.trim().length).toBeGreaterThan(20);
    }
  });

  it("has no repeated questions", () => {
    expect(new Set(ALL.map((f) => f.question)).size).toBe(ALL.length);
  });

  it("tells renters they never pay RentLoop", () => {
    expect(answerTo("pay anything to rent")).toMatch(/renters never pay RentLoop/);
  });

  it("never says the platform holds rental money", () => {
    expect(answerTo("cut of my rental money")).toMatch(/never hold your rental money/);
  });

  it("says the booking fee is 0% during the launch", () => {
    expect(answerTo("make money")).toMatch(/0% during the launch/);
  });

  it("names the launch towns", () => {
    expect(answerTo("Which towns")).toMatch(/Windhoek and Erongo/);
  });

  it("avoids promise words (NFR-12)", () => {
    for (const { question, answer } of ALL) expect(`${question} ${answer}`).not.toMatch(/secure|protected|guarantee/i);
  });
});
