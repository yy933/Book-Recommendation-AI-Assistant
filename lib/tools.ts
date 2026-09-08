import { Type, FunctionDeclaration } from "@google/genai";
const apiKey = process.env.GOOGLE_BOOKS_API_KEY;

export async function searchGoogleBooks({ query }: { query: string }) {
  try {
    const cleanQuery = query.trim().replace(/^["']|["']$/g, "");

    if (!cleanQuery) return { books: [] };
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(cleanQuery)}&maxResults=3${apiKey ? `&key=${apiKey}` : ""}`;
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
    "Search for books using the Google Books API based on keywords, topics, or titles and return a list of recommended books. Use concise keywords or official syntax (e.g., 'subject:fiction', 'intitle:dune'). Avoid long natural language sentences.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: {
        type: Type.STRING,
        description:
          "Concise Google Books search query (2-4 words max). Use plain keywords for general topics (e.g. 'time management'). " +
          "Prefix with 'inauthor:' for a specific author (e.g. 'inauthor:Jane Austen'), 'intitle:' for a specific title (e.g. 'intitle:Wuthering Heights'), " +
          "or 'subject:' for a genre/category (e.g. 'subject:psychology'). Never pass full conversational sentences.",
      },
    },
    required: ["query"],
  },
};

export const presentRecommendationsDeclaration: FunctionDeclaration = {
  name: "presentRecommendations",
  description:
    "Present final book recommendations to the user. You MUST call this after searchGoogleBooks returns results. Do not write the final recommendation as plain text — always use this function.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      recommendations: {
        type: Type.ARRAY,
        description:
          "Up to 3 recommended books, each referencing a book from the search results by its index (0-based).",
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
