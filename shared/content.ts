// Groups raw content files into lessons. The site feeds it Vite's import.meta.glob output;
// the validator feeds it files read from disk. Both use keys like "content/tier-1/01-x/001-y/lesson.md".
import { parseLessonFolder, type Issue, type LoadedLesson } from './lesson-parse'

export const FIXTURE_SECTION_DIR = '_fixtures'

const LESSON_FILE = /^content\/(_fixtures|tier-\d+\/\d{2}-[a-z0-9-]+)\/(\d{3}-[a-z0-9-]+)\/(.+)$/

export interface LessonEntry {
  /** "tier-1/01-orientation" or "_fixtures" */
  sectionDir: string
  lesson: LoadedLesson
}

export function groupLessonFiles(files: Record<string, string>) {
  const groups = new Map<string, { sectionDir: string; folder: string; files: Record<string, string> }>()
  for (const [rawPath, text] of Object.entries(files)) {
    const path = rawPath.replace(/\\/g, '/').replace(/^\//, '')
    const m = LESSON_FILE.exec(path)
    if (!m) continue
    const [, sectionDir, folder, rel] = m
    const key = `${sectionDir}/${folder}`
    if (!groups.has(key)) groups.set(key, { sectionDir, folder, files: {} })
    groups.get(key)!.files[rel] = text
  }
  return groups
}

export function loadLessons(files: Record<string, string>): { entries: LessonEntry[]; issues: Issue[] } {
  const entries: LessonEntry[] = []
  const issues: Issue[] = []
  for (const group of groupLessonFiles(files).values()) {
    const result = parseLessonFolder(group.folder, group.files)
    issues.push(...result.issues.map((i) => ({ ...i, file: `${group.sectionDir}/${i.file}` })))
    if (result.lesson) entries.push({ sectionDir: group.sectionDir, lesson: result.lesson })
  }
  entries.sort((a, b) => a.lesson.frontMatter.id - b.lesson.frontMatter.id)
  return { entries, issues }
}
