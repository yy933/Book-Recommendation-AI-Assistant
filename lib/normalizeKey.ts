export const normalizeKey = (title: string, authors: string[]): string => {
  const normalizedTitle = title
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .trim();
  const normalizedAuthor = (authors[0] || "")
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .trim();
  return `${normalizedTitle}|${normalizedAuthor}`;
}
