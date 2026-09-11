// lib/__tests__/normalizeKey.test.ts
import { normalizeKey } from "@/lib/normalizeKey"; 

describe("normalizeKey", () => {
  it("大小寫不同應視為相同", () => {
    expect(normalizeKey("Norwegian Wood", ["Murakami"])).toBe(
      normalizeKey("norwegian wood", ["Murakami"]),
    );
  });

  it("標點符號不同應視為相同", () => {
    expect(normalizeKey("Norwegian Wood!", ["Murakami"])).toBe(
      normalizeKey("Norwegian Wood", ["Murakami"]),
    );
  });

  it("不同作者應視為不同書", () => {
    expect(normalizeKey("Untitled", ["Author A"])).not.toBe(
      normalizeKey("Untitled", ["Author B"]),
    );
  });

  it("沒有作者時不應該報錯", () => {
    expect(() => normalizeKey("Some Title", [])).not.toThrow();
  });
});
