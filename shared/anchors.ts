// Headings as jump targets, and the "Check yourself" questions that point at them
// (LESSON_FORMAT.md). Shared by the site, which turns each question into a jump to its
// answer, and the validator, which makes sure every question points somewhere real.

export const CHECK_YOURSELF = 'Check yourself'

export interface Heading {
  level: 2 | 3
  /** Heading text as Sean reads it, without Markdown formatting */
  text: string
  /** Unique within the lesson; a question links to it as `(#slug)` */
  slug: string
  /** 1-based line in lesson.md */
  line: number
}

/** Heading text without Markdown formatting: links keep their text, code and emphasis marks go. */
export function plainHeadingText(markdown: string): string {
  return markdown
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[`*]/g, '')
    .replace(/(^|\s)_+|_+(?=\s|$)/g, '$1')
    .trim()
}

/** "2. TCP: open a reliable conversation" -> "2-tcp-open-a-reliable-conversation" */
export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s-]+/g, '-')
}

/** Gives repeated slugs a -2, -3 suffix, in document order. The site does the same. */
export function uniqueSlugger() {
  const seen = new Map<string, number>()
  return (text: string) => {
    const base = slugify(text) || 'section'
    const count = (seen.get(base) ?? 0) + 1
    seen.set(base, count)
    return count === 1 ? base : `${base}-${count}`
  }
}

const normalize = (text: string) => text.replace(/\r\n?/g, '\n')

/** Every "## " and "### " heading outside code fences, in order. */
export function scanHeadings(body: string, firstLine = 1): Heading[] {
  const slug = uniqueSlugger()
  const headings: Heading[] = []
  let fence: string | null = null
  normalize(body)
    .split('\n')
    .forEach((line, i) => {
      if (fence) {
        if (line.trimEnd() === fence) fence = null
        return
      }
      const open = /^(`{3,})/.exec(line)
      if (open) {
        fence = open[1]
        return
      }
      const h = /^(#{2,3}) (.+?)\s*#*\s*$/.exec(line)
      if (h) {
        const text = plainHeadingText(h[2])
        headings.push({ level: h[1].length as 2 | 3, text, slug: slug(text), line: firstLine + i })
      }
    })
  return headings
}

export interface CheckQuestion {
  /** 1-based line in lesson.md */
  line: number
  /** The whole list item as written */
  raw: string
  /** The slug after `(#`, if the item is a link to a heading */
  target?: string
}

export interface CheckBlock {
  heading: Heading
  questions: CheckQuestion[]
}

/** Each "Check yourself" heading with the list items written under it. */
export function scanCheckYourself(body: string, firstLine = 1): CheckBlock[] {
  const headings = scanHeadings(body, firstLine)
  const lines = normalize(body).split('\n')
  return headings
    .filter((h) => h.text === CHECK_YOURSELF)
    .map((heading) => {
      const next = headings.find((h) => h.line > heading.line)
      const end = next ? next.line - firstLine : lines.length
      const questions: CheckQuestion[] = []
      for (let i = heading.line - firstLine + 1; i < end; i++) {
        const item = /^[-*] (.+)$/.exec(lines[i])
        if (!item) continue
        const link = /^\[.+\]\(#([^)\s]+)\)\s*$/.exec(item[1].trim())
        questions.push({ line: firstLine + i, raw: item[1].trim(), target: link?.[1] })
      }
      return { heading, questions }
    })
}

/** Problems with the lesson's Check yourself questions, as "line N: ..." messages. */
export function checkYourselfIssues(body: string, firstLine = 1): string[] {
  const headings = scanHeadings(body, firstLine)
  const issues: string[] = []
  for (const { heading, questions } of scanCheckYourself(body, firstLine)) {
    if (questions.length === 0) {
      issues.push(`line ${heading.line}: "${CHECK_YOURSELF}" has no questions; list them as - [question](#heading)`)
    }
    for (const q of questions) {
      if (!q.target) {
        issues.push(
          `line ${q.line}: Check yourself question isn't linked to its answer. Write it as - [question](#heading-slug), where the heading is the one the answer sits under`,
        )
        continue
      }
      const target = headings.find((h) => h.slug === q.target)
      if (!target) {
        issues.push(
          `line ${q.line}: links to #${q.target}, but no heading has that slug. Headings: ${headings
            .filter((h) => h.text !== CHECK_YOURSELF)
            .map((h) => `#${h.slug}`)
            .join(', ')}`,
        )
      } else if (target.text === CHECK_YOURSELF) {
        issues.push(`line ${q.line}: links to another Check yourself; link to the heading the answer sits under`)
      } else if (target.line > heading.line) {
        issues.push(`line ${q.line}: links to #${q.target}, which comes after the question; the answer must be above it`)
      }
    }
  }
  return issues
}
