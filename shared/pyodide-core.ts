// Runs learner code and exercise tests in an already-loaded Pyodide. The browser worker and the
// Node validator both use this; only loading Pyodide and enforcing timeouts differ between them
// (each host kills its own worker when time runs out).
import type { PyodideInterface } from 'pyodide'
import type { PyCallable } from 'pyodide/ffi'

export interface PythonSources {
  /** shared/python/backpy_runner.py */
  runner: string
  /** shared/python/backpy_test_runner.py */
  testRunner: string
}

export interface TestResult {
  name: string
  outcome: 'passed' | 'failed' | 'error'
  kind?: 'assertion' | 'exception'
  /** The assert message (the concept hint), an exception summary, or a fixture error */
  message?: string | null
  traceback?: string
}

export interface TestRun {
  /** Set when tests.py (or the main.py it imports) couldn't even load */
  collection_error: string | null
  tests: TestResult[]
  /** Anything printed while main.py and tests.py were imported */
  output: string
}

export interface Backpy {
  /** Runs code as main.py; output goes to Pyodide's stdout/stderr. True if no exception escaped. */
  runCode(code: string): boolean
  /** Runs tests.py against code (as main.py) with backpy's pytest-compatible runner. */
  runTests(code: string, tests: string): TestRun
  loadPackages(packages: string[]): Promise<void>
}

const HELPER_DIR = '/home/pyodide/backpy'

export function installBackpy(py: PyodideInterface, sources: PythonSources): Backpy {
  py.FS.mkdirTree(HELPER_DIR)
  py.FS.writeFile(`${HELPER_DIR}/backpy_runner.py`, sources.runner)
  py.FS.writeFile(`${HELPER_DIR}/backpy_test_runner.py`, sources.testRunner)
  py.runPython(`
import sys
if ${JSON.stringify(HELPER_DIR)} not in sys.path:
    sys.path.insert(0, ${JSON.stringify(HELPER_DIR)})
`)
  const run = py.pyimport('backpy_runner.run') as PyCallable
  const runTestsJson = py.pyimport('backpy_test_runner.run_tests_json') as PyCallable

  return {
    runCode: (code) => run(code) as boolean,
    runTests: (code, tests) => JSON.parse(runTestsJson(code, tests) as string) as TestRun,
    loadPackages: async (packages) => {
      if (packages.length) await py.loadPackage(packages, { messageCallback: () => {} })
    },
  }
}
