"use client";

import Link from "next/link";
import { useActionState, useId } from "react";
import { signIn, signUp } from "@/app/auth-actions";
import { initialAuthFormState } from "@/app/auth-form-state";
import { SIGN_IN_PATH, SIGN_UP_PATH } from "@/lib/auth-routes";
import type { CredentialsMode } from "@/lib/credentials";

const fieldClass =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";
const groupClass = "flex flex-col gap-1";
const labelClass = "text-sm font-medium";
const hintClass = "text-sm text-zinc-600 dark:text-zinc-400";
const errorClass = "text-sm text-red-700 dark:text-red-400";

const COPY = {
  "sign-in": {
    action: signIn,
    submit: "Sign in",
    pending: "Signing in…",
    passwordAutoComplete: "current-password",
    other: {
      prompt: "New here?",
      label: "Create an account",
      href: SIGN_UP_PATH,
    },
  },
  "sign-up": {
    action: signUp,
    submit: "Create account",
    pending: "Creating your account…",
    passwordAutoComplete: "new-password",
    other: {
      prompt: "Already have an account?",
      label: "Sign in",
      href: SIGN_IN_PATH,
    },
  },
} as const;

// One form for both pages. The checks in the browser (required, type, length)
// are for convenience; the server actions validate every submission again.
export function AuthForm({ mode }: { mode: CredentialsMode }) {
  const copy = COPY[mode];

  // The server action is passed straight through so the form still posts
  // before JavaScript has loaded.
  const [state, formAction, pending] = useActionState(
    copy.action,
    initialAuthFormState,
  );
  const { fieldErrors } = state;
  const isSignUp = mode === "sign-up";

  // Each label holds only the field's name. The hint and the error are tied
  // to the input instead, so a screen reader reads them after the name.
  const id = useId();
  const emailId = `${id}-email`;
  const emailErrorId = `${id}-email-error`;
  const passwordId = `${id}-password`;
  const passwordHintId = `${id}-password-hint`;
  const passwordErrorId = `${id}-password-error`;
  const passwordDescribedBy =
    [isSignUp && passwordHintId, fieldErrors.password && passwordErrorId]
      .filter(Boolean)
      .join(" ") || undefined;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className={groupClass}>
        <label htmlFor={emailId} className={labelClass}>
          Email
        </label>
        <input
          id={emailId}
          type="email"
          name="email"
          required
          autoComplete="email"
          defaultValue={state.email}
          aria-invalid={fieldErrors.email ? true : undefined}
          aria-describedby={fieldErrors.email ? emailErrorId : undefined}
          className={fieldClass}
        />
        {fieldErrors.email && (
          <p id={emailErrorId} className={errorClass}>
            {fieldErrors.email}
          </p>
        )}
      </div>

      <div className={groupClass}>
        <label htmlFor={passwordId} className={labelClass}>
          Password
        </label>
        <input
          id={passwordId}
          type="password"
          name="password"
          required
          autoComplete={copy.passwordAutoComplete}
          minLength={isSignUp ? 8 : undefined}
          aria-invalid={fieldErrors.password ? true : undefined}
          aria-describedby={passwordDescribedBy}
          className={fieldClass}
        />
        {isSignUp && (
          <p id={passwordHintId} className={hintClass}>
            At least 8 characters.
          </p>
        )}
        {fieldErrors.password && (
          <p id={passwordErrorId} className={errorClass}>
            {fieldErrors.password}
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
      {!pending && state.message && state.status === "error" && (
        <p role="alert" className={errorClass}>
          {state.message}
        </p>
      )}
      {!pending && state.message && state.status === "success" && (
        <p role="status" className="text-sm">
          {state.message}
        </p>
      )}

      <p className={hintClass}>
        {copy.other.prompt}{" "}
        <Link
          href={copy.other.href}
          className="font-medium text-zinc-900 underline dark:text-zinc-100"
        >
          {copy.other.label}
        </Link>
      </p>
    </form>
  );
}
