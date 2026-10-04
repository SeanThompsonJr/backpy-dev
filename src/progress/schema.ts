// The shape of saved progress, used to check both localStorage and imported files.
import { z } from 'zod'

export const exerciseProgressSchema = z.object({
  failedSubmits: z.number().int().min(0),
  solved: z.boolean(),
  hintsShown: z.number().int().min(0).max(2),
  solutionShown: z.boolean(),
  /** The latest code in the editor */
  code: z.string().optional(),
  /** Ticked items of a local exercise's checklist */
  checklist: z.array(z.boolean()).optional(),
})

export const lessonProgressSchema = z.object({
  exercises: z.record(z.string(), exerciseProgressSchema),
  quiz: z.object({ picks: z.array(z.array(z.number().int().min(0))), finished: z.boolean() }).optional(),
  explainBack: z.string().optional(),
  /** When the lesson was first completed (ISO time). Completion sticks once earned. */
  completedAt: z.string().optional(),
  updatedAt: z.string(),
})

export const progressFileSchema = z.object({
  app: z.literal('backpy'),
  version: z.literal(1),
  exportedAt: z.string().optional(),
  /** Keyed by lesson id ("13"); "0" is the dev-only fixture lesson */
  lessons: z.record(z.string(), lessonProgressSchema),
})

export type StoredExercise = z.infer<typeof exerciseProgressSchema>
export type LessonProgress = z.infer<typeof lessonProgressSchema>
export type ProgressFile = z.infer<typeof progressFileSchema>

export const emptyProgress = (): ProgressFile => ({ app: 'backpy', version: 1, lessons: {} })
export const emptyLesson = (): LessonProgress => ({ exercises: {}, updatedAt: new Date().toISOString() })
