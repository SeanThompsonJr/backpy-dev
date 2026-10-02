import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { beforeAll, describe, expect, it } from 'vitest'
import { loadNodePython, type NodePython } from '../../scripts/lib/pyodide-node'
import { gradeTestRun, humanizeTestName } from '../../shared/grade'
import { afterSubmit, hintUnlocked, newlyUnlocked, NEW_PROGRESS, solutionUnlocked } from '../../src/components/learning'

let python: NodePython
beforeAll(async () => {
  python = await loadNodePython()
}, 120_000)

const read = (exercise: string, file: string) => readFileSync(join('content/_fixtures/000-fixture/exercises', exercise, file), 'utf8')
const grade = (exercise: string, version: 'starter' | 'solution', code = read(exercise, `${version}.py`)) =>
  gradeTestRun(python.backpy.runTests(code, read(exercise, 'tests.py')))

describe('grading a submit', () => {
  it('a bug hunt starter fails, and the first failure is its concept message', () => {
    const g = grade('02-shared-team-bug', 'starter')
    expect(g.passed).toBe(false)
    expect(g.checks).toEqual([
      { name: 'test_each_new_team_starts_empty', label: 'Each new team starts empty', passed: false },
      { name: 'test_passing_a_team_still_adds_to_it', label: 'Passing a team still adds to it', passed: true },
    ])
    expect(g.failedCount).toBe(1)
    expect(g.firstFailure).toEqual({
      label: 'Each new team starts empty',
      kind: 'assertion',
      message: 'The second new team already had a member. When is a default value created: when def runs, or on each call?',
      traceback: undefined,
    })
  })

  it('solutions pass every check', () => {
    expect(grade('01-make-a-team', 'solution').passed).toBe(true)
    expect(grade('02-shared-team-bug', 'solution').passed).toBe(true)
  })

  it('an exception in the learner code is reported with its traceback', () => {
    const g = grade('01-make-a-team', 'starter')
    expect(g.passed).toBe(false)
    expect(g.failedCount).toBe(5)
    expect(g.firstFailure?.kind).toBe('exception')
    expect(g.firstFailure?.message).toMatch(/^TypeError: /)
    expect(g.firstFailure?.traceback).toContain('File "tests.py"')
  })

  it('code that cannot load means no checks ran', () => {
    const g = grade('02-shared-team-bug', 'starter', 'def add_member(name, team=[]:\n    pass\n')
    expect(g.passed).toBe(false)
    expect(g.checks).toEqual([])
    expect(g.loadError).toContain('SyntaxError')
  })

  it('test names read as sentences', () => {
    expect(humanizeTestName('test_new_teams_get_their_own_roster')).toBe('New teams get their own roster')
    expect(humanizeTestName('test__double__underscores')).toBe('Double underscores')
  })
})

describe('the learning loop', () => {
  it('unlocks hint 1 after one failed submit, then hint 2 and the solution after two', () => {
    const once = afterSubmit(NEW_PROGRESS, false)
    expect([hintUnlocked(once, 1), hintUnlocked(once, 2), solutionUnlocked(once)]).toEqual([true, false, false])
    expect(newlyUnlocked(NEW_PROGRESS, once)).toBe('Hint 1 is unlocked.')

    const twice = afterSubmit(once, false)
    expect([hintUnlocked(twice, 2), solutionUnlocked(twice)]).toEqual([true, true])
    expect(newlyUnlocked(once, twice)).toBe('Hint 2 and the solution are unlocked.')
    expect(newlyUnlocked(twice, afterSubmit(twice, false))).toBeUndefined()
  })

  it('a pass marks the exercise solved without counting as a failure, and opens the solution', () => {
    const solved = afterSubmit(NEW_PROGRESS, true)
    expect(solved).toMatchObject({ solved: true, failedSubmits: 0 })
    expect(hintUnlocked(solved, 1)).toBe(false)
    expect(solutionUnlocked(solved)).toBe(true)
  })
})
