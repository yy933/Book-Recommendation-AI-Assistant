import { Type, FunctionDeclaration } from "@google/genai";
const apiKey = process.env.GOOGLE_BOOKS_API_KEY;

export async function searchGoogleBooks({ query }: { query: string }) {
  try {
    const cleanQuery = query.trim().replace(/^["']|["']$/g, "");

    if (!cleanQuery) return { books: [] };
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(cleanQuery)}&maxResults=20${apiKey ? `&key=${apiKey}` : ""}`;
    const res = await fetch(url);
    const data = await res.json();
    if (!data.items) {
      return { books: [] };
    }
    const books = data.items.map((item: any) => ({
      title: item.volumeInfo.title,
      authors: item.volumeInfo.authors || ["Unknown Author"],
      description: item.volumeInfo.description || "No available description",
      link: item.volumeInfo.infoLink,
    }));
    return { books };
  } catch (error) {
    console.error("Error searching Google Books: ", error);
     return { books: [] };
  }
}

export const bookSearchDeclaration: FunctionDeclaration = {
  name: "searchGoogleBooks",
  description:
    "Search Google Books by keywords, topic, author, or title. Always use concise search terms (2-4 words), never full sentences. " +
    "You may call this tool up to 3 times in a row with DIFFERENT search angles (e.g. different phrasing, sub-genre, or qualifier) " +
    "to build a larger, more diverse pool of candidates before recommending — this is especially useful when the user's request " +
    "has nuanced criteria (e.g. 'simple storyline', 'standalone novel') that a single query is unlikely to fully capture. " +
    "Each call returns fresh results; the system automatically merges all results across calls into one candidate pool for you to choose from.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: {
        type: Type.STRING,
        description:
          "Concise Google Books search query (2-4 words max). Use plain keywords for general topics (e.g. 'time management'). " +
          "Prefix with 'inauthor:' for a specific author (e.g. 'inauthor:Jane Austen'), 'intitle:' for a specific title (e.g. 'intitle:Wuthering Heights'), " +
          "or 'subject:' for a genre/category — use subject: only as a single-word broad filter (e.g. 'subject:fiction'), never multi-word phrases. " +
          "Never pass full conversational sentences, and avoid vague difficulty words like 'easy', 'beginner', 'simple', 'guide', 'quick', 'basic' — " +
          "these dilute search precision and tend to surface instructional non-fiction books instead of actual novels.",
      },
    },
    required: ["query"],
  },
};

export const presentRecommendationsDeclaration: FunctionDeclaration = {
  name: "presentRecommendations",
  description:
    "Present final book recommendations to the user. Must be called after searchGoogleBooks returns results — never write recommendations as plain text. " +
    "The index refers to the position in the FULL cumulative candidate pool (across all searchGoogleBooks calls made so far), not just the most recent call.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      recommendations: {
        type: Type.ARRAY,
        description:
           "Up to 3 recommended books, each referencing a book from the cumulative search results by its 0-based index. " +
          "It is acceptable to return fewer than 3, or an empty array, if fewer books genuinely match the user's request.",
        items: {
          type: Type.OBJECT,
          properties: {
            index: {
              type: Type.NUMBER,
              description:
                "The 0-based index of the chosen book in the search results array.",
            },
            blurb: {
              type: Type.STRING,
              description:
                "A 1-2 sentence reason why this book fits the user's request. Do NOT repeat the title or author here.",
            },
          },
          required: ["index", "blurb"],
        },
      },
    },
    required: ["recommendations"],
  },
};
