// The eleven entry types from the PRD, in PRD order. Each is its own type;
// none is an alias of another.
export const ENTRY_TYPES = [
  "work",
  "admin",
  "meeting",
  "check_in",
  "standup",
  "async_update",
  "planning",
  "sprint_planning",
  "review",
  "retrospective",
  "other",
] as const;

export type EntryType = (typeof ENTRY_TYPES)[number];

export const ENTRY_TYPE_LABELS: Record<EntryType, string> = {
  work: "Work",
  admin: "Admin",
  meeting: "Meeting",
  check_in: "Check-in",
  standup: "Standup",
  async_update: "Async update",
  planning: "Planning",
  sprint_planning: "Sprint planning",
  review: "Review",
  retrospective: "Retrospective",
  other: "Other",
};

// The types that also record attendees, decisions made and action items.
export const MEETING_STYLE_TYPES: readonly EntryType[] = [
  "meeting",
  "check_in",
  "standup",
  "planning",
  "sprint_planning",
  "review",
  "retrospective",
];

export function isEntryType(value: unknown): value is EntryType {
  return (
    typeof value === "string" &&
    (ENTRY_TYPES as readonly string[]).includes(value)
  );
}

export function isMeetingStyleType(type: EntryType): boolean {
  return MEETING_STYLE_TYPES.includes(type);
}
