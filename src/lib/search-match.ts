/**
 * Ranks how well `text` matches a search query.
 * Returns 0 when there is no match; higher is better.
 */
export function rankSearchMatch(text: string, query: string): number {
  const normalizedText = text.toLowerCase().trim();
  const normalizedQuery = query.toLowerCase().trim();

  if (!normalizedQuery) return 1;
  if (!normalizedText) return 0;

  if (normalizedText === normalizedQuery) return 1000;
  if (normalizedText.startsWith(normalizedQuery)) return 900;

  const words = normalizedText.split(/\s+/);
  if (words.some((word) => word.startsWith(normalizedQuery))) return 800;

  if (normalizedText.includes(normalizedQuery)) return 700;

  return 0;
}

export function filterAndRankBySearch<T>(items: T[], query: string, getSearchText: (item: T) => string): T[] {
  const trimmed = query.trim();
  if (!trimmed) return items;

  return items
    .map((item) => ({
      item,
      score: rankSearchMatch(getSearchText(item), trimmed),
    }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || getSearchText(a.item).localeCompare(getSearchText(b.item)))
    .map(({ item }) => item);
}
