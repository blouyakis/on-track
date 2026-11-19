import { describe, expect, test } from 'vitest'
import {
  ENTRY_TYPES,
  ENTRY_TYPE_LABELS,
  isEntryType,
  isMeetingStyleType,
} from '@/lib/entry-types'

describe('ENTRY_TYPES', () => {
  test('lists the eleven PRD types, each as its own value', () => {
    expect(ENTRY_TYPES).toEqual([
      'work',
      'admin',
      'meeting',
      'check_in',
      'standup',
      'async_update',
      'planning',
      'sprint_planning',
      'review',
      'retrospective',
      'other',
    ])
    expect(new Set(ENTRY_TYPES).size).toBe(11)
  })

  test('has a display label for every type, matching the PRD wording', () => {
    expect(ENTRY_TYPE_LABELS).toEqual({
      work: 'Work',
      admin: 'Admin',
      meeting: 'Meeting',
      check_in: 'Check-in',
      standup: 'Standup',
      async_update: 'Async update',
      planning: 'Planning',
      sprint_planning: 'Sprint planning',
      review: 'Review',
      retrospective: 'Retrospective',
      other: 'Other',
    })
  })
})

describe('isEntryType', () => {
  test.each(ENTRY_TYPES)('accepts %s', (type) => {
    expect(isEntryType(type)).toBe(true)
  })

  test.each(['', 'Meeting', 'check-in', 'task', null, undefined, 3])(
    'rejects %j',
    (value) => {
      expect(isEntryType(value)).toBe(false)
    },
  )
})

describe('isMeetingStyleType', () => {
  test.each([
    'meeting',
    'check_in',
    'standup',
    'planning',
    'sprint_planning',
    'review',
    'retrospective',
  ] as const)('%s adds attendees, decisions and action items', (type) => {
    expect(isMeetingStyleType(type)).toBe(true)
  })

  test.each(['work', 'admin', 'async_update', 'other'] as const)(
    '%s does not',
    (type) => {
      expect(isMeetingStyleType(type)).toBe(false)
    },
  )
})
