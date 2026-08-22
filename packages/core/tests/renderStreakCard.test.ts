import { describe, expect, it } from "vitest";

import { renderStreakCard } from "../src/cards/streak.js";
import type { StreakData } from "../src/fetchers/types.js";

const sampleStreakData: StreakData = {
  currentStreak: 5,
  longestStreak: 12,
  totalContributions: 350,
  firstContribution: "Jan 1, 2024",
  currentStreakStart: "Aug 15",
  currentStreakEnd: "Aug 20",
  longestStreakStart: "Jun 1",
  longestStreakEnd: "Jun 12",
};

describe("renderStreakCard", () => {
  it("renders correctly with default options", () => {
    const svg = renderStreakCard(sampleStreakData);
    expect(svg).toContain("GitHub Streak Stats");
    expect(svg).toContain("Total Contributions");
    expect(svg).toContain("Current Streak");
    expect(svg).toContain("Longest Streak");
    expect(svg).toContain("350");
    expect(svg).toContain("5");
    expect(svg).toContain("12");
  });

  it("can hide individual metrics", () => {
    const svg = renderStreakCard(sampleStreakData, {
      hide_total_contributions: true,
    });
    expect(svg).not.toContain("Total Contributions");
    expect(svg).toContain("Current Streak");
  });
});
