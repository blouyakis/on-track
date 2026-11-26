"use server";

import { redirect } from "next/navigation";
import type { ProjectFormState } from "@/app/project-form-state";
import { projectNameError } from "@/lib/project-name";
import { projectPath } from "@/lib/project-path";
import { createClient } from "@/utils/supabase/server";

function text(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

export async function createProject(
  _previous: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  const name = text(formData, "name");

  const failure = (
    message: string | null,
    fieldError: string | null = null,
  ): ProjectFormState => ({
    status: "error",
    message,
    fieldError,
    value: name,
  });

  // 1. Who is asking? Never assume the page already checked.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return failure("Sign in to create a project.");

  // 2. The name is checked here on every submission.
  const nameError = projectNameError(name);
  if (nameError) return failure(null, nameError);

  // 3. Only the name is sent. The database function takes the user from the
  //    session, makes them the overseer and makes the invite code.
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
    return failure("The project could not be created. Try again.");
  }

  redirect(projectPath(projectId));
}
