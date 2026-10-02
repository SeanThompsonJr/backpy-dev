// backpy's test runner (Pyodide, in Node) must agree with real pytest (CPython) on every test:
// same outcome, and the same assert message, since that message is the hint Sean sees.
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { loadNodePython, type NodePython } from '../../scripts/lib/pyodide-node'
import type { TestResult } from '../../shared/pyodide-core'

let python: NodePython
const scratch = mkdtempSync(join(tmpdir(), 'backpy-pytest-'))

beforeAll(async () => {
  python = await loadNodePython()
}, 120_000)
afterAll(() => rmSync(scratch, { recursive: true, force: true }))

const decode = (s: string) =>
  s.replace(/&#10;/g, '\n').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')

/** Runs real pytest under CPython (via uv) and reads its JUnit report. */
function realPytest(name: string, main: string, tests: string) {
  const dir = join(scratch, name)
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'main.py'), main)
  writeFileSync(join(dir, 'tests.py'), tests)
  const run = spawnSync(
    'uv',
    ['run', '--quiet', '--no-project', '--python', '3.14', '--with', 'pytest==9.0.2', 'pytest', '-q', '-p', 'no:cacheprovider', '--junitxml=report.xml', 'tests.py'],
    { cwd: dir, encoding: 'utf8' },
  )
  if (run.error) throw new Error(`Couldn't run uv: ${run.error.message}`)
  const xml = readFileSync(join(dir, 'report.xml'), 'utf8')
  const results = new Map<string, { outcome: string; message?: string }>()
  for (const m of xml.matchAll(/<testcase [^>]*?\sname="([^"]+)"[^>]*?(?:\/>|>([\s\S]*?)<\/testcase>)/g)) {
    const body = m[2] ?? ''
    const failure = /<(failure|error) message="([^"]*)"/.exec(body)
    results.set(m[1], failure ? { outcome: failure[1] === 'failure' ? 'failed' : 'error', message: decode(failure[2]) } : { outcome: 'passed' })
  }
  return results
}

/** pytest's first line, without the exception name, is what backpy shows as the message. */
function pytestMessage(message: string | undefined, kind: TestResult['kind']) {
  const firstLine = (message ?? '').split('\n')[0]
  return kind === 'assertion' ? firstLine.replace(/^AssertionError: /, '') : firstLine
}

function compare(name: string, main: string, tests: string) {
  const ours = python.backpy.runTests(main, tests)
  const theirs = realPytest(name, main, tests)
  if (ours.collection_error) {
    expect([...theirs.keys()].some((k) => theirs.get(k)!.outcome === 'error'), 'pytest also fails to collect').toBe(true)
    return ours
  }
  expect(ours.tests.map((t) => t.name)).toEqual([...theirs.keys()])
  for (const t of ours.tests) {
    const real = theirs.get(t.name)!
    expect(t.outcome, t.name).toBe(real.outcome)
    if (t.outcome === 'failed' && t.message) expect(t.message, t.name).toBe(pytestMessage(real.message, t.kind))
  }
  return ours
}

const fixture = (exercise: string, file: string) =>
  readFileSync(join('content/_fixtures/000-fixture/exercises', exercise, file), 'utf8')

describe('backpy test runner agrees with real pytest', () => {
  for (const exercise of ['01-make-a-team', '02-shared-team-bug']) {
    for (const version of ['starter', 'solution'] as const) {
      it(`fixture ${exercise}, ${version}`, () => {
        const run = compare(`${exercise}-${version}`, fixture(exercise, `${version}.py`), fixture(exercise, 'tests.py'))
        const passed = run.tests.every((t) => t.outcome === 'passed')
        expect(passed).toBe(version === 'solution')
      }, 60_000)
    }
  }

  it('passes, failures with and without messages, exceptions, capsys, unknown fixtures, shared module state', () => {
    const main = `
counter = []

def add(x):
    counter.append(x)
    return len(counter)

def boom():
    raise ValueError("bad value")

def shout(word):
    print(word.upper())

print("main.py was imported")
`
    const tests = `from main import *

def test_passes():
    assert add(1) == 1, "first add"

def test_module_state_carries_over():
    assert add(2) == 2, "main.py is imported once, so counter keeps its items"

def test_assert_without_message():
    assert add(3) == 99

def test_exception_in_learner_code():
    boom()

def test_capsys(capsys):
    shout("pika")
    assert capsys.readouterr().out == "PIKA\\n", "capsys sees what was printed"

def test_capsys_reset(capsys):
    print("one")
    capsys.readouterr()
    print("two")
    assert capsys.readouterr().out == "two\\n", "readouterr clears what it returned"

def test_wrong_capsys(capsys):
    shout("eevee")
    assert capsys.readouterr().out == "eevee\\n", "Printing changes nothing about case. Which string method did you call?"

def test_unknown_fixture(not_a_fixture):
    assert True

def helper():
    assert False, "not collected: name doesn't start with test"
`
    const run = compare('mixed', main, tests)
    expect(run.output).toBe('main.py was imported\n')
    const byName = Object.fromEntries(run.tests.map((t) => [t.name, t]))
    expect(byName.test_exception_in_learner_code.message).toBe('ValueError: bad value')
    expect(byName.test_exception_in_learner_code.traceback).toContain('File "main.py", line 9, in boom')
    expect(byName.test_wrong_capsys.message).toBe('Printing changes nothing about case. Which string method did you call?')
    expect(byName.test_unknown_fixture).toMatchObject({ outcome: 'error', message: "fixture 'not_a_fixture' not found" })
  }, 60_000)

  it('a syntax error in main.py stops collection, as in pytest', () => {
    const run = compare('syntax', 'def broken(:\n    pass\n', 'from main import *\n\ndef test_x():\n    assert True\n')
    expect(run.collection_error).toContain('SyntaxError')
    expect(run.collection_error).toContain('main.py')
  }, 60_000)
})

describe('backpy runner (the Run button)', () => {
  const run = (code: string) => {
    python.takeOutput()
    const ok = python.backpy.runCode(code)
    return { ok, ...python.takeOutput() }
  }

  it('prints to stdout', () => {
    expect(run('print("pikachu")\nprint(1 + 1)')).toEqual({ ok: true, stdout: 'pikachu\n2\n', stderr: '' })
  })

  it('starts each run with fresh variables', () => {
    run('team = ["snorlax"]')
    const second = run('print(team)')
    expect(second.ok).toBe(false)
    expect(second.stderr).toContain("NameError: name 'team' is not defined")
  })

  it('shows tracebacks that start at the learner code, with the source line', () => {
    const result = run('def level_up(level):\n    return level + "1"\n\nlevel_up(5)\n')
    expect(result.ok).toBe(false)
    expect(result.stderr).toMatch(/^Traceback \(most recent call last\):\n {2}File "main\.py", line 4, in <module>/)
    expect(result.stderr).toContain('    return level + "1"')
    expect(result.stderr).toContain('TypeError')
    expect(result.stderr).not.toContain('backpy_runner')
  })

  it('reports syntax errors with the line', () => {
    const result = run('print("ok"\n')
    expect(result.ok).toBe(false)
    expect(result.stderr).toContain('File "main.py", line 1')
    expect(result.stderr).toContain('SyntaxError')
  })

  it('explains that input() is unavailable', () => {
    const result = run('name = input("Name? ")')
    expect(result.ok).toBe(false)
    expect(result.stderr).toContain("input() isn't available here")
  })

  it('treats exit(0) as success and a non-zero exit as failure', () => {
    expect(run('print("bye")\nexit()').ok).toBe(true)
    expect(run('import sys\nsys.exit(2)')).toMatchObject({ ok: false, stderr: 'Exited with code 2\n' })
  })
})
