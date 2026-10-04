// Checks a section's lesson folders against curriculum.json (GENERATION_PIPELINE.md: "Every lesson
// in the section exists, with ids and titles matching curriculum.json").
import type { LessonEntry } from '../../shared/content'
import type { Section } from '../../shared/curriculum'
import type { Finding } from './validate-lesson'

/**
 * @param complete missing lessons and checkpoint.md are errors (a finished section) rather than
 *   warnings (a section still being written, one lesson at a time)
 */
export function checkSection(
  section: Section,
  entries: LessonEntry[],
  files: Record<string, string>,
  complete: boolean,
): Finding[] {
  const findings: Finding[] = []
  const missing = complete ? 'error' : 'warning'
  const here = entries.filter((e) => e.sectionDir === section.dir)
  for (const lesson of section.lessons) {
    const found = here.filter((e) => e.lesson.frontMatter.id === lesson.id)
    if (found.length === 0) {
      findings.push({
        severity: missing,
        file: section.dir,
        message: `lesson ${lesson.id} ("${lesson.title}") isn't written yet`,
      })
    }
    if (found.length > 1) {
      findings.push({
        severity: 'error',
        file: section.dir,
        message: `lesson ${lesson.id} has ${found.length} folders: ${found.map((e) => e.lesson.folder).join(', ')}`,
      })
    }
    for (const e of found) {
      const fm = e.lesson.frontMatter
      const file = `${section.dir}/${e.lesson.folder}/lesson.md`
      if (fm.title !== lesson.title) {
        findings.push({
          severity: 'error',
          file,
          message: `title "${fm.title}" doesn't match curriculum.json: "${lesson.title}"`,
        })
      }
      if (fm.section !== section.name) {
        findings.push({
          severity: 'error',
          file,
          message: `section "${fm.section}" doesn't match curriculum.json: "${section.name}"`,
        })
      }
    }
  }
  for (const e of here) {
    if (!section.lessons.some((l) => l.id === e.lesson.frontMatter.id)) {
      findings.push({
        severity: 'error',
        file: `${section.dir}/${e.lesson.folder}`,
        message: `lesson ${e.lesson.frontMatter.id} isn't part of ${section.name} in curriculum.json`,
      })
    }
  }
  if (!(`content/${section.dir}/checkpoint.md` in files)) {
    findings.push({ severity: missing, file: section.dir, message: 'checkpoint.md is missing' })
  }
  return findings
}
