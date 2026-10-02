// Turns a test run into what Sean sees after Submit: a checklist of checks and the first
// failure to think about. Shared with the validator, which uses `passed` to confirm that
// starters fail and solutions pass.
import type { TestRun } from './pyodide-core'

export interface Check {
  name: string
  /** The test name as a sentence: test_each_new_team_starts_empty -> "Each new team starts empty" */
  label: string
  passed: boolean
}

export interface Failure {
  label: string
  /** assertion: the test's concept message; exception: the learner's code raised; error: the test couldn't run */
  kind: 'assertion' | 'exception' | 'error'
  message: string
  traceback?: string
}

export interface Grade {
  passed: boolean
  checks: Check[]
  failedCount: number
  /** The first failing check, which is the one to fix first */
  firstFailure?: Failure
  /** Set when the code couldn't even be loaded, so no checks ran */
  loadError?: string
  /** Anything printed while the code was loaded */
  output: string
}

export function humanizeTestName(name: string): string {
  const words = name.replace(/^test_?/, '').replace(/_+/g, ' ').trim()
  return words.charAt(0).toUpperCase() + words.slice(1)
}

export function gradeTestRun(run: TestRun): Grade {
  if (run.collection_error) {
    return { passed: false, checks: [], failedCount: 0, loadError: run.collection_error, output: run.output }
  }
  const checks = run.tests.map((t) => ({ name: t.name, label: humanizeTestName(t.name), passed: t.outcome === 'passed' }))
  const first = run.tests.find((t) => t.outcome !== 'passed')
  let firstFailure: Failure | undefined
  if (first) {
    const label = humanizeTestName(first.name)
    if (first.outcome === 'error') {
      firstFailure = { label, kind: 'error', message: first.message ?? 'This check could not run.' }
    } else if (first.kind === 'exception') {
      firstFailure = { label, kind: 'exception', message: first.message ?? 'Your code raised an error.', traceback: first.traceback }
    } else {
      firstFailure = {
        label,
        kind: 'assertion',
        message: first.message ?? "This check failed, and it doesn't have a hint message.",
        traceback: first.message ? undefined : first.traceback,
      }
    }
  }
  const failedCount = checks.filter((c) => !c.passed).length
  return { passed: checks.length > 0 && failedCount === 0, checks, failedCount, firstFailure, output: run.output }
}
