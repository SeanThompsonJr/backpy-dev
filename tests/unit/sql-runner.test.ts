// The SQL runner and grader, on the same PGlite the site uses, running in Node.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { PGlite } from '@electric-sql/pglite'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { gradeSql, normalizeValue, runSql, type SqlResult } from '../../shared/sql-runner'
import type { SqlCheck } from '../../shared/schema'

let base: PGlite
beforeAll(async () => {
  base = await PGlite.create()
}, 60_000)
afterAll(async () => {
  await base.close()
})

const read = (file: string) => readFileSync(join('content/_fixtures/000-fixture/exercises/03-private-by-default', file), 'utf8')
const seed = read('seed.sql')
const checks = (JSON.parse(read('tests.json')) as { checks: SqlCheck[] }).checks

async function result(script: string, seedSql = seed): Promise<SqlResult> {
  const outcome = await runSql(base, seedSql, script)
  if (!outcome.ok) throw new Error(outcome.error.message)
  return outcome.result
}

describe('running SQL', () => {
  it('runs a script on freshly seeded data and returns the last result', async () => {
    const r = await result(read('starter.sql'))
    expect(r.statementCount).toBe(3)
    expect(r.columns).toEqual(['id', 'name', 'is_public'])
    expect(r.rows).toEqual([
      [1, 'Rain Dance', null],
      [2, 'Sun Room', null],
      [3, 'Trick Room', null],
    ])
  })

  it('every run starts from the seed, untouched by earlier runs', async () => {
    await result("INSERT INTO teams (id, name) VALUES (9, 'Leftover');")
    const r = await result('SELECT count(*) AS teams FROM teams;')
    expect(r.rows).toEqual([[2]])
  })

  it('reports errors with the line they happened on', async () => {
    const outcome = await runSql(base, seed, 'SELECT 1;\nSELEC name FROM teams;')
    expect(outcome).toMatchObject({ ok: false, error: { message: 'syntax error at or near "SELEC"', line: 2 } })
  })

  it('flags a broken seed as a content problem, not the learner', async () => {
    const outcome = await runSql(base, 'CREATE TABLE broken (;', 'SELECT 1;')
    expect(outcome).toMatchObject({ ok: false, error: { inSeed: true } })
  })

  it('compares values by meaning, not by JavaScript type', () => {
    expect(normalizeValue(3n)).toBe(normalizeValue(3))
    expect(normalizeValue(new Date('2026-10-03T12:00:00Z'))).toBe('2026-10-03T12:00:00.000Z')
    expect(normalizeValue(null)).toBe('NULL')
    expect(normalizeValue('1.5')).toBe('1.5')
  })
})

describe('grading SQL exercises', () => {
  it('the fixture starter fails on the rows, with the concept message', async () => {
    const expected = await result(read('solution.sql'))
    const grade = gradeSql(await runSql(base, seed, read('starter.sql')), expected, checks)
    expect(grade.passed).toBe(false)
    expect(grade.checks.map((c) => [c.label, c.passed])).toEqual([
      ['The result has the right columns', true],
      ['The result has the right number of rows', true],
      ['The rows match, in the right order', false],
    ])
    expect(grade.firstFailure).toEqual({
      label: 'The rows match, in the right order',
      kind: 'assertion',
      message: checks[2].message,
    })
  })

  it('the fixture solution passes', async () => {
    const expected = await result(read('solution.sql'))
    expect(gradeSql(await runSql(base, seed, read('solution.sql')), expected, checks).passed).toBe(true)
  })

  it('compares rows in order or in any order, as each check says', async () => {
    const expected = await result('SELECT id, name FROM teams ORDER BY id;')
    const reversed = await runSql(base, seed, 'SELECT id, name FROM teams ORDER BY id DESC;')
    const anyOrder: SqlCheck = { kind: 'same_rows', ordered: false, message: 'rows' }
    const inOrder: SqlCheck = { kind: 'same_rows', ordered: true, message: 'order' }
    expect(gradeSql(reversed, expected, [anyOrder]).passed).toBe(true)
    expect(gradeSql(reversed, expected, [inOrder]).passed).toBe(false)
  })

  it('a script that ends without a SELECT gets a clear message', async () => {
    const expected = await result(read('solution.sql'))
    const grade = gradeSql(await runSql(base, seed, "INSERT INTO teams (id, name) VALUES (3, 'Trick Room');"), expected, checks)
    expect(grade.firstFailure).toMatchObject({ kind: 'error', message: expect.stringContaining("didn't return any rows") })
  })

  it('a SQL error means no checks ran', async () => {
    const expected = await result(read('solution.sql'))
    const grade = gradeSql(await runSql(base, seed, 'SELECT nope FROM teams;'), expected, checks)
    expect(grade).toMatchObject({ passed: false, checks: [], loadError: 'ERROR: column "nope" does not exist (line 1)' })
  })
})
