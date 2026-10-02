import { describe, expect, it } from 'vitest'
import { loadLessons, groupLessonFiles } from '../../shared/content'
import { parseLessonFolder } from '../../shared/lesson-parse'
import { LESSON_SECTIONS } from '../../shared/schema'
import { readContentFiles } from '../../scripts/lib/read-content'

const files = readContentFiles()
const { entries, issues } = loadLessons(files)
const fixture = entries.find((e) => e.sectionDir === '_fixtures')!

describe('fixture lesson', () => {
  it('parses with zero format problems', () => {
    expect(issues).toEqual([])
    expect(fixture).toBeDefined()
  })

  it('has every lesson.md feature', () => {
    const { frontMatter, sections, blocks } = fixture.lesson
    expect(sections.map((s) => s.title)).toEqual([...LESSON_SECTIONS])
    expect(frontMatter.explain_back.length).toBeGreaterThan(0)
    expect(frontMatter.unverified_claims.length).toBeGreaterThan(0)
    expect(frontMatter.concepts_introduced.length).toBeGreaterThan(0)
    const fences = blocks.map((b) => [b.lang, b.mode, b.expectedError ?? ''].join(' ').trim())
    expect(fences).toContain('python run')
    expect(fences).toContain('python broken TypeError')
    expect(fences).toContain('sql run')
  })

  it('has a 3-6 question quiz with an explanation per option and a predict-the-output question', () => {
    const questions = fixture.lesson.quiz!.questions
    expect(questions.length).toBeGreaterThanOrEqual(3)
    expect(questions.length).toBeLessThanOrEqual(6)
    for (const q of questions) expect(q.explanations).toHaveLength(q.options.length)
    expect(questions.some((q) => /predict the output/i.test(q.q))).toBe(true)
  })

  it('has one exercise of every type, each with the files its type needs', () => {
    const byType = Object.fromEntries(fixture.lesson.exercises.map((e) => [e.meta.type, e]))
    expect(Object.keys(byType).sort()).toEqual(['bug_hunt', 'code', 'local', 'sql'])
    for (const t of ['code', 'bug_hunt'] as const) {
      expect(byType[t].starter && byType[t].tests && byType[t].solution).toBeTruthy()
      expect(byType[t].hints?.hints).toHaveLength(2)
      expect(byType[t].hints?.solution_explanation).toBeTruthy()
    }
    expect(byType.bug_hunt.meta.type === 'bug_hunt' && byType.bug_hunt.meta.bug_description).toBeTruthy()
    expect(byType.sql.seed && byType.sql.starter && byType.sql.solution).toBeTruthy()
    expect(byType.sql.sqlTests?.checks.map((c) => c.kind)).toEqual(['same_columns', 'row_count', 'same_rows'])
    expect(byType.local.meta.type === 'local' && byType.local.meta.checklist.length).toBeGreaterThan(0)
    for (const ex of fixture.lesson.exercises) expect(ex.instructions, ex.folder).toBeTruthy()
  })

  it('resolves each unverified claim to the section its quote is in', () => {
    expect(fixture.lesson.claims).toEqual([
      {
        quote: 'Postgres evaluates a column default for every inserted row',
        check: expect.stringContaining('PostgreSQL documentation'),
        section: 'The concept',
      },
    ])
  })

  it('never compares to Java', () => {
    expect(fixture.lesson.body).not.toMatch(/\bJava\b/)
  })
})

// Each case breaks one rule in a copy of the fixture and checks the parser reports it.
describe('lesson parser catches format mistakes', () => {
  const group = [...groupLessonFiles(files).values()].find((g) => g.sectionDir === '_fixtures')!
  const mutate = (change: (f: Record<string, string>) => void) => {
    const copy = { ...group.files }
    change(copy)
    return parseLessonFolder(group.folder, copy)
      .issues.map((i) => `${i.file}: ${i.message}`)
      .join('\n')
  }
  const ex = (name: string, file: string) => `exercises/${name}/${file}`
  const editJson = (f: Record<string, string>, path: string, edit: (data: any) => void) => {
    const data = JSON.parse(f[path])
    edit(data)
    f[path] = JSON.stringify(data)
  }

  it('a missing lesson section', () => {
    expect(mutate((f) => (f['lesson.md'] = f['lesson.md'].replace('## What breaks', '## Pitfalls')))).toMatch(
      /sections must be exactly/,
    )
  })
  it('a broken block without its exception name', () => {
    expect(
      mutate((f) => (f['lesson.md'] = f['lesson.md'].replace('```python broken TypeError', '```python broken'))),
    ).toMatch(/needs the exception it raises/)
  })
  it('a quiz answer index out of range', () => {
    expect(mutate((f) => editJson(f, 'quiz.json', (q) => (q.questions[2].answer = 9)))).toMatch(
      /answer is not a valid option index/,
    )
  })
  it('a quiz option without an explanation', () => {
    expect(mutate((f) => editJson(f, 'quiz.json', (q) => q.questions[0].explanations.pop()))).toMatch(
      /every option needs exactly one explanation/,
    )
  })
  it('a missing exercise file', () => {
    expect(mutate((f) => delete f[ex('01-make-a-team', 'solution.py')])).toMatch(
      /01-make-a-team\/solution\.py: missing \(required for code exercises\)/,
    )
  })
  it('a bug hunt without bug_description', () => {
    expect(mutate((f) => editJson(f, ex('02-shared-team-bug', 'meta.json'), (m) => delete m.bug_description))).toMatch(
      /02-shared-team-bug\/meta\.json: bug_description/,
    )
  })
  it('tests.py that does not import from main', () => {
    const path = ex('01-make-a-team', 'tests.py')
    expect(mutate((f) => (f[path] = f[path].replace('from main import *', '')))).toMatch(/from main import \*/)
  })
  it('a front matter id that does not match the folder number', () => {
    expect(mutate((f) => (f['lesson.md'] = f['lesson.md'].replace('id: 0', 'id: 7')))).toMatch(
      /doesn't match folder number 000/,
    )
  })
  it('only one hint', () => {
    expect(mutate((f) => editJson(f, ex('03-private-by-default', 'hints.json'), (h) => h.hints.pop()))).toMatch(
      /03-private-by-default\/hints\.json: hints/,
    )
  })
  it('an unverified claim whose quote is not in the lesson', () => {
    expect(
      mutate(
        (f) =>
          (f['lesson.md'] = f['lesson.md'].replace(
            'evaluates a column default for every inserted row, so',
            'runs a column default for each inserted row, so',
          )),
      ),
    ).toMatch(/unverified_claims quote not found word for word.*"Postgres evaluates a column default for every inserted row"/)
  })
  it('an unverified claim given as a bare string instead of quote + check', () => {
    expect(
      mutate(
        (f) =>
          (f['lesson.md'] = f['lesson.md'].replace(
            /unverified_claims:\n[\s\S]*?\n---/,
            'unverified_claims:\n  - "something to check"\n---',
          )),
      ),
    ).toMatch(/unverified_claims\.0/)
  })
  it('a quote that crosses bold and code formatting still matches', () => {
    expect(
      mutate(
        (f) =>
          (f['lesson.md'] = f['lesson.md'].replace(
            'quote: "Postgres evaluates a column default for every inserted row"',
            'quote: "Python creates the default once, when def runs, not each time"',
          )),
      ),
    ).toBe('')
  })
  it('a code exercise without its instructions.md scenario', () => {
    expect(mutate((f) => delete f[ex('01-make-a-team', 'instructions.md')])).toMatch(
      /01-make-a-team\/instructions\.md: missing \(required for code exercises\)/,
    )
  })
  it('instructions without the required sections, or out of order', () => {
    const path = ex('01-make-a-team', 'instructions.md')
    expect(mutate((f) => (f[path] = f[path].replace('## Example', '## Sample')))).toMatch(
      /01-make-a-team\/instructions\.md: sections must be "## The situation", "## Your task", "## Example", "## Done when", in that order/,
    )
    expect(
      mutate((f) => {
        const [situation, rest] = f[path].split('## Your task')
        f[path] = '## Your task' + rest + '\n' + situation
      }),
    ).toMatch(/in that order/)
  })
  it('a done-when list that does not match the tests one to one', () => {
    const path = ex('02-shared-team-bug', 'instructions.md')
    expect(mutate((f) => (f[path] = f[path].replace('- Each new team starts empty.\n', '')))).toMatch(
      /"## Done when" has 1 bullet but tests\.py has 2 tests/,
    )
  })
  it('instructions with text before the first section', () => {
    const path = ex('03-private-by-default', 'instructions.md')
    expect(mutate((f) => (f[path] = 'Read this first.\n\n' + f[path]))).toMatch(/text before the first "## " section/)
  })
  it('a local exercise may skip Example but not Your task', () => {
    const path = ex('04-run-it-locally', 'instructions.md')
    expect(mutate((f) => (f[path] = f[path].split('## Example')[0]))).toBe('')
    expect(mutate((f) => (f[path] = f[path].replace('## Your task', '## Steps')))).toMatch(/04-run-it-locally\/instructions\.md: sections must be/)
  })
  it('windows line endings parse the same as unix ones', () => {
    expect(mutate((f) => (f['lesson.md'] = f['lesson.md'].replace(/\n/g, '\r\n')))).toBe('')
  })
})
