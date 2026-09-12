import { describe, it, expect, jest } from "vitest";
import {} from '@/lib/googleBooks'

describe("searchAllSources", () => {
  it("should return book data from the other source when one source fails", async () =>{
    jest
      .spyOn(googleBooksModule, "searchGoogleBooks")
      .mockRejectedValue(new Error("API down"));
    jest
      .spyOn(openLibraryModule, "searchOpenLibrary")
      .mockResolvedValue({ books: [{ title: "Backup Book" }] });

    const result = await searchAllSources("test query");
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Backup Book");

  })
})