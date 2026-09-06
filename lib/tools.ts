import { Type, FunctionDeclaration } from "@google/genai";
const apiKey = process.env.GOOGLE_BOOKS_API_KEY;

export async function searchGoogleBooks({ query }: { query: string }) {
  try {
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=3&langRestrict=en${apiKey ? `&key=${apiKey}` : ""}`;
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

export const bookSearchToolDeclaration: FunctionDeclaration = {
  name: "searchGoogleBooks",
  description:
    "Search for books using Google Books API based on keywords, topics, or titles and return a list of relevant books. ",
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: {
        type: Type.STRING,
        description:
          "Search keywords. For example, 'science fiction', 'psychology', 'time management', 'Jane Austen', 'Wuthering Heights', etc.",
      },
    },
    required: ["query"],
  },
};
