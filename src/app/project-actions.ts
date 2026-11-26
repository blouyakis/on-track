"use server";

import { redirect } from "next/navigation";
import type { ProjectFormState } from "@/app/project-form-state";
import {
  INVALID_INVITE_CODE_MESSAGE,
  inviteCodeError,
  normalizeInviteCode,
} from "@/lib/invite-code";
import { projectNameError } from "@/lib/project-name";
import { projectPath } from "@/lib/project-path";
import { createClient } from "@/utils/supabase/server";

function text(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

// An error about the whole submission. `value` is what the user typed, sent
// back so the form is not emptied.
function formError(value: string, message: string): ProjectFormState {
  return { status: "error", message, fieldError: null, value };
}

// An error about the form's one field.
function fieldError(value: string, message: string): ProjectFormState {
  return { status: "error", message: null, fieldError: message, value };
}

// Who is asking? Every action checks for itself and never assumes the page
// already did.
async function signedInClient() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ? supabase : null;
}

export async function createProject(
  _previous: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  const name = text(formData, "name");

  const supabase = await signedInClient();
  if (!supabase) return formError(name, "Sign in to create a project.");

  // The name is checked here on every submission.
  const nameError = projectNameError(name);
  if (nameError) return fieldError(name, nameError);

  // Only the name is sent. The database function takes the user from the
  // session, makes them the overseer and makes the invite code.
  const { data, error } = await supabase.rpc("create_project", {
    p_name: name.trim(),
  });
  const projectId: unknown = data;

  if (error || typeof projectId !== "string") {
    // Details stay in the server log; the user gets a generic message.
    console.error(
      "Creating a project failed:",
      error?.message ?? "no project id was returned",
    );
    return formError(name, "The project could not be created. Try again.");
  }

  redirect(projectPath(projectId));
}

export async function joinProject(
  _previous: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  const typed = text(formData, "invite_code");

  const supabase = await signedInClient();
  if (!supabase) return formError(typed, "Sign in to join a project.");

  // A blank or impossibly long code is not looked up at all.
  const codeError = inviteCodeError(typed);
  if (codeError) return fieldError(typed, codeError);

  // Only the code is sent. The database function takes the user from the
  // session and makes them a contributor. It returns the project's id, or
  // null when no project has the code.
  const { data, error } = await supabase.rpc("join_project", {
    p_invite_code: normalizeInviteCode(typed),
  });
  const projectId: unknown = data;

  if (error) console.error("Joining a project failed:", error.message);

  // One answer for every code that did not work, so it says nothing about
  // whether a project exists.
  if (error || typeof projectId !== "string") {
    return fieldError(typed, INVALID_INVITE_CODE_MESSAGE);
  }

  redirect(projectPath(projectId));
}
