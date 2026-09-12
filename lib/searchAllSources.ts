import { searchGoogleBooks } from "@/lib/googleBooks";
import { searchOpenLibrary } from "@/lib/openlibrary";
import type { Book } from "@/types";

export async function searchAllSources(query: string) {
  // Use Promise.allSettled to search both Google Books and Open Library concurrently
  const results = await Promise.allSettled([
    searchGoogleBooks({ query }),
    searchOpenLibrary({ query }),
  ]);

  const allBooks: Book[] = [];

  results.forEach((result, index) => {
    const sourceName = index === 0 ? "Google Books" : "Open Library";
    if (result.status === "fulfilled") {
      const books = result.value?.books ?? [];
      allBooks.push(
        ...books.map((b: any) => ({ ...b, source: b.source || sourceName })),
      );
    } else {
      console.error(`${sourceName} search failed:`, result.reason);
    }
  });

  return allBooks;
}
