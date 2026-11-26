// What the create-project and join-project actions return to their forms.
// Each form has one field. It lives outside project-actions.ts because a
// "use server" file may only export async functions.

export type ProjectFormState = {
  status: "idle" | "error";
  // About the whole submission, for example a failed save.
  message: string | null;
  // About the one field.
  fieldError: string | null;
  // What the user typed, sent back on an error so the form is not emptied.
  value: string;
};

export const initialProjectFormState: ProjectFormState = {
  status: "idle",
  message: null,
  fieldError: null,
  value: "",
};
