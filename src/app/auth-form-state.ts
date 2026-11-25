import type { CredentialField } from "@/lib/credentials";

// What the sign-up and sign-in actions return to the form. It lives outside
// auth-actions.ts because a "use server" file may only export async functions.

export type AuthFormState = {
  status: "idle" | "success" | "error";
  message: string | null;
  fieldErrors: Partial<Record<CredentialField, string>>;
  // The email the user typed, sent back so the form is not emptied. The
  // password is never sent back.
  email: string;
};

export const initialAuthFormState: AuthFormState = {
  status: "idle",
  message: null,
  fieldErrors: {},
  email: "",
};
