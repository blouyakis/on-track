"use client";

import { useActionState, useState } from "react";
import { createEntry } from "@/app/actions";
import {
  initialEntryFormState,
  type EntryFormState,
} from "@/app/entry-form-state";
import {
  ENTRY_TYPES,
  ENTRY_TYPE_LABELS,
  isEntryType,
  isMeetingStyleType,
} from "@/lib/entry-types";

const fieldClass =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";
const labelClass = "flex flex-col gap-1 text-sm font-medium";
const errorClass = "text-sm font-normal text-red-700 dark:text-red-400";

export function EntryForm({ projectId }: { projectId: string }) {
  const [type, setType] = useState("");

  // The server action is passed through with only the project bound to it,
  // so the form still posts before JavaScript has loaded. The action treats
  // the project as a request and checks the membership itself.
  const [state, formAction, pending] = useActionState(
    createEntry.bind(null, projectId),
    initialEntryFormState,
  );

  // React resets the uncontrolled fields after the action. The type is
  // controlled, so clear it here when a new success result arrives.
  const [handledState, setHandledState] = useState<EntryFormState>(state);
  if (state !== handledState) {
    setHandledState(state);
    if (state.status === "success") setType("");
  }

  const showMeetingFields = isEntryType(type) && isMeetingStyleType(type);
  const { fieldErrors, values } = state;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <label className={labelClass}>
          Date
          <input
            type="date"
            name="date"
            required
            defaultValue={values?.date}
            className={fieldClass}
          />
          {fieldErrors.date && (
            <span className={errorClass}>{fieldErrors.date}</span>
          )}
        </label>

        <label className={labelClass}>
          Hours
          <input
            type="number"
            name="hours"
            step="0.25"
            required
            defaultValue={values?.hours}
            className={fieldClass}
          />
          {fieldErrors.hours && (
            <span className={errorClass}>{fieldErrors.hours}</span>
          )}
        </label>

        <label className={labelClass}>
          Type
          <select
            name="type"
            required
            value={type}
            onChange={(event) => setType(event.target.value)}
            className={fieldClass}
          >
            <option value="">Choose a type</option>
            {ENTRY_TYPES.map((entryType) => (
              <option key={entryType} value={entryType}>
                {ENTRY_TYPE_LABELS[entryType]}
              </option>
            ))}
          </select>
          {fieldErrors.type && (
            <span className={errorClass}>{fieldErrors.type}</span>
          )}
        </label>
      </div>

      <label className={labelClass}>
        Details
        <textarea
          name="details"
          rows={3}
          required
          defaultValue={values?.details}
          className={fieldClass}
        />
        {fieldErrors.details && (
          <span className={errorClass}>{fieldErrors.details}</span>
        )}
      </label>

      <label className={labelClass}>
        Link (optional)
        <input
          type="url"
          name="link"
          placeholder="https://"
          defaultValue={values?.link}
          className={fieldClass}
        />
      </label>

      {showMeetingFields && (
        <>
          <label className={labelClass}>
            Attendees
            <input
              type="text"
              name="attendees"
              defaultValue={values?.attendees}
              className={fieldClass}
            />
          </label>

          <label className={labelClass}>
            Decisions made
            <textarea
              name="decisions"
              rows={2}
              defaultValue={values?.decisions}
              className={fieldClass}
            />
          </label>

          <label className={labelClass}>
            Action items
            <textarea
              name="action_items"
              rows={2}
              defaultValue={values?.action_items}
              className={fieldClass}
            />
          </label>
        </>
      )}

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
        >
          Add entry
        </button>
        <p aria-live="polite" className="text-sm">
          {pending ? "Saving…" : state.message}
        </p>
      </div>
    </form>
  );
}
