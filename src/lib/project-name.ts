// The rules for a project's name. The create-project action runs them on
// every submission, and the database function checks the same limits.

export const PROJECT_NAME_MAX_LENGTH = 100;

// Returns what is wrong with the name, or null when it is fine. The name is
// saved trimmed, so the spaces around it are not counted.
export function projectNameError(name: string): string | null {
  const trimmed = name.trim();
  if (trimmed === "") return "Project name is required.";
  if (trimmed.length > PROJECT_NAME_MAX_LENGTH) {
    return `Project name must be ${PROJECT_NAME_MAX_LENGTH} characters or fewer.`;
  }
  return null;
}
