// Runs SQL in PGlite and grades SQL exercises. Shared by the browser worker and the Node
// validator, so both judge a query the same way (LESSON_FORMAT.md, "tests.json").
import type { PGliteInterface } from '@electric-sql/pglite'
import type { Grade } from './grade'
import type { SqlCheck } from './schema'

export interface SqlResult {
  /** How many statements ran */
  statementCount: number
  /** Column names of the last statement's result (empty if it returned no rows, e.g. an INSERT) */
  columns: string[]
  rows: unknown[][]
  /** Rows the last statement inserted, updated or deleted */
  affectedRows: number
}

export interface SqlError {
  message: string
  /** Line of the script the error points at, when Postgres says */
  line?: number
  hint?: string
  /** The exercise's seed.sql failed: a content bug, not Sean's */
  inSeed?: boolean
}

export type SqlOutcome = { ok: true; result: SqlResult } | { ok: false; error: SqlError }

function toSqlError(error: unknown, script: string): SqlError {
  const e = error as { message?: string; position?: string; hint?: string }
  const position = Number(e.position)
  const line = position > 0 ? script.slice(0, position - 1).split('\n').length : undefined
  return { message: e.message ?? String(error), line, hint: e.hint }
}

/**
 * Runs a script on a fresh copy of `base` loaded with `seed`, so every run starts from the same
 * data. `base` is an empty database made once; cloning it is much faster than starting PGlite.
 */
export async function runSql(base: PGliteInterface, seed: string, script: string): Promise<SqlOutcome> {
  const db = await base.clone()
  try {
    if (seed.trim()) {
      try {
        await db.exec(seed)
      } catch (error) {
        return { ok: false, error: { ...toSqlError(error, seed), inSeed: true } }
      }
    }
    try {
      const results = await db.exec(script, { rowMode: 'array' })
      const last = results.at(-1)
      return {
        ok: true,
        result: {
          statementCount: results.length,
          columns: last?.fields.map((f: { name: string }) => f.name) ?? [],
          rows: (last?.rows ?? []) as unknown[][],
          affectedRows: last?.affectedRows ?? 0,
        },
      }
    } catch (error) {
      return { ok: false, error: toSqlError(error, script) }
    }
  } finally {
    await db.close()
  }
}

/** A value as comparable text, so 3 and 3n, or two equal timestamps, compare equal. */
export function normalizeValue(value: unknown): string {
  if (value === null || value === undefined) return 'NULL'
  if (value instanceof Date) return value.toISOString()
  if (typeof value === 'bigint') return value.toString()
  if (value instanceof Uint8Array) return [...value].map((b) => b.toString(16).padStart(2, '0')).join('')
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

const rowKey = (row: unknown[]) => JSON.stringify(row.map(normalizeValue))

const CHECK_LABELS: Record<SqlCheck['kind'], (check: SqlCheck) => string> = {
  same_columns: () => 'The result has the right columns',
  row_count: () => 'The result has the right number of rows',
  same_rows: (c) => (c.kind === 'same_rows' && c.ordered ? 'The rows match, in the right order' : 'The rows match'),
}

function checkPasses(check: SqlCheck, learner: SqlResult, expected: SqlResult): boolean {
  const sameColumns = learner.columns.join('\u0000') === expected.columns.join('\u0000')
  switch (check.kind) {
    case 'same_columns':
      return sameColumns
    case 'row_count':
      return learner.rows.length === expected.rows.length
    case 'same_rows': {
      if (!sameColumns || learner.rows.length !== expected.rows.length) return false
      const mine = learner.rows.map(rowKey)
      const theirs = expected.rows.map(rowKey)
      if (!check.ordered) {
        mine.sort()
        theirs.sort()
      }
      return mine.every((key, i) => key === theirs[i])
    }
  }
}

/**
 * Grades Sean's script against the solution's result, check by check (tests.json). The first
 * failing check's message is the concept hint, as with Python tests.
 */
export function gradeSql(learner: SqlOutcome, expected: SqlResult, checks: SqlCheck[]): Grade {
  if (!learner.ok) {
    const where = learner.error.line ? ` (line ${learner.error.line})` : ''
    return { passed: false, checks: [], failedCount: 0, loadError: `ERROR: ${learner.error.message}${where}`, output: '' }
  }
  const result = learner.result
  const graded = checks.map((check, i) => ({
    name: `${check.kind}-${i}`,
    label: CHECK_LABELS[check.kind](check),
    passed: checkPasses(check, result, expected),
  }))
  const failedCount = graded.filter((c) => !c.passed).length
  const firstFailed = checks.findIndex((_, i) => !graded[i].passed)
  let firstFailure: Grade['firstFailure']
  if (firstFailed >= 0) {
    firstFailure =
      result.columns.length === 0
        ? {
            label: graded[firstFailed].label,
            kind: 'error',
            message: "Your script's last statement didn't return any rows to check. End it with the SELECT that shows the result.",
          }
        : { label: graded[firstFailed].label, kind: 'assertion', message: checks[firstFailed].message }
  }
  return { passed: graded.length > 0 && failedCount === 0, checks: graded, failedCount, firstFailure, output: '' }
}
