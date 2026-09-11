const apiKey = process.env.GOOGLE_BOOKS_API_KEY;

export async function searchGoogleBooks({ query }: { query: string }) {
  try {
    const cleanQuery = query.trim().replace(/^["']|["']$/g, "");

    if (!cleanQuery) return { books: [] };
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(cleanQuery)}&maxResults=10${apiKey ? `&key=${apiKey}` : ""}`;
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`Google Books API error: ${res.status}`);
      return { books: [] };
    }
    const data = await res.json();
    if (!data.items) {
      return { books: [] };
    }
    const books = data.items.map((item: any) => ({
      title: item.volumeInfo.title,
      authors: item.volumeInfo.authors || ["Unknown Author"],
      description: item.volumeInfo.description || "No available description",
      link: item.volumeInfo.infoLink,
      publishedDate: item.volumeInfo.publishedDate || null,
      pageCount: item.volumeInfo.pageCount || null,
      categories: item.volumeInfo.categories || [],
      averageRating: item.volumeInfo.averageRating || null,
      ratingsCount: item.volumeInfo.ratingsCount || null,
      publisher: item.volumeInfo.publisher || "Unknown publisher",
    }));
    return { books };
  } catch (error) {
    console.error("Error searching Google Books: ", error);
    return { books: [] };
  }
}
