"use client";

import { useActionState, useId } from "react";
import { createProject, joinProject } from "@/app/project-actions";
import { initialProjectFormState } from "@/app/project-form-state";
import { INVITE_CODE_MAX_LENGTH } from "@/lib/invite-code";
import { PROJECT_NAME_MAX_LENGTH } from "@/lib/project-name";

const fieldClass =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";
const hintClass = "text-sm text-zinc-600 dark:text-zinc-400";
const errorClass = "text-sm text-red-700 dark:text-red-400";

const COPY = {
  create: {
    action: createProject,
    label: "Project name",
    name: "name",
    maxLength: PROJECT_NAME_MAX_LENGTH,
    submit: "Create project",
    pending: "Creating the project…",
  },
  join: {
    action: joinProject,
    label: "Invite code",
    name: "invite_code",
    maxLength: INVITE_CODE_MAX_LENGTH,
    submit: "Join project",
    pending: "Joining the project…",
  },
} as const;

export type ProjectFormMode = keyof typeof COPY;

// One form for both: each has a single field and a button. The checks in the
// browser (required, length) are for convenience; the server actions
// validate every submission again.
export function ProjectForm({ mode }: { mode: ProjectFormMode }) {
  const copy = COPY[mode];

  // The server action is passed straight through so the form still posts
  // before JavaScript has loaded.
  const [state, formAction, pending] = useActionState(
    copy.action,
    initialProjectFormState,
  );

  // The label holds only the field's name. The error is tied to the input
  // instead, so a screen reader reads it after the name.
  const id = useId();
  const fieldId = `${id}-field`;
  const errorId = `${id}-error`;

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <label htmlFor={fieldId} className="text-sm font-medium">
          {copy.label}
        </label>
        <input
          id={fieldId}
          type="text"
          name={copy.name}
          required
          maxLength={copy.maxLength}
          autoComplete="off"
          defaultValue={state.value}
          aria-invalid={state.fieldError ? true : undefined}
          aria-describedby={state.fieldError ? errorId : undefined}
          className={fieldClass}
        />
        {state.fieldError && (
          <p id={errorId} className={errorClass}>
            {state.fieldError}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
      >
        {copy.submit}
      </button>

      {pending && <p className={hintClass}>{copy.pending}</p>}
      {!pending && state.message && (
        <p role="alert" className={errorClass}>
          {state.message}
        </p>
      )}
    </form>
  );
}
