// Progress lives in localStorage (BUILD_PLAN.md, milestone 8), with JSON export and import.
// Reads are checked against the schema; data that can't be read is kept under a backup key,
// never thrown away. Writes are batched so typing in the editor doesn't write on every key.
import { useSyncExternalStore } from 'react'
import { NEW_PROGRESS } from '../components/learning'
import {
  emptyLesson,
  emptyProgress,
  progressFileSchema,
  type LessonProgress,
  type ProgressFile,
  type StoredExercise,
} from './schema'

export const STORAGE_KEY = 'backpy.progress'
const WRITE_DELAY_MS = 300

export type ImportResult = { ok: true; data: ProgressFile } | { ok: false; error: string }

/** Checks an exported file. The error says what's wrong in plain words. */
export function parseProgressFile(text: string): ImportResult {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    return { ok: false, error: "That file isn't valid JSON, so it can't be a backpy progress export." }
  }
  if (!data || typeof data !== 'object' || (data as { app?: unknown }).app !== 'backpy') {
    return { ok: false, error: "That file isn't a backpy progress export." }
  }
  if ((data as { version?: unknown }).version !== 1) {
    return { ok: false, error: 'That export comes from a different version of backpy, so it can\'t be imported here.' }
  }
  const parsed = progressFileSchema.safeParse(data)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return { ok: false, error: `That export is damaged (${first.path.join('.') || 'file'}: ${first.message}).` }
  }
  return { ok: true, data: parsed.data }
}

export class ProgressStore {
  private state: ProgressFile
  private listeners = new Set<() => void>()
  private timer: ReturnType<typeof setTimeout> | undefined
  /** True while a change hasn't been written yet */
  private dirty = false

  constructor(private storage: Storage | undefined = safeLocalStorage()) {
    this.state = this.read()
  }

  private read(): ProgressFile {
    let raw: string | null = null
    try {
      raw = this.storage?.getItem(STORAGE_KEY) ?? null
    } catch {
      return emptyProgress()
    }
    if (raw === null) return emptyProgress()
    const parsed = parseProgressFile(raw)
    if (parsed.ok) return parsed.data
    // Keep what was there, so nothing is lost, and start fresh.
    try {
      this.storage?.setItem(`${STORAGE_KEY}.unreadable-${Date.now()}`, raw)
    } catch {
      // Storage is full or blocked; starting fresh is all that's left.
    }
    return emptyProgress()
  }

  get = () => this.state

  subscribe = (listener: () => void) => {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  private set(next: ProgressFile) {
    this.state = next
    this.dirty = true
    this.listeners.forEach((l) => l())
    clearTimeout(this.timer)
    this.timer = setTimeout(() => this.flush(), WRITE_DELAY_MS)
  }

  /**
   * Writes any pending change now (also called when the page is hidden or closed). With nothing
   * pending it writes nothing, so storage cleared elsewhere isn't refilled from memory.
   */
  flush = () => {
    clearTimeout(this.timer)
    this.timer = undefined
    if (!this.dirty) return
    this.dirty = false
    try {
      this.storage?.setItem(STORAGE_KEY, JSON.stringify(this.state))
    } catch {
      // Storage is full or blocked. Progress stays in memory for this visit.
    }
  }

  lesson(key: string): LessonProgress | undefined {
    return this.state.lessons[key]
  }

  updateLesson(key: string, change: (lesson: LessonProgress) => LessonProgress) {
    const current = this.state.lessons[key] ?? emptyLesson()
    const changed = { ...change(current), updatedAt: new Date().toISOString() }
    this.set({ ...this.state, lessons: { ...this.state.lessons, [key]: changed } })
  }

  updateExercise(key: string, folder: string, change: (exercise: StoredExercise) => StoredExercise) {
    this.updateLesson(key, (lesson) => ({
      ...lesson,
      exercises: { ...lesson.exercises, [folder]: change(lesson.exercises[folder] ?? { ...NEW_PROGRESS }) },
    }))
  }

  export(): string {
    this.flush()

    return JSON.stringify({ ...this.state, exportedAt: new Date().toISOString() }, null, 2)
  }

  replace(data: ProgressFile) {
    this.set({ app: 'backpy', version: 1, lessons: data.lessons })
    this.flush()
  }
}

function safeLocalStorage(): Storage | undefined {
  try {
    return typeof localStorage === 'undefined' ? undefined : localStorage
  } catch {
    return undefined
  }
}

export const progress = new ProgressStore()

if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', progress.flush)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') progress.flush()
  })
}

export const useProgress = () => useSyncExternalStore(progress.subscribe, progress.get)
