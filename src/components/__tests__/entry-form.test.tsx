import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { EntryForm } from '@/components/entry-form'
import { ENTRY_TYPE_LABELS } from '@/lib/entry-types'

// The server action is replaced: these tests cover what the form renders.
vi.mock('@/app/actions', () => ({ createEntry: vi.fn() }))

afterEach(cleanup)

const MEETING_FIELDS = ['Attendees', 'Decisions made', 'Action items']

function typeSelect() {
  return screen.getByLabelText('Type') as HTMLSelectElement
}

describe('EntryForm', () => {
  test('shows date, hours, type, details and an optional link', () => {
    render(<EntryForm />)

    expect((screen.getByLabelText('Date') as HTMLInputElement).type).toBe('date')
    expect((screen.getByLabelText('Hours') as HTMLInputElement).type).toBe(
      'number',
    )
    expect(typeSelect().tagName).toBe('SELECT')
    expect(screen.getByLabelText('Details').tagName).toBe('TEXTAREA')

    const link = screen.getByLabelText('Link (optional)') as HTMLInputElement
    expect(link.required).toBe(false)
  })

  test('marks date, hours, type and details as required', () => {
    render(<EntryForm />)

    for (const label of ['Date', 'Hours', 'Type', 'Details']) {
      const field = screen.getByLabelText(label) as HTMLInputElement
      expect(field.required).toBe(true)
    }
  })

  test('offers the eleven entry types, in PRD order', () => {
    render(<EntryForm />)

    const options = Array.from(typeSelect().options).filter(
      (option) => option.value !== '',
    )

    expect(options.map((option) => option.value)).toEqual(
      Object.keys(ENTRY_TYPE_LABELS),
    )
    expect(options.map((option) => option.textContent)).toEqual(
      Object.values(ENTRY_TYPE_LABELS),
    )
  })

  test('hides the meeting fields for a work entry', () => {
    render(<EntryForm />)

    fireEvent.change(typeSelect(), { target: { value: 'work' } })

    for (const label of MEETING_FIELDS) {
      expect(screen.queryByLabelText(label)).toBeNull()
    }
  })

  test('shows attendees, decisions made and action items for a meeting', () => {
    render(<EntryForm />)

    fireEvent.change(typeSelect(), { target: { value: 'meeting' } })

    for (const label of MEETING_FIELDS) {
      expect(screen.queryByLabelText(label)).not.toBeNull()
    }
  })

  test('hides the meeting fields again when the type changes back', () => {
    render(<EntryForm />)

    fireEvent.change(typeSelect(), { target: { value: 'retrospective' } })
    fireEvent.change(typeSelect(), { target: { value: 'async_update' } })

    for (const label of MEETING_FIELDS) {
      expect(screen.queryByLabelText(label)).toBeNull()
    }
  })

  test('has a button to save the entry', () => {
    render(<EntryForm />)

    const button = screen.getByRole('button', { name: 'Add entry' })
    expect((button as HTMLButtonElement).type).toBe('submit')
  })
})
