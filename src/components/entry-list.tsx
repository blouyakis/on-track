import { ENTRY_TYPE_LABELS, isEntryType } from "@/lib/entry-types";

export type EntryRow = {
  id: string;
  author_id: string;
  entry_date: string;
  hours: number;
  type: string;
  details: string;
  link: string | null;
  attendees: string | null;
  decisions: string | null;
  action_items: string | null;
  created_at: string;
};

const dateFormat = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeZone: "UTC",
});

// entry_date is a plain calendar date, so it is formatted in UTC to keep the
// day from shifting with the server's time zone.
function formatDate(entryDate: string): string {
  const date = new Date(`${entryDate}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? entryDate : dateFormat.format(date);
}

// Link format is not validated yet, so only plain web addresses become
// clickable. Anything else (for example a javascript: address) stays text.
function isWebAddress(link: string): boolean {
  return /^https?:\/\//i.test(link);
}

export function EntryList({
  entries,
  currentUserId,
}: {
  entries: readonly EntryRow[];
  currentUserId: string;
}) {
  if (entries.length === 0) {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        No entries yet. Add the first one above.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {entries.map((entry) => (
        <li
          key={entry.id}
          className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
        >
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
            <time dateTime={entry.entry_date} className="font-semibold">
              {formatDate(entry.entry_date)}
            </time>
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium dark:bg-zinc-800">
              {isEntryType(entry.type)
                ? ENTRY_TYPE_LABELS[entry.type]
                : entry.type}
            </span>
            <span className="tabular-nums">{entry.hours} h</span>
            <span className="text-zinc-600 dark:text-zinc-400">
              {entry.author_id === currentUserId ? "You" : "Teammate"}
            </span>
          </div>

          <p className="mt-2 whitespace-pre-wrap break-words text-sm">
            {entry.details}
          </p>

          {entry.link &&
            (isWebAddress(entry.link) ? (
              <a
                href={entry.link}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block break-all text-sm underline"
              >
                {entry.link}
              </a>
            ) : (
              <p className="mt-2 break-all text-sm">{entry.link}</p>
            ))}

          {(entry.attendees || entry.decisions || entry.action_items) && (
            <dl className="mt-3 grid gap-x-4 gap-y-1 text-sm sm:grid-cols-[auto_1fr]">
              {entry.attendees && (
                <>
                  <dt className="font-medium">Attendees</dt>
                  <dd className="whitespace-pre-wrap">{entry.attendees}</dd>
                </>
              )}
              {entry.decisions && (
                <>
                  <dt className="font-medium">Decisions made</dt>
                  <dd className="whitespace-pre-wrap">{entry.decisions}</dd>
                </>
              )}
              {entry.action_items && (
                <>
                  <dt className="font-medium">Action items</dt>
                  <dd className="whitespace-pre-wrap">{entry.action_items}</dd>
                </>
              )}
            </dl>
          )}
        </li>
      ))}
    </ul>
  );
}
