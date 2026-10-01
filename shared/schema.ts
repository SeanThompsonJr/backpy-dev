// Schemas for every file in docs/LESSON_FORMAT.md. Shared by the site and the validator:
// if the format changes, change LESSON_FORMAT.md first, then this file.
import { z } from 'zod'

const nonEmpty = z.string().trim().min(1)
const conceptId = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'concept ids are kebab-case, e.g. mutable-default-argument')

export const frontMatterSchema = z.strictObject({
  id: z.number().int().min(0),
  title: nonEmpty,
  section: nonEmpty,
  sources: z.array(nonEmpty),
  concepts_introduced: z.array(conceptId),
  concepts_used: z.array(conceptId),
  explain_back: nonEmpty,
  unverified_claims: z.array(nonEmpty),
})
export type FrontMatter = z.infer<typeof frontMatterSchema>

/** The five H2 sections every lesson.md has, in this order. */
export const LESSON_SECTIONS = ['Why this matters', 'The concept', 'Worked example', 'What breaks', 'Check yourself'] as const

const pythonMeta = {
  title: nonEmpty,
  runtime: z.literal('pyodide'),
  packages: z.array(nonEmpty),
  timeout_seconds: z.number().positive().max(60),
}

export const metaSchema = z.discriminatedUnion('type', [
  z.strictObject({ type: z.literal('code'), ...pythonMeta }),
  z.strictObject({ type: z.literal('bug_hunt'), ...pythonMeta, bug_description: nonEmpty }),
  z.strictObject({
    type: z.literal('sql'),
    title: nonEmpty,
    runtime: z.literal('pglite'),
    timeout_seconds: z.number().positive().max(60),
  }),
  z.strictObject({
    type: z.literal('local'),
    title: nonEmpty,
    runtime: z.literal('local'),
    checklist: z.array(nonEmpty).min(1),
  }),
])
export type ExerciseMeta = z.infer<typeof metaSchema>
export type ExerciseType = ExerciseMeta['type']

export const hintsSchema = z.strictObject({
  hints: z.tuple([nonEmpty, nonEmpty]),
  solution_explanation: nonEmpty,
})
export type Hints = z.infer<typeof hintsSchema>

export const quizQuestionSchema = z
  .strictObject({
    q: nonEmpty,
    options: z.array(nonEmpty).min(2),
    answer: z.number().int().min(0),
    explanations: z.array(nonEmpty),
  })
  .refine((q) => q.answer < q.options.length, { message: 'answer is not a valid option index', path: ['answer'] })
  .refine((q) => q.explanations.length === q.options.length, {
    message: 'every option needs exactly one explanation',
    path: ['explanations'],
  })

export const quizSchema = z.strictObject({
  questions: z.array(quizQuestionSchema).min(3).max(6),
})
export type Quiz = z.infer<typeof quizSchema>
export type QuizQuestion = Quiz['questions'][number]

export const sqlCheckSchema = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('same_columns'), message: nonEmpty }),
  z.strictObject({ kind: z.literal('row_count'), message: nonEmpty }),
  z.strictObject({ kind: z.literal('same_rows'), ordered: z.boolean(), message: nonEmpty }),
])
export const sqlTestsSchema = z.strictObject({ checks: z.array(sqlCheckSchema).min(1) })
export type SqlCheck = z.infer<typeof sqlCheckSchema>
export type SqlTests = z.infer<typeof sqlTestsSchema>

/** Required files per exercise type (LESSON_FORMAT.md, "Files per exercise type"). */
export const EXERCISE_FILES: Record<ExerciseType, readonly string[]> = {
  code: ['meta.json', 'starter.py', 'tests.py', 'solution.py', 'hints.json'],
  bug_hunt: ['meta.json', 'starter.py', 'tests.py', 'solution.py', 'hints.json'],
  sql: ['meta.json', 'seed.sql', 'starter.sql', 'solution.sql', 'tests.json', 'hints.json'],
  local: ['meta.json', 'instructions.md'],
}
