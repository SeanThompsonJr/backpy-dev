// Turns a lesson folder's files into a typed lesson. Shared by the site and the validator.
// Errors are collected (never thrown) so the validator can report every problem at once.
import { parse as parseYaml } from 'yaml'
import type { z } from 'zod'
import {
  EXERCISE_FILES,
  LESSON_SECTIONS,
  frontMatterSchema,
  hintsSchema,
  metaSchema,
  quizSchema,
  sqlTestsSchema,
  type ExerciseMeta,
  type FrontMatter,
  type Hints,
  type Quiz,
  type SqlTests,
} from './schema'

export interface Issue {
  file: string
  message: string
}

export type BlockMode = 'run' | 'broken' | 'display'

export interface CodeBlock {
  lang: string
  mode: BlockMode
  /** For `python broken TypeError`: the exception the block must raise. */
  expectedError?: string
  code: string
  /** 1-based line of the opening fence in lesson.md */
  line: number
  /** The H2 section the block sits in */
  section: string
}

export interface LessonSection {
  title: string
  markdown: string
}

export interface Exercise {
  /** Folder name, e.g. "01-shared-team-list" */
  folder: string
  meta: ExerciseMeta
  starter?: string
  tests?: string
  solution?: string
  seed?: string
  sqlTests?: SqlTests
  hints?: Hints
  instructions?: string
}

export interface LoadedLesson {
  /** Lesson folder name, e.g. "013-functions" */
  folder: string
  frontMatter: FrontMatter
  /** lesson.md without front matter */
  body: string
  sections: LessonSection[]
  blocks: CodeBlock[]
  quiz?: Quiz
  exercises: Exercise[]
}

const normalize = (text: string) => text.replace(/\r\n?/g, '\n')

export function splitFrontMatter(text: string): { yaml: string; body: string; bodyLine: number } | null {
  const src = normalize(text)
  const match = /^---\n([\s\S]*?)\n---\n?/.exec(src)
  if (!match) return null
  return { yaml: match[1], body: src.slice(match[0].length), bodyLine: match[0].split('\n').length }
}

/** Parses fenced code blocks and H2 sections. Fences may use 3+ backticks. */
export function scanMarkdown(body: string, firstLine = 1): { sections: LessonSection[]; blocks: CodeBlock[]; issues: string[] } {
  const lines = normalize(body).split('\n')
  const sections: LessonSection[] = []
  const blocks: CodeBlock[] = []
  const issues: string[] = []
  let current: { title: string; lines: string[] } | null = null
  let fence: { ticks: string; info: string; start: number; code: string[] } | null = null

  const flushSection = () => {
    if (current) sections.push({ title: current.title, markdown: current.lines.join('\n').trim() })
  }

  lines.forEach((line, i) => {
    const lineNo = firstLine + i
    if (fence) {
      if (line.trimEnd() === fence.ticks) {
        const [lang = '', modeWord, ...rest] = fence.info.split(/\s+/).filter(Boolean)
        let mode: BlockMode = 'display'
        let expectedError: string | undefined
        if (modeWord === 'run') mode = 'run'
        else if (modeWord === 'broken') {
          mode = 'broken'
          expectedError = rest[0]
          if (lang === 'python' && !expectedError) {
            issues.push(`line ${fence.start}: "python broken" needs the exception it raises, e.g. \`\`\`python broken TypeError`)
          }
        } else if (modeWord) issues.push(`line ${fence.start}: unknown code block mode "${modeWord}" (use run or broken)`)
        blocks.push({
          lang,
          mode,
          expectedError,
          code: fence.code.join('\n'),
          line: fence.start,
          section: current?.title ?? '',
        })
        fence = null
      } else fence.code.push(line)
      current?.lines.push(line)
      return
    }
    const open = /^(`{3,})(.*)$/.exec(line)
    if (open) {
      fence = { ticks: open[1], info: open[2].trim(), start: lineNo, code: [] }
      current?.lines.push(line)
      return
    }
    const h2 = /^## (.+?)\s*$/.exec(line)
    if (h2) {
      flushSection()
      current = { title: h2[1], lines: [] }
      return
    }
    if (current) current.lines.push(line)
    else if (line.trim()) issues.push(`line ${lineNo}: text before the first "## " section`)
  })
  if (fence) issues.push(`line ${(fence as { start: number }).start}: code block is never closed`)
  flushSection()
  return { sections, blocks, issues }
}

function zodIssues(file: string, error: z.ZodError): Issue[] {
  return error.issues.map((i) => ({
    file,
    message: `${i.path.length ? i.path.join('.') + ': ' : ''}${i.message}`,
  }))
}

function parseJson<T>(file: string, text: string | undefined, schema: z.ZodType<T>, issues: Issue[]): T | undefined {
  if (text === undefined) return undefined
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch (e) {
    issues.push({ file, message: `not valid JSON: ${(e as Error).message}` })
    return undefined
  }
  const result = schema.safeParse(data)
  if (!result.success) {
    issues.push(...zodIssues(file, result.error))
    return undefined
  }
  return result.data
}

/**
 * @param folder lesson folder name, e.g. "013-functions"
 * @param files  file contents keyed by path relative to the lesson folder,
 *               e.g. "lesson.md", "exercises/01-x/meta.json"
 */
export function parseLessonFolder(folder: string, files: Record<string, string>): { lesson?: LoadedLesson; issues: Issue[] } {
  const issues: Issue[] = []
  const at = (path: string) => `${folder}/${path}`

  const md = files['lesson.md']
  if (md === undefined) return { issues: [{ file: at('lesson.md'), message: 'missing' }] }

  const split = splitFrontMatter(md)
  if (!split) return { issues: [{ file: at('lesson.md'), message: 'must start with --- front matter ---' }] }

  let fmData: unknown
  try {
    fmData = parseYaml(split.yaml)
  } catch (e) {
    return { issues: [{ file: at('lesson.md'), message: `front matter is not valid YAML: ${(e as Error).message}` }] }
  }
  const fm = frontMatterSchema.safeParse(fmData)
  if (!fm.success) issues.push(...zodIssues(at('lesson.md') + ' (front matter)', fm.error))

  const prefix = Number(folder.slice(0, 3))
  if (fm.success && /^\d{3}-/.test(folder) && fm.data.id !== prefix) {
    issues.push({ file: at('lesson.md'), message: `front matter id ${fm.data.id} doesn't match folder number ${folder.slice(0, 3)}` })
  }

  const scan = scanMarkdown(split.body, split.bodyLine)
  issues.push(...scan.issues.map((message) => ({ file: at('lesson.md'), message })))
  const titles = scan.sections.map((s) => s.title)
  if (titles.join('|') !== LESSON_SECTIONS.join('|')) {
    issues.push({
      file: at('lesson.md'),
      message: `sections must be exactly: ${LESSON_SECTIONS.map((s) => `"## ${s}"`).join(', ')}. Found: ${titles.map((t) => `"## ${t}"`).join(', ') || 'none'}`,
    })
  }

  const quiz = parseJson(at('quiz.json'), files['quiz.json'], quizSchema, issues)
  if (files['quiz.json'] === undefined) issues.push({ file: at('quiz.json'), message: 'missing' })

  const exerciseFolders = [...new Set(Object.keys(files).filter((p) => p.startsWith('exercises/')).map((p) => p.split('/')[1]))].sort()
  const exercises: Exercise[] = []
  for (const exFolder of exerciseFolders) {
    const exPath = (name: string) => `exercises/${exFolder}/${name}`
    const get = (name: string) => files[exPath(name)]
    if (!/^\d{2}-[a-z0-9-]+$/.test(exFolder)) {
      issues.push({ file: at(`exercises/${exFolder}`), message: 'exercise folders are named NN-kebab-slug' })
    }
    const meta = parseJson(at(exPath('meta.json')), get('meta.json'), metaSchema, issues)
    if (get('meta.json') === undefined) issues.push({ file: at(exPath('meta.json')), message: 'missing' })
    if (!meta) continue

    const required = EXERCISE_FILES[meta.type]
    for (const name of required) {
      if (get(name) === undefined) issues.push({ file: at(exPath(name)), message: `missing (required for ${meta.type} exercises)` })
    }
    const present = Object.keys(files)
      .filter((p) => p.startsWith(`exercises/${exFolder}/`))
      .map((p) => p.slice(`exercises/${exFolder}/`.length))
    for (const name of present) {
      if (!required.includes(name)) issues.push({ file: at(exPath(name)), message: `not part of a ${meta.type} exercise` })
    }

    const exercise: Exercise = { folder: exFolder, meta }
    if (meta.type === 'code' || meta.type === 'bug_hunt') {
      exercise.starter = get('starter.py')
      exercise.tests = get('tests.py')
      exercise.solution = get('solution.py')
      if (exercise.tests !== undefined && !/^from main import \*\s*$/m.test(exercise.tests)) {
        issues.push({ file: at(exPath('tests.py')), message: 'must import the learner\'s code with "from main import *"' })
      }
    } else if (meta.type === 'sql') {
      exercise.seed = get('seed.sql')
      exercise.starter = get('starter.sql')
      exercise.solution = get('solution.sql')
      exercise.sqlTests = parseJson(at(exPath('tests.json')), get('tests.json'), sqlTestsSchema, issues)
    } else {
      exercise.instructions = get('instructions.md')
    }
    if (meta.type !== 'local') exercise.hints = parseJson(at(exPath('hints.json')), get('hints.json'), hintsSchema, issues)
    exercises.push(exercise)
  }

  for (const path of Object.keys(files)) {
    if (path !== 'lesson.md' && path !== 'quiz.json' && !path.startsWith('exercises/')) {
      issues.push({ file: at(path), message: 'unexpected file in a lesson folder' })
    }
  }

  if (!fm.success) return { issues }
  return {
    lesson: { folder, frontMatter: fm.data, body: split.body, sections: scan.sections, blocks: scan.blocks, quiz, exercises },
    issues,
  }
}
