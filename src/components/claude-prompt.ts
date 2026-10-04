// Copy to Claude (BUILD_PLAN.md, milestone 9): one prompt with where Sean is and his tutoring
// rules, so Claude explains instead of doing the exercise for him (TEACHING_STYLE.md).
import type { RunState } from './OutputPane'

/** Sean's tutoring rules, word for word. They always come first. */
export const TUTOR_RULES =
  "Tutor me. Give direction and the concept, not the answer. Let me attempt. Correct my thinking, not my code. Only give the answer after I've tried twice."

export interface PromptConcept {
  name: string
  definition?: string
  /** The everyday picture backpy uses for it (concepts.json) */
  analogy?: string
}

export interface PromptInput {
  /** e.g. "Lesson 13 of 124, Python" */
  lessonLabel: string
  lessonTitle: string
  concepts: PromptConcept[]
  /** The lesson's "The concept" section */
  conceptText: string
  exercise?: {
    title: string
    type: string
    instructions: string
    language: 'python' | 'sql'
    code: string
    failedSubmits: number
    solved: boolean
  }
  lastError?: string
  explainBack: string
}

const CONCEPT_TEXT_LIMIT = 2500
const ERROR_LIMIT = 2000

const fence = (text: string, language = '') => {
  // A fence longer than any backtick run inside, so code with ``` can't break out of it.
  const longest = Math.max(2, ...(text.match(/`+/g) ?? []).map((run) => run.length))
  const ticks = '`'.repeat(longest + 1)
  return `${ticks}${language}\n${text.trimEnd()}\n${ticks}`
}

const clip = (text: string, limit: number) => (text.length > limit ? `${text.slice(0, limit).trimEnd()}\n[…cut for length]` : text)

export function buildClaudePrompt(input: PromptInput): string {
  const parts: string[] = [TUTOR_RULES, "I'm learning backend Python with backpy. Here's where I am."]

  parts.push(`## Lesson\n${input.lessonLabel}: ${input.lessonTitle}`)

  const conceptLines = input.concepts.map((c) => {
    let line = `- ${c.name}`
    if (c.definition) line += `: ${c.definition}`
    if (c.analogy) line += ` Picture it as: ${c.analogy}`
    return line
  })
  const conceptText = input.conceptText.trim() ? clip(input.conceptText.trim(), CONCEPT_TEXT_LIMIT) : ''
  parts.push(['## The concept', ...conceptLines, conceptText].filter(Boolean).join('\n'))

  if (input.exercise) {
    const ex = input.exercise
    const attempts = ex.solved
      ? 'I solved it and want to understand it better.'
      : ex.failedSubmits === 0
        ? "I haven't submitted yet."
        : `I've submitted ${ex.failedSubmits} time${ex.failedSubmits === 1 ? '' : 's'} without passing.`
    parts.push(`## The exercise\n${ex.title} (${ex.type}). ${attempts}\n\n${ex.instructions.trim()}`)
    parts.push(`## My code\n${fence(ex.code, ex.language)}`)
    parts.push(`## The last error\n${input.lastError ? fence(clip(input.lastError, ERROR_LIMIT)) : 'No errors yet.'}`)
  }

  const answer = input.explainBack.trim()
  parts.push(`## My explain-back answer\n${answer ? answer : "I haven't written one yet."}`)

  return parts.join('\n\n') + '\n'
}

/** The most recent problem shown in the output pane, as plain text, if there is one. */
export function lastErrorText(run: RunState | undefined): string | undefined {
  if (!run) return undefined
  switch (run.phase) {
    case 'error': {
      if (run.sql && !run.sql.ok) {
        const { message, line } = run.sql.error
        return `ERROR: ${message}${line ? ` (line ${line})` : ''}`
      }
      const stderr = run.chunks
        .filter((c) => c.stream === 'stderr')
        .map((c) => c.text)
        .join('')
        .trim()
      return stderr || undefined
    }
    case 'graded': {
      const grade = run.grade
      if (!grade || grade.passed) return undefined
      if (grade.loadError) return grade.loadError
      const failure = grade.firstFailure
      if (!failure) return undefined
      return [`Failed check: ${failure.label}`, failure.message, failure.traceback ?? ''].filter(Boolean).join('\n')
    }
    case 'timeout':
      return run.timeoutDuring === 'loading'
        ? 'The runtime never finished downloading.'
        : `My code timed out after ${run.timeoutSeconds} seconds.`
    default:
      return undefined
  }
}

/** "mutable-default-argument" -> "Mutable default argument", for concepts not yet in concepts.json */
export const humanizeConceptId = (id: string) => {
  const words = id.replace(/-/g, ' ')
  return words.charAt(0).toUpperCase() + words.slice(1)
}
