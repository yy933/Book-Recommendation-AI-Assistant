
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
