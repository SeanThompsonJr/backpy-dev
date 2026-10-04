// The validator, check by check: the fixture passes clean, and each test breaks one rule in a
// copy of the fixture and expects the exact complaint. Runs real Pyodide, PGlite and pytest.
import { readFileSync } from 'node:fs'
import { PGlite } from '@electric-sql/pglite'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { groupLessonFiles, type LessonEntry } from '../../shared/content'
import { buildCurriculum, type RawCurriculum } from '../../shared/curriculum'
import { parseLessonFolder } from '../../shared/lesson-parse'
import { loadNodePython, type NodePython } from '../../scripts/lib/pyodide-node'
import { readContentFiles } from '../../scripts/lib/read-content'
import { validateLesson, type Conventions, type ValidationContext } from '../../scripts/lib/validate-lesson'
import { checkSection } from '../../scripts/lib/validate-section'

let python: NodePython
let pg: PGlite
beforeAll(async () => {
  ;[python, pg] = await Promise.all([loadNodePython(), PGlite.create()])
}, 120_000)
afterAll(async () => {
  await pg.close()
})

const files = readContentFiles()
const fixtureGroup = [...groupLessonFiles(files).values()].find((g) => g.sectionDir === '_fixtures')!
const conventions = JSON.parse(readFileSync('content/_registry/conventions.json', 'utf8')) as Conventions
const lock = JSON.parse(readFileSync('node_modules/pyodide/pyodide-lock.json', 'utf8')) as {
  packages: Record<string, { name: string; version: string }>
}
const pyodidePackages = new Map(Object.values(lock.packages).map((p) => [p.name, p.version]))

const ex = (name: string, file: string) => `exercises/${name}/${file}`
const CODE = '01-make-a-team'
const BUG = '02-shared-team-bug'
const SQL = '03-private-by-default'

/** Validates the fixture after `change` edits a copy of its files. Returns "file: message" lines. */
async function validate(change: (f: Record<string, string>) => void = () => {}, context: Partial<ValidationContext> = {}) {
  const copy = { ...fixtureGroup.files }
  change(copy)
  const parsed = parseLessonFolder(fixtureGroup.folder, copy)
  if (!parsed.lesson) throw new Error(parsed.issues.map((i) => i.message).join('\n'))
  const entry: LessonEntry = { sectionDir: '_fixtures', lesson: parsed.lesson }
  const findings = await validateLesson(entry, {
    python,
    pg,
    conventions,
    pyodidePackages,
    conceptsBefore: new Map(),
    registry: new Map(),
    checkCpython: false,
    ...context,
  })
  return findings.map((f) => `${f.severity} ${f.file}: ${f.message}`).join('\n')
}

const replaceIn = (f: Record<string, string>, path: string, from: string | RegExp, to: string) => {
  const before = f[path]
  f[path] = before.replace(from, to)
  if (f[path] === before) throw new Error(`nothing to replace in ${path}`)
}

describe('the validator', () => {
  it('passes the fixture with no findings, including the real-pytest check', async () => {
    expect(await validate(() => {}, { checkCpython: true })).toBe('')
  }, 120_000)

  describe('exercises', () => {
    it('a starter that already passes', async () => {
      expect(await validate((f) => (f[ex(CODE, 'starter.py')] = f[ex(CODE, 'solution.py')]))).toContain(
        `${CODE}/starter.py: the starter passes every test; it must fail`,
      )
    })

    it('a solution that fails', async () => {
      expect(await validate((f) => (f[ex(BUG, 'solution.py')] = f[ex(BUG, 'starter.py')]))).toContain(
        `${BUG}/solution.py: fails test_each_new_team_starts_empty in Pyodide: The second new team already had a member.`,
      )
    })

    it('a starter whose tests never finish', async () => {
      const looping = 'def add_member(name, team=[]):\n    while True:\n        pass\n'
      expect(await validate((f) => (f[ex(BUG, 'starter.py')] = looping))).toContain(
        `${BUG}/starter.py: the starter's tests didn't finish within 5 seconds`,
      )
    }, 60_000)

    it('an assert with no message, so no hint', async () => {
      expect(await validate((f) => replaceIn(f, ex(BUG, 'tests.py'), /, \\\n\s+"Passing a team in should[^"]*"/, ''))).toMatch(
        new RegExp(`${BUG}/tests\\.py: the assert on line \\d+ has no message`),
      )
    })

    it('a package Pyodide does not have', async () => {
      expect(await validate((f) => replaceIn(f, ex(CODE, 'meta.json'), '"packages": []', '"packages": ["not-a-real-package"]'))).toContain(
        `${CODE}/meta.json: package "not-a-real-package" isn't available in Pyodide`,
      )
    })

    it('a solution that passes in Pyodide but not under real pytest in CPython', async () => {
      const browserOnly = `${files[`content/_fixtures/000-fixture/${ex(BUG, 'tests.py')}`]}

def test_runs_where_it_should():
    import sys
    assert sys.platform == "emscripten", "This check only passes in the browser."
`
      const found = await validate((f) => (f[ex(BUG, 'tests.py')] = browserOnly), { checkCpython: true })
      expect(found).toContain(`${BUG}/solution.py: fails test_runs_where_it_should under real pytest in CPython`)
    }, 120_000)

    it('a SQL starter that already passes, and a SQL solution with no result', async () => {
      expect(await validate((f) => (f[ex(SQL, 'starter.sql')] = f[ex(SQL, 'solution.sql')]))).toContain(
        `${SQL}/starter.sql: the starter passes every check`,
      )
      expect(await validate((f) => replaceIn(f, ex(SQL, 'solution.sql'), /SELECT[\s\S]*$/, ''))).toContain(
        `${SQL}/solution.sql: the last statement returns no rows`,
      )
    })
  })

  describe('lesson code blocks', () => {
    it('a run block that raises', async () => {
      expect(await validate((f) => replaceIn(f, 'lesson.md', 'print(log_battle("onix fainted"))', 'print(log_battles("onix fainted"))'))).toMatch(
        /lesson\.md: python run block at line \d+ raised NameError/,
      )
    })

    it('a broken block that runs fine, and one that fails the wrong way', async () => {
      expect(await validate((f) => replaceIn(f, 'lesson.md', 'return sum(levels)', 'return levels'))).toMatch(
        /python broken block at line \d+ runs without an error; it must raise TypeError/,
      )
      expect(await validate((f) => replaceIn(f, 'lesson.md', '```python broken TypeError', '```python broken ValueError'))).toMatch(
        /python broken block at line \d+ raises TypeError, not ValueError/,
      )
    })

    it('a sql run block that fails', async () => {
      expect(await validate((f) => replaceIn(f, 'lesson.md', 'SELECT count(DISTINCT id)', 'SELEC count(DISTINCT id)'))).toMatch(
        /lesson\.md: sql run block at line \d+ failed: syntax error at or near "SELEC"/,
      )
    })
  })

  describe('teaching rules', () => {
    it('a banned import', async () => {
      expect(await validate((f) => (f[ex(CODE, 'solution.py')] = 'import requests\n' + f[ex(CODE, 'solution.py')]))).toContain(
        `${CODE}/solution: uses "import requests", which conventions.json bans`,
      )
    })

    it('a concept used before it is taught, or introduced twice', async () => {
      expect(await validate((f) => replaceIn(f, 'lesson.md', 'concepts_used: [', 'concepts_used: [http-request, '))).toContain(
        'lesson.md: uses "http-request" before any lesson teaches it',
      )
      expect(await validate(() => {}, { registry: new Map([['default-argument', 13]]) })).toContain(
        'lesson.md: introduces "default-argument", but concepts.json says lesson 13 already introduced it',
      )
      expect(await validate((f) => replaceIn(f, 'lesson.md', 'concepts_used: [', 'concepts_used: [function, '), { conceptsBefore: new Map([['function', 12]]) })).toBe('')
    })

    it('a Java comparison', async () => {
      expect(await validate((f) => replaceIn(f, 'lesson.md', 'A **default argument**', 'Like Java overloading, a **default argument**'))).toContain(
        'lesson.md: mentions Java',
      )
    })

    it('a quiz with no "Predict the output" question in a lesson with code', async () => {
      expect(await validate((f) => (f['quiz.json'] = f['quiz.json'].replace(/Predict the output/g, 'What happens')))).toContain(
        'quiz.json: the lesson has code, so the quiz needs at least one "Predict the output" question',
      )
    })
  })
})

describe('section checks against curriculum.json', () => {
  const curriculum = buildCurriculum(JSON.parse(readFileSync('curriculum/curriculum.json', 'utf8')) as RawCurriculum)
  const orientation = curriculum.sectionBySlug.get('01-orientation')!
  const fixtureLesson = parseLessonFolder(fixtureGroup.folder, fixtureGroup.files).lesson!
  const fakeLesson = (id: number, title: string, section = 'Orientation'): LessonEntry => ({
    sectionDir: orientation.dir,
    lesson: {
      ...fixtureLesson,
      folder: `${String(id).padStart(3, '0')}-x`,
      frontMatter: { ...fixtureLesson.frontMatter, id, title, section },
    },
  })
  const messages = (entries: LessonEntry[], complete: boolean, extraFiles: Record<string, string> = {}) =>
    checkSection(orientation, entries, extraFiles, complete).map((f) => `${f.severity}: ${f.message}`)

  it('missing lessons are warnings while a section is being written, errors once it should be complete', () => {
    expect(messages([], false)).toContain('warning: lesson 1 ("Why backend, and what backend engineers actually do") isn\'t written yet')
    expect(messages([], true)).toContain('error: checkpoint.md is missing')
  })

  it('a title or section name that does not match curriculum.json', () => {
    const found = messages([fakeLesson(1, 'Why backend?', 'Intro')], false)
    expect(found).toContain('error: title "Why backend?" doesn\'t match curriculum.json: "Why backend, and what backend engineers actually do"')
    expect(found).toContain('error: section "Intro" doesn\'t match curriculum.json: "Orientation"')
  })

  it('a lesson in the wrong section folder', () => {
    expect(messages([fakeLesson(13, 'Functions')], false)).toContain("error: lesson 13 isn't part of Orientation in curriculum.json")
  })

  it('a complete, matching section has nothing to report', () => {
    const all = orientation.lessons.map((l) => fakeLesson(l.id, l.title))
    expect(messages(all, true, { [`content/${orientation.dir}/checkpoint.md`]: '# Checkpoint' })).toEqual([])
  })
})
