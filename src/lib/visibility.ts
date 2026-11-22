export type Role = "contributor" | "overseer";

export type Membership = {
  userId: string;
  projectId: string;
  role: Role;
};

export type Entry = {
  id: string;
  projectId: string;
  authorId: string;
};

export type Project = {
  id: string;
  name: string;
};

// The user's role in the project, or null when they are not a member.
// Assumes at most one membership per user and project, which the database
// enforces with the memberships primary key (project_id, user_id).
function roleIn(
  userId: string,
  projectId: string,
  memberships: Membership[],
): Role | null {
  const membership = memberships.find(
    (m) => m.userId === userId && m.projectId === projectId,
  );
  return membership?.role ?? null;
}

export function canReadProject(
  userId: string,
  projectId: string,
  memberships: Membership[],
): boolean {
  return roleIn(userId, projectId, memberships) !== null;
}

export function canModifyEntry(
  userId: string,
  entry: Entry,
  memberships: Membership[],
): boolean {
  return (
    entry.authorId === userId &&
    roleIn(userId, entry.projectId, memberships) === "contributor"
  );
}

// Generic so callers keep their full row type (date, hours, type, ...).
export function visibleEntries<E extends Entry>(
  userId: string,
  projectId: string,
  entries: E[],
  memberships: Membership[],
): E[] {
  if (!canReadProject(userId, projectId, memberships)) return [];
  return entries.filter((e) => e.projectId === projectId);
}

// Returns the caller's object as is, so any extra fields pass through to
// members. Strip private fields (such as an invite code) before calling.
export function visibleProject<P extends Project>(
  userId: string,
  project: P,
  memberships: Membership[],
): P | null {
  return canReadProject(userId, project.id, memberships) ? project : null;
}
