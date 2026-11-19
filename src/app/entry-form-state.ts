import type { RequiredEntryField } from "@/lib/entry-required-fields";

// What the create-entry action returns to the form. It lives outside
// actions.ts because a "use server" file may only export async functions.

export type EntryFormValues = {
  date: string;
  hours: string;
  details: string;
  link: string;
  attendees: string;
  decisions: string;
  action_items: string;
};

export type EntryFormState = {
  status: "idle" | "success" | "error";
  message: string | null;
  fieldErrors: Partial<Record<RequiredEntryField, string>>;
  // What the user typed, sent back on an error so the form is not emptied.
  values: EntryFormValues | null;
};

export const initialEntryFormState: EntryFormState = {
  status: "idle",
  message: null,
  fieldErrors: {},
  values: null,
};

export type DemoSignInState = { message: string | null };

export const initialDemoSignInState: DemoSignInState = { message: null };
