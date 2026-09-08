import { Type, FunctionDeclaration } from "@google/genai";
const apiKey = process.env.GOOGLE_BOOKS_API_KEY;

export async function searchGoogleBooks({ query }: { query: string }) {
  try {
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=3${apiKey ? `&key=${apiKey}` : ""}`;
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
    console.error("Errorsearching Google Books: ", error);
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
          "Concise, targeted Google Books search query. Keep it under 3-4 words. Supports syntax like 'intitle:', 'inauthor:', 'subject:'. Example: 'beginner science fiction' or 'intitle:Project Hail Mary'. NEVER pass full conversational sentences." +
          "Search keywords for the Google Books API. Use plain keywords for general topics (e.g. 'science fiction', 'time management'). " +
          "When the user asks for books by a SPECIFIC AUTHOR, prefix with 'inauthor:' (e.g. 'inauthor:Jane Austen'). " +
          "When the user asks for a SPECIFIC TITLE, prefix with 'intitle:' (e.g. 'intitle:Wuthering Heights'). " +
          "When the user asks for a genre or subject category, you may use 'subject:' (e.g. 'subject:psychology').",
      },
    },
    required: ["query"],
  },
};

export const presentRecommendationsDeclaration = {
  name: "presentRecommendations",
  description:
    "Present the final book recommendations to the user. You MUST call this after searchGoogleBooks returns results. Do not write the final recommendation as plain text — always use this function.",
  parameters: {
    type: "OBJECT",
    properties: {
      recommendations: {
        type: "ARRAY",
        description:
          "Up to 3 recommended books, each referencing a book from the search results by its index (0-based).",
        items: {
          type: "OBJECT",
          properties: {
            index: {
              type: "NUMBER",
              description:
                "The 0-based index of the chosen book in the search results array.",
            },
            blurb: {
              type: "STRING",
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
