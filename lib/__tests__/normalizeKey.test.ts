import { normalizeKey } from "@/lib/normalizeKey"; 
import { describe, it, expect } from "vitest";

describe("normalizeKey", () => {
  it("should treat uppercase and lowercase as the same book", () => {
    expect(normalizeKey("Norwegian Wood", ["Murakami"])).toBe(
      normalizeKey("norwegian wood", ["Murakami"]),
    );
  });

  it("should treat different punctuation as the same book", () => {
    expect(normalizeKey("Norwegian Wood!", ["Murakami"])).toBe(
      normalizeKey("Norwegian Wood", ["Murakami"]),
    );
  });

  it("should treat different authors as different books", () => {
    expect(normalizeKey("Untitled", ["Author A"])).not.toBe(
      normalizeKey("Untitled", ["Author B"]),
    );
  });

  it("should not throw an error when there are no authors", () => {
    expect(() => normalizeKey("Some Title", [])).not.toThrow();
  });
});
