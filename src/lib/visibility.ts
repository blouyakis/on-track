export type Role = 'contributor' | 'overseer'

export type Membership = {
  userId: string
  projectId: string
  role: Role
}

export function canReadProject(
  userId: string,
  projectId: string,
  memberships: Membership[],
): boolean {
  return memberships.some(
    (m) => m.userId === userId && m.projectId === projectId,
  )
}

export type Entry = {
  id: string
  projectId: string
  authorId: string
}

export function canModifyEntry(
  userId: string,
  entry: Entry,
  memberships: Membership[],
): boolean {
  return (
    entry.authorId === userId &&
    memberships.some(
      (m) =>
        m.userId === userId &&
        m.projectId === entry.projectId &&
        m.role === 'contributor',
    )
  )
}

export function visibleEntries(
  userId: string,
  projectId: string,
  entries: Entry[],
  memberships: Membership[],
): Entry[] {
  return entries.filter((e) => e.projectId === projectId)
}
