// npm run validate [-- <section>] [--complete] [--no-cpython] [--versions]
//
// Checks lesson content against LESSON_FORMAT.md and GENERATION_PIPELINE.md ("What the validator
// checks"), running code on the same Pyodide and PGlite as the site. Exits 1 if anything is wrong.
//   <section>      e.g. 01-orientation, or "fixtures". Without it: every section with content.
//   --complete     a section's missing lessons and checkpoint.md are errors, not warnings
//                  (always on without <section>: committed sections must be whole)
//   --no-cpython   skip the real-pytest-in-CPython check (it needs uv)
//   --versions     print the runtime versions as JSON and stop
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { PGlite } from '@electric-sql/pglite'
import { FIXTURE_SECTION_DIR, loadLessons } from '../shared/content'
import { buildCurriculum, type RawCurriculum, type Section } from '../shared/curriculum'
import { PGLITE_VERSION, runtimeSummary } from '../shared/runtime-versions'
import { loadNodePython } from './lib/pyodide-node'
import { readContentFiles } from './lib/read-content'
import { validateLesson, type Conventions, type Finding } from './lib/validate-lesson'
import { checkSection } from './lib/validate-section'

const root = process.cwd()
const readJson = <T>(path: string) => JSON.parse(readFileSync(join(root, path), 'utf8')) as T

const args = process.argv.slice(2)
const flags = new Set(args.filter((a) => a.startsWith('--')))
const sectionArg = args.find((a) => !a.startsWith('--'))

async function loadRuntimes() {
  const [python, pg] = await Promise.all([loadNodePython(root), PGlite.create()])
  const postgres = (
    (await pg.query<{ v: string }>("SELECT current_setting('server_version') AS v")).rows[0].v ?? ''
  ).split(' ')[0]
  return { python, pg, postgres }
}

async function printVersions() {
  const { python, pg, postgres } = await loadRuntimes()
  console.log(
    JSON.stringify({ pyodide: python.version, python: python.pythonVersion, pglite: PGLITE_VERSION, postgres }),
  )
  await pg.close()
}

async function main() {
  if (flags.has('--versions')) return printVersions()

  const curriculum = buildCurriculum(readJson<RawCurriculum>('curriculum/curriculum.json'))
  const files = readContentFiles(root)
  const { entries, issues } = loadLessons(files)
  const conventions = readJson<Conventions>('content/_registry/conventions.json')
  const registryEntries = readJson<{ concepts: { id: string; introduced_in: number }[] }>(
    'content/_registry/concepts.json',
  ).concepts
  const registry = new Map(registryEntries.map((c) => [c.id, c.introduced_in]))

  // Which sections to check.
  const fixtureOnly = sectionArg === 'fixtures' || sectionArg === FIXTURE_SECTION_DIR
  let sections: Section[]
  if (fixtureOnly) sections = []
  else if (sectionArg) {
    const section = curriculum.sectionBySlug.get(sectionArg)
    if (!section) {
      console.error(
        `Unknown section "${sectionArg}". Use one of:\n  fixtures\n  ${curriculum.sections.map((s) => s.slug).join('\n  ')}`,
      )
      process.exitCode = 1
      return
    }
    sections = [section]
  } else {
    sections = curriculum.sections.filter((s) => Object.keys(files).some((f) => f.startsWith(`content/${s.dir}/`)))
  }
  const complete = !sectionArg || flags.has('--complete')
  const dirs = new Set([...sections.map((s) => s.dir), ...(fixtureOnly || !sectionArg ? [FIXTURE_SECTION_DIR] : [])])
  const targets = entries
    .filter((e) => dirs.has(e.sectionDir))
    .sort((a, b) => a.lesson.frontMatter.id - b.lesson.frontMatter.id)

  const findings: Finding[] = issues
    .filter((i) => [...dirs].some((d) => i.file.startsWith(`${d}/`)))
    .map((i) => ({ severity: 'error' as const, file: i.file, message: i.message }))
  for (const section of sections) findings.push(...checkSection(section, entries, files, complete))
  // Lesson folders sitting outside any curriculum section folder are always a mistake.
  for (const e of entries) {
    if (e.sectionDir !== FIXTURE_SECTION_DIR && !curriculum.sections.some((s) => s.dir === e.sectionDir)) {
      findings.push({
        severity: 'error',
        file: `${e.sectionDir}/${e.lesson.folder}`,
        message: 'is in a folder that matches no section in curriculum.json',
      })
    }
  }

  console.log(`backpy validate: ${sectionArg ?? 'all content'}${complete ? ' (complete)' : ''}`)
  if (targets.length > 0) {
    const { python, pg, postgres } = await loadRuntimes()
    console.log(
      `${runtimeSummary(python.version, PGLITE_VERSION)} (Python ${python.pythonVersion}, PostgreSQL ${postgres})\n`,
    )
    const lock = readJson<{ packages: Record<string, { name: string; version: string }> }>(
      'node_modules/pyodide/pyodide-lock.json',
    )
    const pyodidePackages = new Map(Object.values(lock.packages).map((p) => [p.name, p.version]))
    const checkCpython = !flags.has('--no-cpython')

    for (const entry of targets) {
      const id = entry.lesson.frontMatter.id
      // Taught before this lesson: concepts.json, plus lessons on disk that come earlier.
      const conceptsBefore = new Map<string, number>()
      for (const [concept, lessonId] of registry) if (lessonId < id) conceptsBefore.set(concept, lessonId)
      for (const other of entries) {
        const otherId = other.lesson.frontMatter.id
        if (otherId > 0 && otherId < id)
          for (const c of other.lesson.frontMatter.concepts_introduced) conceptsBefore.set(c, otherId)
      }
      const lessonFindings = await validateLesson(entry, {
        python,
        pg,
        conventions,
        pyodidePackages,
        conceptsBefore,
        registry,
        checkCpython,
      })
      findings.push(...lessonFindings)
      const own = findings.filter(
        (f) => f.file.startsWith(`${entry.sectionDir}/${entry.lesson.folder}/`) && f.severity === 'error',
      )
      console.log(`${own.length ? '✗' : '✓'} ${entry.sectionDir}/${entry.lesson.folder}`)
    }
    await pg.close()
  } else {
    console.log('No lessons to run.')
  }

  const errors = findings.filter((f) => f.severity === 'error')
  const warnings = findings.filter((f) => f.severity === 'warning')
  if (findings.length) console.log('')
  for (const f of [...errors, ...warnings]) {
    console.log(`${f.severity === 'error' ? 'error' : 'warning'}  content/${f.file}: ${f.message}`)
  }
  console.log(
    `\n${errors.length} error${errors.length === 1 ? '' : 's'}, ${warnings.length} warning${warnings.length === 1 ? '' : 's'}, ${targets.length} lesson${targets.length === 1 ? '' : 's'} checked.`,
  )
  process.exitCode = errors.length ? 1 : 0
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  // Pyodide keeps Node's event loop alive; leave once the report is printed.
  .finally(() => process.exit())
