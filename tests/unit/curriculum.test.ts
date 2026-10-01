import { describe, expect, it } from 'vitest'
import raw from '../../curriculum/curriculum.json'
import { buildCurriculum, slugify, type RawCurriculum } from '../../shared/curriculum'

const plan = raw as RawCurriculum
const clone = () => structuredClone(plan)

describe('curriculum model', () => {
  const c = buildCurriculum(plan)

  it('has 124 lessons with ids 1..124 in plan order', () => {
    expect(c.lessonCount).toBe(124)
    expect(c.lessons.map((l) => l.id)).toEqual(Array.from({ length: 124 }, (_, i) => i + 1))
  })

  it('has 4 tiers and 27 sections numbered across the whole plan', () => {
    expect(c.tiers.map((t) => t.name)).toEqual(['Foundations', 'Core Backend', 'Production', 'Professional'])
    expect(c.sections).toHaveLength(27)
    expect(c.sections.map((s) => s.number)).toEqual(Array.from({ length: 27 }, (_, i) => i + 1))
  })

  it('derives the folder names LESSON_FORMAT.md expects', () => {
    expect(c.sections[0].dir).toBe('tier-1/01-orientation')
    expect(c.sectionBySlug.get('05-sql-postgresql')?.name).toBe('SQL & PostgreSQL')
    expect(c.sectionBySlug.get('20-async-performance-caching')?.tierNumber).toBe(3)
    expect(c.lessonById.get(15)?.prefix).toBe('015')
  })

  it('keeps optional flags and coverage from the plan', () => {
    expect(c.lessons.filter((l) => l.optional).map((l) => l.id)).toEqual([75, 105])
    const counts = { sources: 0, partial: 0, claude: 0 }
    for (const l of c.lessons) counts[l.coverage]++
    expect(counts.sources + counts.partial + counts.claude).toBe(124)
  })

  it('slugifies accents and punctuation', () => {
    expect(slugify('Async, Performance & Caching')).toBe('async-performance-caching')
    expect(slugify('Pokémon')).toBe('pokemon')
  })

  it('rejects ids out of order', () => {
    const bad = clone()
    bad.tiers[0].sections[0].lessons[1].id = 7
    expect(() => buildCurriculum(bad)).toThrow(/expected 2/)
  })

  it('rejects a wrong lesson_count and unknown coverage', () => {
    const bad = clone()
    bad.lesson_count = 120
    ;(bad.tiers[0].sections[0].lessons[0] as { coverage: string }).coverage = 'maybe'
    expect(() => buildCurriculum(bad)).toThrow(/unknown coverage "maybe"[\s\S]*lesson_count is 120/)
  })
})
