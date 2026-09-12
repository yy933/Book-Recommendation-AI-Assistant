import { describe, it, expect, vi, afterEach } from "vitest";
import { searchAllSources } from "@/lib/searchAllSources";
import * as googleBooksModule from "@/lib/googleBooks";
import * as openLibraryModule from "@/lib/openlibrary";

describe("searchAllSources", () => {
  afterEach(() => {
    vi.restoreAllMocks(); // Restore all mocks after each test to avoid interference between tests
  });
  it("should return book data from the other source when one source fails", async () => {
    vi.spyOn(googleBooksModule, "searchGoogleBooks").mockRejectedValue(
      new Error("API down"),
    );
    vi.spyOn(openLibraryModule, "searchOpenLibrary").mockResolvedValue({
      books: [{ title: "Backup Book" }],
    });

    const result = await searchAllSources("test query");
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Backup Book");
  });
});
