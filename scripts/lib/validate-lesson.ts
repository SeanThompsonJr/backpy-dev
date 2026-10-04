// The checks GENERATION_PIPELINE.md lists ("What the validator checks"), for one lesson.
// Code runs on the same Pyodide and PGlite as the site; Python tests also run on real CPython.
import type { PGlite } from '@electric-sql/pglite'
import type { LessonEntry } from '../../shared/content'
import { gradeTestRun } from '../../shared/grade'
import type { Exercise } from '../../shared/lesson-parse'
import { gradeSql, runSql } from '../../shared/sql-runner'
import type { NodePython } from './pyodide-node'
import { runRealPytest } from './pytest-cpython'

export type Severity = 'error' | 'warning'

export interface Finding {
  severity: Severity
  /** Path relative to content/ */
  file: string
  message: string
}

export interface Conventions {
  banned: { pattern: string; reason: string }[]
}

export interface ValidationContext {
  python: NodePython
  /** An empty database to clone for every run */
  pg: PGlite
  conventions: Conventions
  /** Packages Pyodide ships, name -> version (pyodide-lock.json) */
  pyodidePackages: Map<string, string>
  /** Concepts taught before this lesson: concept id -> lesson id that introduced it */
  conceptsBefore: Map<string, number>
  /** Concepts recorded in concepts.json: id -> lesson that introduced it */
  registry: Map<string, number>
  /** Also run each solution's tests under real pytest in CPython (needs uv) */
  checkCpython: boolean
}

/** Time allowed to run a lesson's code blocks, in seconds. */
const BLOCKS_TIME_LIMIT = 10

const firstLine = (text = '') => text.trim().split('\n')[0]

export async function validateLesson(entry: LessonEntry, ctx: ValidationContext): Promise<Finding[]> {
  const findings: Finding[] = []
  const { lesson } = entry
  const dir = `${entry.sectionDir}/${lesson.folder}`
  const error = (file: string, message: string) => findings.push({ severity: 'error', file: `${dir}/${file}`, message })
  const warn = (file: string, message: string) =>
    findings.push({ severity: 'warning', file: `${dir}/${file}`, message })
  const fm = lesson.frontMatter

  checkWriting(lesson, error)
  checkConventions(lesson, ctx.conventions, error)
  checkConcepts(fm.id, fm.concepts_introduced, fm.concepts_used, ctx, error)

  const hasCode =
    lesson.blocks.some((b) => b.mode !== 'display') || lesson.exercises.some((e) => e.meta.type !== 'local')
  if (hasCode && lesson.quiz && !lesson.quiz.questions.some((q) => /predict the output/i.test(q.q))) {
    error('quiz.json', 'the lesson has code, so the quiz needs at least one "Predict the output" question')
  }

  checkPythonBlocks(lesson.blocks, ctx, error)
  await checkSqlBlocks(lesson.blocks, ctx, error)

  for (const exercise of lesson.exercises) {
    const file = (name: string) => `exercises/${exercise.folder}/${name}`
    if (exercise.meta.type === 'code' || exercise.meta.type === 'bug_hunt') {
      await checkPythonExercise(exercise, ctx, file, error)
    } else if (exercise.meta.type === 'sql') {
      await checkSqlExercise(exercise, ctx, file, error, warn)
    }
  }
  return findings
}

/** No comparisons to Java (TEACHING_STYLE.md): checked in everything Sean reads. */
function checkWriting(lesson: LessonEntry['lesson'], error: (file: string, message: string) => void) {
  const java = /\bJava\b/
  if (java.test(lesson.body))
    error('lesson.md', 'mentions Java; teach the concept on its own terms (TEACHING_STYLE.md)')
  for (const ex of lesson.exercises) {
    const texts = [ex.instructions ?? '', ...(ex.hints?.hints ?? []), ex.hints?.solution_explanation ?? '']
    if (texts.some((t) => java.test(t))) {
      error(`exercises/${ex.folder}`, 'mentions Java in the instructions or hints (TEACHING_STYLE.md)')
    }
  }
  const quizText = lesson.quiz?.questions.flatMap((q) => [q.q, ...q.options, ...q.explanations]) ?? []
  if (quizText.some((t) => java.test(t))) error('quiz.json', 'mentions Java (TEACHING_STYLE.md)')
}

/** Banned imports and patterns from conventions.json, anywhere in the lesson's code. */
function checkConventions(
  lesson: LessonEntry['lesson'],
  conventions: Conventions,
  error: (file: string, message: string) => void,
) {
  const sources: [string, string][] = [['lesson.md', lesson.blocks.map((b) => b.code).join('\n')]]
  for (const ex of lesson.exercises) {
    for (const [name, text] of [
      ['starter', ex.starter],
      ['solution', ex.solution],
      ['tests.py', ex.tests],
    ] as const) {
      if (text) sources.push([`exercises/${ex.folder}/${name}`, text])
    }
  }
  for (const [file, text] of sources) {
    for (const { pattern, reason } of conventions.banned) {
      if (text.includes(pattern)) error(file, `uses "${pattern}", which conventions.json bans: ${reason}`)
    }
  }
}

/** Every concept used must be taught in an earlier lesson or this one (GENERATION_PIPELINE.md). */
function checkConcepts(
  id: number,
  introduced: string[],
  used: string[],
  ctx: ValidationContext,
  error: (file: string, message: string) => void,
) {
  for (const concept of introduced) {
    const where = ctx.registry.get(concept)
    if (where !== undefined && where !== id) {
      error('lesson.md', `introduces "${concept}", but concepts.json says lesson ${where} already introduced it`)
    }
  }
  for (const concept of used) {
    if (!introduced.includes(concept) && !ctx.conceptsBefore.has(concept)) {
      error('lesson.md', `uses "${concept}" before any lesson teaches it (not introduced here or in an earlier lesson)`)
    }
  }
}

/** `python run` blocks must run; `python broken X` blocks must raise exactly X. */
function checkPythonBlocks(
  blocks: LessonEntry['lesson']['blocks'],
  ctx: ValidationContext,
  error: (file: string, message: string) => void,
) {
  const python = blocks.filter((b) => b.lang === 'python' && b.mode !== 'display')
  if (python.length === 0) return
  const results = ctx.python.withTimeLimit(BLOCKS_TIME_LIMIT, () =>
    ctx.python.backpy.runBlocks(python.map((b) => ({ mode: b.mode as 'run' | 'broken', code: b.code }))),
  )
  ctx.python.takeOutput()
  if (results === 'timeout') {
    error('lesson.md', `the python blocks didn't finish within ${BLOCKS_TIME_LIMIT} seconds`)
    return
  }
  python.forEach((block, i) => {
    const result = results[i]
    const where = `lesson.md`
    if (block.mode === 'run' && result.raised) {
      error(where, `python run block at line ${block.line} raised ${result.raised}: ${firstLine(result.message)}`)
    }
    if (block.mode === 'broken') {
      if (!result.raised)
        error(
          where,
          `python broken block at line ${block.line} runs without an error; it must raise ${block.expectedError}`,
        )
      else if (result.raised !== block.expectedError) {
        error(where, `python broken block at line ${block.line} raises ${result.raised}, not ${block.expectedError}`)
      }
    }
  })
}

/** `sql run` blocks run in order on one fresh database per lesson, and must all succeed. */
async function checkSqlBlocks(
  blocks: LessonEntry['lesson']['blocks'],
  ctx: ValidationContext,
  error: (file: string, message: string) => void,
) {
  const sql = blocks.filter((b) => b.lang === 'sql' && b.mode === 'run')
  if (sql.length === 0) return
  const db = await ctx.pg.clone()
  try {
    for (const block of sql) {
      try {
        await db.exec(block.code)
      } catch (e) {
        error('lesson.md', `sql run block at line ${block.line} failed: ${(e as Error).message}`)
      }
    }
  } finally {
    await db.close()
  }
}

async function checkPythonExercise(
  ex: Exercise,
  ctx: ValidationContext,
  file: (name: string) => string,
  error: (file: string, message: string) => void,
) {
  if (ex.meta.type !== 'code' && ex.meta.type !== 'bug_hunt') return
  const { packages, timeout_seconds: limit } = ex.meta
  const missing = packages.filter((p) => !ctx.pyodidePackages.has(p))
  for (const p of missing)
    error(file('meta.json'), `package "${p}" isn't available in Pyodide, so it can't run in the browser`)
  if (missing.length) return
  await ctx.python.backpy.loadPackages(packages)

  const tests = ex.tests ?? ''
  const silent = ctx.python.backpy.assertsWithoutMessage(tests)
  for (const line of silent) {
    error(file('tests.py'), `the assert on line ${line} has no message; the message is the hint Sean sees`)
  }

  const starterRun = ctx.python.withTimeLimit(limit, () => ctx.python.backpy.runTests(ex.starter ?? '', tests))
  const solutionRun = ctx.python.withTimeLimit(limit, () => ctx.python.backpy.runTests(ex.solution ?? '', tests))
  ctx.python.takeOutput()

  if (starterRun === 'timeout') {
    error(
      file('starter.py'),
      `the starter's tests didn't finish within ${limit} seconds; Sean's first submit would time out`,
    )
  } else {
    const grade = gradeTestRun(starterRun)
    if (grade.passed)
      error(file('starter.py'), 'the starter passes every test; it must fail until Sean does the exercise')
  }

  if (solutionRun === 'timeout') {
    error(file('solution.py'), `the solution's tests didn't finish within ${limit} seconds`)
    return
  }
  const solutionGrade = gradeTestRun(solutionRun)
  if (solutionRun.collection_error) {
    error(
      file('solution.py'),
      `the tests can't load with the solution: ${firstLine(solutionRun.collection_error.split('\n').at(-2))}`,
    )
  } else if (solutionRun.tests.length === 0) {
    error(file('tests.py'), 'has no test_ functions')
  } else if (!solutionGrade.passed) {
    for (const t of solutionRun.tests.filter((t) => t.outcome !== 'passed')) {
      error(file('solution.py'), `fails ${t.name} in Pyodide: ${firstLine(t.message ?? '')}`)
    }
  }

  if (ctx.checkCpython && solutionGrade.passed) {
    const versions = Object.fromEntries(packages.map((p) => [p, ctx.pyodidePackages.get(p)!]))
    const real = runRealPytest(ex.solution ?? '', tests, versions)
    if (real.tests.size === 0) error(file('tests.py'), `real pytest collected no tests:\n${real.output.trim()}`)
    for (const [name, result] of real.tests) {
      if (result.outcome !== 'passed')
        error(file('solution.py'), `fails ${name} under real pytest in CPython: ${firstLine(result.message)}`)
    }
  }
}

async function checkSqlExercise(
  ex: Exercise,
  ctx: ValidationContext,
  file: (name: string) => string,
  error: (file: string, message: string) => void,
  warn: (file: string, message: string) => void,
) {
  const seed = ex.seed ?? ''
  const solution = await runSql(ctx.pg, seed, ex.solution ?? '')
  if (!solution.ok) {
    error(file(solution.error.inSeed ? 'seed.sql' : 'solution.sql'), `fails: ${solution.error.message}`)
    return
  }
  if (solution.result.columns.length === 0) {
    error(file('solution.sql'), "the last statement returns no rows, so there's nothing to compare Sean's result with")
    return
  }
  const starter = await runSql(ctx.pg, seed, ex.starter ?? '')
  if (!starter.ok) warn(file('starter.sql'), `raises an error before any check runs: ${starter.error.message}`)
  const grade = gradeSql(starter, solution.result, ex.sqlTests?.checks ?? [])
  if (grade.passed)
    error(file('starter.sql'), 'the starter passes every check; it must fail until Sean does the exercise')
}
