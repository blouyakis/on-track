export type Role = 'contributor' | 'overseer'

export type Membership = {
  userId: string
  projectId: string
  role: Role
}

export type Entry = {
  id: string
  projectId: string
  authorId: string
}

export type Project = {
  id: string
  name: string
}

// The user's role in the project, or null when they are not a member.
function roleIn(
  userId: string,
  projectId: string,
  memberships: Membership[],
): Role | null {
  const membership = memberships.find(
    (m) => m.userId === userId && m.projectId === projectId,
  )
  return membership?.role ?? null
}

export function canReadProject(
  userId: string,
  projectId: string,
  memberships: Membership[],
): boolean {
  return roleIn(userId, projectId, memberships) !== null
}

export function canModifyEntry(
  userId: string,
  entry: Entry,
  memberships: Membership[],
): boolean {
  return (
    entry.authorId === userId &&
    roleIn(userId, entry.projectId, memberships) === 'contributor'
  )
}

export function visibleEntries(
  userId: string,
  projectId: string,
  entries: Entry[],
  memberships: Membership[],
): Entry[] {
  if (!canReadProject(userId, projectId, memberships)) return []
  return entries.filter((e) => e.projectId === projectId)
}

export function visibleProject(
  userId: string,
  project: Project,
  memberships: Membership[],
): Project | null {
  return canReadProject(userId, project.id, memberships) ? project : null
}
