// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { loadLessons } from '../../shared/content'
import { readContentFiles } from '../../scripts/lib/read-content'
import { LessonView } from '../../src/components/LessonView'

const fixture = loadLessons(readContentFiles()).entries.find((e) => e.sectionDir === '_fixtures')!

function renderLesson(entry: typeof fixture) {
  const router = createMemoryRouter([{ path: '/', element: <LessonView entry={entry} /> }])
  return render(<RouterProvider router={router} />)
}

afterEach(cleanup)

describe('LessonView', () => {
  it('uses a single centred column when a lesson has no exercises', () => {
    const noExercises = { ...fixture, lesson: { ...fixture.lesson, exercises: [] } }
    renderLesson(noExercises)
    expect(screen.getByTestId('lesson-page').className).toContain('lesson-page-single')
    expect(screen.queryByRole('region', { name: 'Exercises' })).toBeNull()
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(fixture.lesson.frontMatter.title)
  })

  it('renders the five lesson sections as headings', () => {
    const noExercises = { ...fixture, lesson: { ...fixture.lesson, exercises: [] } }
    renderLesson(noExercises)
    const h2s = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)
    expect(h2s).toEqual(['Why this matters', 'The concept', 'Worked example', 'What breaks', 'Check yourself'])
  })

  it('hides the verify-this note when there are no unverified claims', () => {
    const verified = { ...fixture, lesson: { ...fixture.lesson, exercises: [], claims: [] } }
    renderLesson(verified)
    expect(screen.queryByRole('complementary', { name: 'Claims to verify' })).toBeNull()
    expect(document.querySelector('mark.claim')).toBeNull()
  })

  it('underlines the exact claim in place, even across formatting, and lists what to check', () => {
    const noExercises = { ...fixture, lesson: { ...fixture.lesson, exercises: [] } }
    renderLesson(noExercises)
    const marks = document.querySelectorAll('mark.claim')
    expect([...marks].map((m) => m.textContent).join('')).toBe('Postgres evaluates a column default for every inserted row')
    expect(marks[0].id).toBe('claim-0')
    const note = screen.getByRole('complementary', { name: 'Claims to verify' })
    expect(note.textContent).toContain('What to check: PostgreSQL documentation, CREATE TABLE')
    expect(note.textContent).toContain('in The concept')
  })

  it('marks a quote that spans bold and inline code', () => {
    const lesson = {
      ...fixture.lesson,
      exercises: [],
      claims: [{ quote: 'Python creates the default once, when def runs, not each', check: 'x', section: 'The concept' }],
    }
    renderLesson({ ...fixture, lesson })
    const marks = [...document.querySelectorAll('mark.claim')]
    expect(marks.length).toBeGreaterThan(1)
    expect(marks.map((m) => m.textContent).join('')).toBe('Python creates the default once, when def runs, not each')
  })
})
