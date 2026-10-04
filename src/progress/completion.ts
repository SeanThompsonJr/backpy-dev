// When a lesson counts as done: every exercise solved (a local one: every checklist item ticked),
// the quiz finished, and the explain-back question answered.
import type { LoadedLesson } from '../../shared/lesson-parse'
import type { LessonProgress } from './schema'

export interface CompletionPart {
  label: string
  done: boolean
}

export function lessonCompletion(lesson: LoadedLesson, saved: LessonProgress | undefined): { done: boolean; parts: CompletionPart[] } {
  const parts: CompletionPart[] = lesson.exercises.map((ex, i) => {
    const stored = saved?.exercises[ex.folder]
    const done =
      ex.meta.type === 'local'
        ? ex.meta.checklist.every((_, item) => stored?.checklist?.[item] === true)
        : stored?.solved === true
    return { label: `Exercise ${i + 1}: ${ex.meta.title}`, done }
  })
  if (lesson.quiz) parts.push({ label: 'Finish the quiz', done: saved?.quiz?.finished === true })
  parts.push({ label: 'Explain it back in your own words', done: (saved?.explainBack ?? '').trim().length > 0 })
  return { done: parts.every((p) => p.done), parts }
}
