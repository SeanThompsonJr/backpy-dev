import { afterEach, describe, expect, it, vi } from 'vitest'
import { loadLessons } from '../../shared/content'
import { readContentFiles } from '../../scripts/lib/read-content'
import { lessonCompletion } from '../../src/progress/completion'
import { parseProgressFile, ProgressStore, STORAGE_KEY } from '../../src/progress/store'
import type { LessonProgress } from '../../src/progress/schema'

/** A minimal localStorage stand-in. */
class MemoryStorage implements Storage {
  data = new Map<string, string>()
  get length() {
    return this.data.size
  }
  clear() {
    this.data.clear()
  }
  getItem(key: string) {
    return this.data.get(key) ?? null
  }
  key(i: number) {
    return [...this.data.keys()][i] ?? null
  }
  removeItem(key: string) {
    this.data.delete(key)
  }
  setItem(key: string, value: string) {
    this.data.set(key, value)
  }
}

afterEach(() => vi.useRealTimers())

describe('progress store', () => {
  it('round-trips through export and import', () => {
    const store = new ProgressStore(new MemoryStorage())
    store.updateExercise('13', '01-make-a-team', (e) => ({ ...e, code: 'print(1)', failedSubmits: 2 }))
    store.updateLesson('13', (l) => ({ ...l, explainBack: 'Created once, when def runs.', completedAt: '2026-10-03T00:00:00Z' }))

    const exported = store.export()
    const parsed = parseProgressFile(exported)
    expect(parsed.ok).toBe(true)

    const other = new ProgressStore(new MemoryStorage())
    if (parsed.ok) other.replace(parsed.data)
    expect(other.lesson('13')).toEqual(store.lesson('13'))
    expect(JSON.parse(exported).exportedAt).toEqual(expect.any(String))
  })

  it('rejects files that are not backpy progress, saying why', () => {
    expect(parseProgressFile('not json')).toEqual({ ok: false, error: expect.stringContaining("isn't valid JSON") })
    expect(parseProgressFile('{"app": "other"}')).toEqual({ ok: false, error: "That file isn't a backpy progress export." })
    expect(parseProgressFile('{"app": "backpy", "version": 2, "lessons": {}}')).toEqual({
      ok: false,
      error: expect.stringContaining('different version of backpy'),
    })
    const damaged = parseProgressFile('{"app": "backpy", "version": 1, "lessons": {"13": {"exercises": {}, "updatedAt": 5}}}')
    expect(damaged).toEqual({ ok: false, error: expect.stringContaining('lessons.13.updatedAt') })
  })

  it('keeps unreadable saved data under a backup key and starts fresh', () => {
    const storage = new MemoryStorage()
    storage.setItem(STORAGE_KEY, '{ broken')
    const store = new ProgressStore(storage)
    expect(store.get().lessons).toEqual({})
    const backup = [...storage.data.keys()].find((k) => k.startsWith(`${STORAGE_KEY}.unreadable-`))
    expect(backup && storage.getItem(backup)).toBe('{ broken')
  })

  it('batches writes, so typing does not write on every key, and flush writes at once', () => {
    vi.useFakeTimers()
    const storage = new MemoryStorage()
    const store = new ProgressStore(storage)
    store.updateExercise('13', 'ex', (e) => ({ ...e, code: 'a' }))
    store.updateExercise('13', 'ex', (e) => ({ ...e, code: 'ab' }))
    expect(storage.getItem(STORAGE_KEY)).toBeNull()
    vi.advanceTimersByTime(300)
    expect(JSON.parse(storage.getItem(STORAGE_KEY)!).lessons['13'].exercises.ex.code).toBe('ab')

    store.updateExercise('13', 'ex', (e) => ({ ...e, code: 'abc' }))
    store.flush()
    expect(JSON.parse(storage.getItem(STORAGE_KEY)!).lessons['13'].exercises.ex.code).toBe('abc')
  })

  it('with nothing pending, leaving the page writes nothing, so cleared storage stays cleared', () => {
    const storage = new MemoryStorage()
    const store = new ProgressStore(storage)
    store.updateLesson('5', (l) => ({ ...l, explainBack: 'saved' }))
    store.flush()
    storage.clear()
    store.flush()
    expect(storage.getItem(STORAGE_KEY)).toBeNull()
  })

  it('reads back what an earlier visit saved', () => {
    const storage = new MemoryStorage()
    const first = new ProgressStore(storage)
    first.updateLesson('5', (l) => ({ ...l, explainBack: 'saved' }))
    first.flush()
    expect(new ProgressStore(storage).lesson('5')?.explainBack).toBe('saved')
  })
})

describe('lesson completion', () => {
  const fixture = loadLessons(readContentFiles()).entries.find((e) => e.sectionDir === '_fixtures')!.lesson
  const solvedAll: LessonProgress = {
    exercises: {
      '01-make-a-team': { failedSubmits: 0, solved: true, hintsShown: 0, solutionShown: false },
      '02-shared-team-bug': { failedSubmits: 1, solved: true, hintsShown: 1, solutionShown: false },
      '03-private-by-default': { failedSubmits: 0, solved: true, hintsShown: 0, solutionShown: false },
      '04-run-it-locally': { failedSubmits: 0, solved: false, hintsShown: 0, solutionShown: false, checklist: [true, true] },
    },
    quiz: { picks: [[1], [1], [2], [1]], finished: true },
    explainBack: 'Python makes it once; Postgres per row.',
    updatedAt: '2026-10-03T00:00:00Z',
  }

  it('is complete when every exercise, the quiz and the explain-back are done', () => {
    expect(lessonCompletion(fixture, solvedAll).done).toBe(true)
  })

  it('lists exactly what is left', () => {
    const partial: LessonProgress = {
      ...solvedAll,
      exercises: { ...solvedAll.exercises, '04-run-it-locally': { ...solvedAll.exercises['04-run-it-locally'], checklist: [true] } },
      explainBack: '   ',
    }
    const { done, parts } = lessonCompletion(fixture, partial)
    expect(done).toBe(false)
    expect(parts.filter((p) => !p.done).map((p) => p.label)).toEqual([
      'Exercise 4: Run the fix on your own machine',
      'Explain it back in your own words',
    ])
  })

  it('nothing saved means nothing done', () => {
    expect(lessonCompletion(fixture, undefined).parts.every((p) => !p.done)).toBe(true)
  })
})
