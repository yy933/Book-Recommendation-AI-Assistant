import { describe, it, expect } from "vitest";
describe("dedupedRecommendations", () => {
  it("should only keep first record of books if theree are duplicates", () => {
    const recommendations = [
      { index: 5, blurb: "First recommendation for book 5" },
      { index: 2, blurb: "First recommendation for book 2" },
      { index: 5, blurb: "Second recommendation for book 5" },
      { index: 3, blurb: "First recommendation for book 3" },
      { index: 2, blurb: "Second recommendation for book 2" },
    ];

    const seenIndices = new Set<number>();
    const result = recommendations.filter((rec) => {
      if (seenIndices.has(rec.index)) return false;
      seenIndices.add(rec.index);
      return true;
    });

    expect(result).toHaveLength(3);
    expect(result[0].blurb).toBe("First recommendation for book 5");
  });
});
