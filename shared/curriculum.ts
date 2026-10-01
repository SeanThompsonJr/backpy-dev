// Curriculum model shared by the site and the Node validator.
// curriculum/curriculum.json is the source of truth for order, ids and titles;
// this module derives folder names and lookups from it and rejects a malformed plan.

export type Coverage = 'sources' | 'partial' | 'claude'

export interface RawLesson {
  id: number
  title: string
  sources: string[]
  optional: boolean
  coverage: Coverage
}

export interface RawSection {
  section: string
  lessons: RawLesson[]
  checkpoint: string
}

export interface RawTier {
  tier: string
  sections: RawSection[]
}

export interface RawCurriculum {
  name: string
  version: number
  lesson_count: number
  source_keys: Record<string, string>
  coverage_key: Record<Coverage, string>
  tiers: RawTier[]
}

export interface Lesson extends RawLesson {
  sectionNumber: number
  /** Lesson folder prefix, e.g. "015". The slug after it is free-form. */
  prefix: string
}

export interface Section {
  number: number
  name: string
  /** e.g. "01-orientation" — the argument to `npm run validate -- <section>` */
  slug: string
  /** e.g. "tier-1/01-orientation", relative to content/ */
  dir: string
  tierNumber: number
  checkpoint: string
  lessons: Lesson[]
}

export interface Tier {
  number: number
  name: string
  /** e.g. "tier-1" */
  slug: string
  sections: Section[]
}

export interface Curriculum {
  name: string
  lessonCount: number
  coverageKey: Record<Coverage, string>
  sourceKeys: Record<string, string>
  tiers: Tier[]
  sections: Section[]
  lessons: Lesson[]
  lessonById: Map<number, Lesson>
  sectionByNumber: Map<number, Section>
  sectionBySlug: Map<string, Section>
}

const COVERAGES: readonly Coverage[] = ['sources', 'partial', 'claude']

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export const pad = (n: number, width: number) => String(n).padStart(width, '0')

export function buildCurriculum(raw: RawCurriculum): Curriculum {
  const errors: string[] = []
  const tiers: Tier[] = []
  const sections: Section[] = []
  const lessons: Lesson[] = []

  raw.tiers.forEach((rawTier, tierIndex) => {
    const match = /^Tier (\d+): (.+)$/.exec(rawTier.tier)
    if (!match) errors.push(`Tier "${rawTier.tier}" must look like "Tier N: Name".`)
    const number = match ? Number(match[1]) : tierIndex + 1
    if (number !== tierIndex + 1) errors.push(`Tier "${rawTier.tier}" is out of order.`)
    const tier: Tier = {
      number,
      name: match ? match[2] : rawTier.tier,
      slug: `tier-${number}`,
      sections: [],
    }

    for (const rawSection of rawTier.sections) {
      const sectionNumber = sections.length + 1
      const slug = `${pad(sectionNumber, 2)}-${slugify(rawSection.section)}`
      const section: Section = {
        number: sectionNumber,
        name: rawSection.section,
        slug,
        dir: `${tier.slug}/${slug}`,
        tierNumber: number,
        checkpoint: rawSection.checkpoint,
        lessons: [],
      }
      if (!rawSection.checkpoint?.trim()) errors.push(`Section "${rawSection.section}" has no checkpoint.`)
      if (rawSection.lessons.length === 0) errors.push(`Section "${rawSection.section}" has no lessons.`)

      for (const rawLesson of rawSection.lessons) {
        const expectedId = lessons.length + 1
        if (rawLesson.id !== expectedId) {
          errors.push(`Lesson "${rawLesson.title}" has id ${rawLesson.id}; expected ${expectedId} (ids run 1..N in order).`)
        }
        if (!COVERAGES.includes(rawLesson.coverage)) {
          errors.push(`Lesson ${rawLesson.id} has unknown coverage "${rawLesson.coverage}".`)
        }
        if (typeof rawLesson.optional !== 'boolean') errors.push(`Lesson ${rawLesson.id} is missing "optional".`)
        const lesson: Lesson = { ...rawLesson, sectionNumber, prefix: pad(rawLesson.id, 3) }
        section.lessons.push(lesson)
        lessons.push(lesson)
      }
      tier.sections.push(section)
      sections.push(section)
    }
    tiers.push(tier)
  })

  if (lessons.length !== raw.lesson_count) {
    errors.push(`lesson_count is ${raw.lesson_count} but the plan has ${lessons.length} lessons.`)
  }
  if (errors.length) throw new Error(`curriculum.json is invalid:\n- ${errors.join('\n- ')}`)

  return {
    name: raw.name,
    lessonCount: lessons.length,
    coverageKey: raw.coverage_key,
    sourceKeys: raw.source_keys,
    tiers,
    sections,
    lessons,
    lessonById: new Map(lessons.map((l) => [l.id, l])),
    sectionByNumber: new Map(sections.map((s) => [s.number, s])),
    sectionBySlug: new Map(sections.map((s) => [s.slug, s])),
  }
}
