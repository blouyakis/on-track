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
