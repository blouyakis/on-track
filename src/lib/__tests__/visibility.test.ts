import { describe, expect, test } from 'vitest'
import { canReadProject, type Membership } from '@/lib/visibility'

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
