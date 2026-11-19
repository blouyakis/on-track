// The project log lists entries newest first: by the date the work was done,
// then by when the entry was logged.

export type SortableEntry = {
  // ISO date, YYYY-MM-DD.
  entry_date: string;
  // ISO timestamp.
  created_at: string;
};

export function sortNewestFirst<T extends SortableEntry>(
  entries: readonly T[],
): T[] {
  return [...entries].sort((a, b) => {
    if (a.entry_date !== b.entry_date) {
      return a.entry_date < b.entry_date ? 1 : -1;
    }
    return Date.parse(b.created_at) - Date.parse(a.created_at);
  });
}
