"use server";

import { redirect } from "next/navigation";
import type { AuthFormState } from "@/app/auth-form-state";
import { HOME_PATH } from "@/lib/auth-routes";
import { validateCredentials } from "@/lib/credentials";
import { createClient } from "@/utils/supabase/server";

function text(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

export async function signUp(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = text(formData, "email").trim();
  const password = text(formData, "password");

  // Validated here on every submission, whatever the browser checked.
  const fieldErrors: AuthFormState["fieldErrors"] = {};
  for (const { field, message } of validateCredentials(
    { email, password },
    "sign-up",
  )) {
    fieldErrors[field] = message;
  }
  if (Object.keys(fieldErrors).length > 0) {
    return { status: "error", message: null, fieldErrors, email };
  }

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
