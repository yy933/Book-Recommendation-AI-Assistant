export type OpenLibraryDoc = {
  key: string;
  title: string;
  author_name?: string[];
  first_publish_year?: number;
  subject?: string[];
  cover_i?: number;
};

export type Book = {
  title: string;
  authors?: string[];
  description?: string;
  link?: string;
  publishedDate?: string;
  pageCount?: number;
  categories?: string[];
  averageRating?: number;
  ratingsCount?: number;
  publisher?: string;
  source?: string;
};