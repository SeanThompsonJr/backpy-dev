import { describe, expect, it } from 'vitest'
import { buildClaudePrompt, humanizeConceptId, lastErrorText, TUTOR_RULES, type PromptInput } from '../../src/components/claude-prompt'
import type { RunState } from '../../src/components/OutputPane'

const base: PromptInput = {
  lessonLabel: 'Lesson 13 of 124, Python',
  lessonTitle: 'Functions: arguments, scope, closures, lambdas, comprehensions, functools',
  concepts: [
    {
      name: 'Mutable default argument',
      definition: 'A default list or dict made once and shared by every call.',
      analogy: 'One shared notepad at the counter that every customer writes on.',
    },
  ],
  conceptText: 'Python creates the default **once, when `def` runs**.',
  explainBack: 'The default is made once, so every call shares it.',
  exercise: {
    title: 'Fix the shared-team bug',
    type: 'Bug hunt',
    instructions: '## The situation\n\nA new team already had Pikachu.',
    language: 'python',
    code: 'def add_member(name, team=[]):\n    team.append(name)\n    return team\n',
    failedSubmits: 2,
    solved: false,
  },
  lastError: 'Failed check: Each new team starts empty\nThe second new team already had a member.',
}

describe('the Copy to Claude prompt', () => {
  const prompt = buildClaudePrompt(base)

  it('starts with the tutoring rules, word for word', () => {
    expect(TUTOR_RULES).toBe(
      "Tutor me. Give direction and the concept, not the answer. Let me attempt. Correct my thinking, not my code. Only give the answer after I've tried twice.",
    )
    expect(prompt.startsWith(TUTOR_RULES + '\n\n')).toBe(true)
  })

  it('has the lesson, the concept with its analogy, the exercise, the code, the last error and the explain-back', () => {
    expect(prompt).toContain('## Lesson\nLesson 13 of 124, Python: Functions: arguments, scope')
    expect(prompt).toContain('- Mutable default argument: A default list or dict made once and shared by every call.')
    expect(prompt).toContain('Picture it as: One shared notepad at the counter')
    expect(prompt).toContain('Python creates the default **once, when `def` runs**.')
    expect(prompt).toContain("Fix the shared-team bug (Bug hunt). I've submitted 2 times without passing.")
    expect(prompt).toContain('## My code\n```python\ndef add_member(name, team=[]):')
    expect(prompt).toContain('## The last error\n```\nFailed check: Each new team starts empty')
    expect(prompt).toContain('## My explain-back answer\nThe default is made once, so every call shares it.')
  })

  it('says plainly when there is no error, no submit and no answer yet', () => {
    const fresh = buildClaudePrompt({
      ...base,
      exercise: { ...base.exercise!, failedSubmits: 0 },
      lastError: undefined,
      explainBack: '  ',
    })
    expect(fresh).toContain("I haven't submitted yet.")
    expect(fresh).toContain('## The last error\nNo errors yet.')
    expect(fresh).toContain("I haven't written one yet.")
  })

  it('a lesson without exercises leaves out the code and error sections', () => {
    const reading = buildClaudePrompt({ ...base, exercise: undefined, lastError: undefined })
    expect(reading).not.toContain('## My code')
    expect(reading).not.toContain('## The last error')
    expect(reading).toContain('## My explain-back answer')
  })

  it('code containing ``` cannot break out of its block', () => {
    const tricky = buildClaudePrompt({ ...base, exercise: { ...base.exercise!, code: 'doc = """\n```\n"""\n' } })
    expect(tricky).toContain('````python\ndoc = """\n```\n"""\n````')
  })
})

describe('the last error', () => {
  const run = (state: Partial<RunState>): RunState => ({ phase: 'idle', chunks: [], ...state })

  it('is the traceback after a failed run', () => {
    expect(lastErrorText(run({ phase: 'error', chunks: [{ stream: 'stdout', text: 'hi\n' }, { stream: 'stderr', text: 'Traceback...\nTypeError: x\n' }] }))).toBe(
      'Traceback...\nTypeError: x',
    )
  })

  it('is the SQL error with its line', () => {
    expect(lastErrorText(run({ phase: 'error', sql: { ok: false, error: { message: 'syntax error at or near "SELEC"', line: 2 } } }))).toBe(
      'ERROR: syntax error at or near "SELEC" (line 2)',
    )
  })

  it('is the first failed check after a failed submit, and nothing after a pass', () => {
    const failed = run({
      phase: 'graded',
      grade: {
        passed: false,
        checks: [],
        failedCount: 1,
        output: '',
        firstFailure: { label: 'Each new team starts empty', kind: 'assertion', message: 'When is a default created?' },
      },
    })
    expect(lastErrorText(failed)).toBe('Failed check: Each new team starts empty\nWhen is a default created?')
    expect(lastErrorText(run({ phase: 'graded', grade: { passed: true, checks: [], failedCount: 0, output: '' } }))).toBeUndefined()
  })

  it('mentions a timeout, and is empty when nothing went wrong', () => {
    expect(lastErrorText(run({ phase: 'timeout', timeoutSeconds: 5, timeoutDuring: 'running' }))).toBe('My code timed out after 5 seconds.')
    expect(lastErrorText(run({ phase: 'finished' }))).toBeUndefined()
    expect(lastErrorText(undefined)).toBeUndefined()
  })

  it('concepts not yet in concepts.json still get a readable name', () => {
    expect(humanizeConceptId('mutable-default-argument')).toBe('Mutable default argument')
  })
})
