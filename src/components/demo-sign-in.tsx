"use client";

import { useActionState } from "react";
import { signInAsDemoContributor } from "@/app/actions";
import { initialDemoSignInState } from "@/app/entry-form-state";

// TEMPORARY, until the authentication feature lands.
export function DemoSignIn() {
  const [state, formAction, pending] = useActionState(
    signInAsDemoContributor,
    initialDemoSignInState,
  );

  return (
    <form action={formAction} className="flex flex-col items-start gap-3">
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
      >
        Continue as demo contributor
      </button>
      <p aria-live="polite" className="text-sm text-red-700 dark:text-red-400">
        {state.message}
      </p>
    </form>
  );
}
