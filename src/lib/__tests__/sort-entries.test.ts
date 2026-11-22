import { describe, expect, test } from "vitest";
import { sortNewestFirst } from "@/lib/sort-entries";

const entry = (id: string, entry_date: string, created_at: string) => ({
  id,
  entry_date,
  created_at,
});

describe("sortNewestFirst", () => {
  test("orders entries by entry date, newest first", () => {
    const sorted = sortNewestFirst([
      entry("a", "2026-11-10", "2026-11-10T09:00:00Z"),
      entry("b", "2026-11-14", "2026-11-14T09:00:00Z"),
      entry("c", "2026-11-12", "2026-11-12T09:00:00Z"),
    ]);

    expect(sorted.map((e) => e.id)).toEqual(["b", "c", "a"]);
  });

  test("breaks ties on the same date by when the entry was created, newest first", () => {
    const sorted = sortNewestFirst([
      entry("early", "2026-11-14", "2026-11-14T09:00:00Z"),
      entry("late", "2026-11-14", "2026-11-14T17:30:00Z"),
    ]);

    expect(sorted.map((e) => e.id)).toEqual(["late", "early"]);
  });

  test("uses the entry date, not the creation time, for an entry logged late", () => {
    const sorted = sortNewestFirst([
      entry("backfilled", "2026-11-01", "2026-11-15T09:00:00Z"),
      entry("recent", "2026-11-14", "2026-11-14T09:00:00Z"),
    ]);

    expect(sorted.map((e) => e.id)).toEqual(["recent", "backfilled"]);
  });

  test("returns a new array and leaves the input unchanged", () => {
    const input = [
      entry("a", "2026-11-10", "2026-11-10T09:00:00Z"),
      entry("b", "2026-11-14", "2026-11-14T09:00:00Z"),
    ];

    const sorted = sortNewestFirst(input);

    expect(sorted).not.toBe(input);
    expect(input.map((e) => e.id)).toEqual(["a", "b"]);
  });

  test("returns an empty list for no entries", () => {
    expect(sortNewestFirst([])).toEqual([]);
  });
});
