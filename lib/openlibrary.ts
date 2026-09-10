import { OpenLibraryDoc } from "@/types";

// Get description
async function fetchWorkDescription(workKey: string): Promise<string> {
  try {
    const res = await fetch(`https://openlibrary.org${workKey}.json`);
    const data = await res.json();
    return extractDescription(data.description);
  } catch {
    return "No available description";
  }
}

// since description return from Open Library can be either a string or an object with a "value" property(e.g. { type: "/type/text", value: "..." }), we need to handle both cases
function extractDescription(desc: any): string {
  if (!desc) return "No available description";
  if (typeof desc === "string") return desc;
  if (typeof desc === "object" && desc.value) return desc.value;
  return "No available description";
}

export async function searchOpenLibrary({ query }: { query: string }) {
  try {
    const cleanQuery = query.trim();
    if (!cleanQuery) return { books: [] };

    // fetch book from Open Library
    const fields = "key,title,author_name,first_publish_year,subject,cover_i";
    const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(cleanQuery)}&fields=${fields}&limit=10`;

    const res = await fetch(url);
    const data = await res.json();

    if (!data.docs || data.docs.length === 0) return { books: [] };

    // get description for first 5 books (or fewer if less than 5 results)
    const docsToEnrich = data.docs.slice(0, 5);
    const books = await Promise.all(
      // Enrich each book with description and thumbnails
      docsToEnrich.map(async (doc: OpenLibraryDoc) => ({
        title: doc.title,
        authors: doc.author_name || ["Unknown Author"],
        description: await fetchWorkDescription(doc.key),
        link: `https://openlibrary.org${doc.key}`,
        publishedDate: doc.first_publish_year
          ? String(doc.first_publish_year)
          : null,
        categories: doc.subject?.slice(0, 5) || [],
        thumbnail: doc.cover_i
          ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
          : null,
        source: "Open Library",
      })),
    );

  
    return { books };
  } catch (error) {
    console.error("Error searching Open Library: ", error);
    return { books: [] };
  }
}
