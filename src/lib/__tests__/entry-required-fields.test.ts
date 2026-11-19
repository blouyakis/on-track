import { describe, expect, test } from 'vitest'
import { checkRequiredFields } from '@/lib/entry-required-fields'

const complete = {
  date: '2026-11-14',
  hours: '1.5',
  type: 'work',
  details: 'Wrote the migration.',
}

describe('checkRequiredFields', () => {
  test('returns no errors when date, hours, type and details are present', () => {
    expect(checkRequiredFields(complete)).toEqual([])
  })

  test.each(['date', 'hours', 'type', 'details'] as const)(
    'reports %s when it is empty',
    (field) => {
      const errors = checkRequiredFields({ ...complete, [field]: '' })

      expect(errors).toHaveLength(1)
      expect(errors[0].field).toBe(field)
      expect(errors[0].message).not.toBe('')
    },
  )

  test('treats whitespace-only values as missing', () => {
    const errors = checkRequiredFields({ ...complete, details: '   \n ' })

    expect(errors.map((error) => error.field)).toEqual(['details'])
  })

  test('reports every missing field, in form order', () => {
    const errors = checkRequiredFields({
      date: '',
      hours: '',
      type: '',
      details: '',
    })

    expect(errors.map((error) => error.field)).toEqual([
      'date',
      'hours',
      'type',
      'details',
    ])
  })

  test('only checks presence: the full rules are a separate feature', () => {
    expect(
      checkRequiredFields({ ...complete, date: '2999-01-01', hours: '99' }),
    ).toEqual([])
  })
})
