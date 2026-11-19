"use server";

import { refresh } from "next/cache";
import {
  DEMO_CONTRIBUTOR_EMAIL,
  DEMO_CONTRIBUTOR_PASSWORD,
  isDemoSignInEnabled,
} from "@/app/demo-sign-in";
import type {
  DemoSignInState,
  EntryFormState,
  EntryFormValues,
} from "@/app/entry-form-state";
import { checkRequiredFields } from "@/lib/entry-required-fields";
import { isEntryType, isMeetingStyleType } from "@/lib/entry-types";
import { createClient } from "@/utils/supabase/server";

type MembershipRow = { project_id: string; role: string };

// The Supabase client is not typed against the schema yet, so the row is
// checked here instead of being trusted.
function toMembership(row: unknown): MembershipRow | null {
  if (typeof row !== "object" || row === null) return null;
  const { project_id, role } = row as Record<string, unknown>;
  return typeof project_id === "string" && typeof role === "string"
    ? { project_id, role }
    : null;
}

function text(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function textOrNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

// TEMPORARY, until the authentication feature lands: signs in the seeded demo
// contributor so the page has a real session and Row Level Security applies.
export async function signInAsDemoContributor(): Promise<DemoSignInState> {
  if (!isDemoSignInEnabled()) {
    return { message: "Demo sign-in is turned off here." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: DEMO_CONTRIBUTOR_EMAIL,
    password: DEMO_CONTRIBUTOR_PASSWORD,
  });

  if (error) {
    console.error("Demo sign-in failed:", error.message);
    return {
      message:
        "Could not sign in. Is the local database seeded? Run `npx supabase db reset`.",
    };
  }

  refresh();
  return { message: null };
}

export async function createEntry(
  _previous: EntryFormState,
  formData: FormData,
): Promise<EntryFormState> {
  const type = text(formData, "type");
  const values: EntryFormValues = {
    date: text(formData, "date"),
    hours: text(formData, "hours"),
    details: text(formData, "details"),
    link: text(formData, "link"),
    attendees: text(formData, "attendees"),
    decisions: text(formData, "decisions"),
    action_items: text(formData, "action_items"),
  };

  const failure = (
    message: string | null,
    fieldErrors: EntryFormState["fieldErrors"] = {},
  ): EntryFormState => ({ status: "error", message, fieldErrors, values });

  // 1. Who is asking? Never assume the page already checked.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return failure("Sign in to add an entry.");
  }

  // 2. The project and the role come from the user's membership, looked up
  //    here. Nothing about either is read from the form. (One project per
  //    user for now; choosing between projects comes with the projects
  //    feature.)
  const { data } = await supabase
    .from("memberships")
    .select("project_id, role")
    .eq("user_id", user.id)
    .eq("role", "contributor")
    .limit(1)
    .maybeSingle();
  const membership = toMembership(data);
  if (!membership || membership.role !== "contributor") {
    return failure("Only contributors on a project can add entries.");
  }

  // 3. Required fields only. The full validation rules are a separate feature.
  const fieldErrors: EntryFormState["fieldErrors"] = {};
  for (const { field, message } of checkRequiredFields({ ...values, type })) {
    fieldErrors[field] = message;
  }
  if (!fieldErrors.type && !isEntryType(type)) {
    fieldErrors.type = "Choose a type from the list.";
  }
  const hours = Number(values.hours);
  if (!fieldErrors.hours && !Number.isFinite(hours)) {
    fieldErrors.hours = "Hours must be a number.";
  }
  if (Object.keys(fieldErrors).length > 0 || !isEntryType(type)) {
    return failure(null, fieldErrors);
  }

  // 4. Only meeting-style types keep attendees, decisions and action items.
  const isMeeting = isMeetingStyleType(type);
  const { error } = await supabase.from("entries").insert({
    project_id: membership.project_id,
    author_id: user.id,
    entry_date: values.date,
    hours,
    type,
    details: values.details.trim(),
    link: textOrNull(values.link),
    attendees: isMeeting ? textOrNull(values.attendees) : null,
    decisions: isMeeting ? textOrNull(values.decisions) : null,
    action_items: isMeeting ? textOrNull(values.action_items) : null,
  });

  if (error) {
    // Details stay in the server log; the user gets a generic message.
    console.error("Saving an entry failed:", error.message);
    return failure("The entry could not be saved. Check the fields and try again.");
  }

  refresh();
  return { status: "success", message: "Entry added.", fieldErrors: {}, values: null };
}
