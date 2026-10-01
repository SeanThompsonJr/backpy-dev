import { FIXTURE_SECTION_DIR, loadLessons, type LessonEntry } from '../../shared/content'

// Every file under content/tier-*/ is bundled as raw text and parsed with the same code the validator uses.
const lessonFiles = import.meta.glob('/content/tier-*/**/*', { query: '?raw', import: 'default', eager: true }) as Record<string, string>

// The fixture lesson exists only in development; it's dropped from production builds.
const fixtureFiles = import.meta.env.DEV
  ? (import.meta.glob('/content/_fixtures/**/*', { query: '?raw', import: 'default', eager: true }) as Record<string, string>)
  : {}

const { entries, issues } = loadLessons({ ...lessonFiles, ...fixtureFiles })

if (issues.length && import.meta.env.DEV) {
  console.warn(`backpy: ${issues.length} content problem(s). Run npm run validate for details.`, issues)
}

export const contentIssues = issues
export const fixture: LessonEntry | undefined = entries.find((e) => e.sectionDir === FIXTURE_SECTION_DIR)
export const lessonsById = new Map(
  entries.filter((e) => e.sectionDir !== FIXTURE_SECTION_DIR).map((e) => [e.lesson.frontMatter.id, e] as const),
)
