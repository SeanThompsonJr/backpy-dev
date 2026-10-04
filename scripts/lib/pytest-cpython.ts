// Runs real pytest under CPython (through uv), so tests are checked against the Python Sean will
// use on the job, not only Pyodide. Used by the validator and by the runner-agreement tests.
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

export const PYTEST_VERSION = '9.0.2'
/** Same minor version as the Python inside Pyodide (conventions.json, python_version). */
export const CPYTHON_VERSION = '3.14'

export interface PytestOutcome {
  outcome: 'passed' | 'failed' | 'error'
  /** pytest's failure message, e.g. "AssertionError: the hint\nassert ..." */
  message?: string
}

export interface PytestRun {
  /** Results by test name, in the order pytest ran them */
  tests: Map<string, PytestOutcome>
  /** pytest's own output, for error reports */
  output: string
}

const decode = (s: string) =>
  s.replace(/&#10;/g, '\n').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')

/**
 * Runs tests.py against main.py with real pytest. `packages` are installed at the versions
 * Pyodide ships (name -> version), so both runtimes test against the same libraries.
 */
export function runRealPytest(main: string, tests: string, packages: Record<string, string> = {}): PytestRun {
  const dir = mkdtempSync(join(tmpdir(), 'backpy-pytest-'))
  try {
    mkdirSync(dir, { recursive: true })
    writeFileSync(join(dir, 'main.py'), main)
    writeFileSync(join(dir, 'tests.py'), tests)
    const withPackages = Object.entries(packages).flatMap(([name, version]) => ['--with', `${name}==${version}`])
    const run = spawnSync(
      'uv',
      [
        'run',
        '--quiet',
        '--no-project',
        '--python',
        CPYTHON_VERSION,
        '--with',
        `pytest==${PYTEST_VERSION}`,
        ...withPackages,
        'pytest',
        '-q',
        '-p',
        'no:cacheprovider',
        '--junitxml=report.xml',
        'tests.py',
      ],
      { cwd: dir, encoding: 'utf8' },
    )
    if (run.error) throw new Error(`Couldn't run uv (needed for the CPython check): ${run.error.message}`)
    let xml = ''
    try {
      xml = readFileSync(join(dir, 'report.xml'), 'utf8')
    } catch {
      throw new Error(`pytest didn't produce a report:\n${run.stdout}${run.stderr}`)
    }
    const results = new Map<string, PytestOutcome>()
    for (const m of xml.matchAll(/<testcase [^>]*?\sname="([^"]+)"[^>]*?(?:\/>|>([\s\S]*?)<\/testcase>)/g)) {
      const failure = /<(failure|error) message="([^"]*)"/.exec(m[2] ?? '')
      results.set(
        m[1],
        failure ? { outcome: failure[1] === 'failure' ? 'failed' : 'error', message: decode(failure[2]) } : { outcome: 'passed' },
      )
    }
    return { tests: results, output: `${run.stdout}${run.stderr}` }
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}
