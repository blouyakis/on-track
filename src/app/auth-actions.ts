"use server";

import { redirect } from "next/navigation";
import type { AuthFormState } from "@/app/auth-form-state";
import { HOME_PATH, SIGN_IN_PATH } from "@/lib/auth-routes";
import { type CredentialsMode, validateCredentials } from "@/lib/credentials";
import { createClient } from "@/utils/supabase/server";

function text(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

type Submission =
  | { ok: true; email: string; password: string }
  | { ok: false; state: AuthFormState };

// Reads the two fields and validates them. This runs on every submission,
// whatever the browser checked.
function readCredentials(
  formData: FormData,
  mode: CredentialsMode,
): Submission {
  const email = text(formData, "email").trim();
  const password = text(formData, "password");

  const fieldErrors: AuthFormState["fieldErrors"] = {};
  for (const { field, message } of validateCredentials(
    { email, password },
    mode,
  )) {
    fieldErrors[field] = message;
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      ok: false,
      state: { status: "error", message: null, fieldErrors, email },
    };
  }
  return { ok: true, email, password };
}

export async function signUp(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const submission = readCredentials(formData, "sign-up");
  if (!submission.ok) return submission.state;
  const { email, password } = submission;

  const supabase = await createClient();
  const { data } = await supabase.auth.signUp({ email, password });

  // No session means the Supabase project confirms email addresses first.
  if (!data.session) {
    return {
      status: "success",
      message: "Check your email to confirm your account, then sign in.",
      fieldErrors: {},
      email: "",
    };
  }

  redirect(HOME_PATH);
}

export async function signIn(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const submission = readCredentials(formData, "sign-in");
  if (!submission.ok) return submission.state;
  const { email, password } = submission;

  const supabase = await createClient();
  await supabase.auth.signInWithPassword({ email, password });

  redirect(HOME_PATH);
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();

  redirect(SIGN_IN_PATH);
}
