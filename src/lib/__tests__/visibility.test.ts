import { describe, expect, test } from 'vitest'
import {
  canModifyEntry,
  canReadProject,
  type Entry,
  type Membership,
} from '@/lib/visibility'

const memberships: Membership[] = [
  { userId: 'alice', projectId: 'p1', role: 'contributor' },
  { userId: 'olivia', projectId: 'p1', role: 'overseer' },
  { userId: 'bob', projectId: 'p2', role: 'contributor' },
]

describe('canReadProject', () => {
  test('a contributor of the project can read it', () => {
    expect(canReadProject('alice', 'p1', memberships)).toBe(true)
  })

  test('the overseer of the project can read it', () => {
    expect(canReadProject('olivia', 'p1', memberships)).toBe(true)
  })

  test('a member of a different project cannot read it', () => {
    expect(canReadProject('bob', 'p1', memberships)).toBe(false)
  })

  test('a user with no memberships cannot read it', () => {
    expect(canReadProject('stranger', 'p1', memberships)).toBe(false)
  })
})

describe('canModifyEntry', () => {
  const contributors: Membership[] = [
    ...memberships,
    { userId: 'carol', projectId: 'p1', role: 'contributor' },
  ]
  const aliceEntry: Entry = { id: 'e1', projectId: 'p1', authorId: 'alice' }

  test('a contributor can edit or delete an entry they created', () => {
    expect(canModifyEntry('alice', aliceEntry, contributors)).toBe(true)
  })

  test("a contributor cannot edit or delete a teammate's entry", () => {
    expect(canModifyEntry('carol', aliceEntry, contributors)).toBe(false)
  })

  test('an author who is no longer a member cannot edit or delete their entry', () => {
    const withoutAlice = contributors.filter((m) => m.userId !== 'alice')
    expect(canModifyEntry('alice', aliceEntry, withoutAlice)).toBe(false)
  })

  test('an author cannot edit or delete an entry in a project they are not a member of', () => {
    const otherProjectEntry: Entry = { id: 'e2', projectId: 'p2', authorId: 'alice' }
    expect(canModifyEntry('alice', otherProjectEntry, contributors)).toBe(false)
  })
})
