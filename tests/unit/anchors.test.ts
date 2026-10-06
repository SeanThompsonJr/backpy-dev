// Check yourself questions link to the heading their answer sits under (LESSON_FORMAT.md).
// The validator and the site share these rules, so a link that passes here jumps in the browser.
import { describe, expect, it } from 'vitest'
import { checkYourselfIssues, plainHeadingText, scanCheckYourself, scanHeadings, slugify } from '../../shared/anchors'
import { groupLessonFiles } from '../../shared/content'
import { parseLessonFolder } from '../../shared/lesson-parse'
import { readContentFiles } from '../../scripts/lib/read-content'

const lesson = (concept: string, final: string) => `## Why this matters

Text.

## The concept

### DNS: find the address

Text.

${concept}

### TCP: a reliable conversation

Text.

## Worked example

\`\`\`python run
# ## not a heading
print(1)
\`\`\`

## What breaks

Text.

## Check yourself

${final}
`

const LINKED = '- [What does DNS give back?](#dns-find-the-address)'

describe('heading slugs', () => {
  it('lowercase the text, drop punctuation and accents, and join words with hyphens', () => {
    expect(slugify('2. TCP: open a reliable conversation')).toBe('2-tcp-open-a-reliable-conversation')
    expect(slugify("What's a Pokémon?")).toBe('whats-a-pokemon')
    expect(plainHeadingText('`GET` and **POST**')).toBe('GET and POST')
  })

  it('come from "##" and "###" headings outside code, and repeats get -2, -3', () => {
    const headings = scanHeadings(lesson('### Check yourself\n\n' + LINKED, LINKED))
    expect(headings.map((h) => `${h.level} ${h.slug}`)).toEqual([
      '2 why-this-matters',
      '2 the-concept',
      '3 dns-find-the-address',
      '3 check-yourself',
      '3 tcp-a-reliable-conversation',
      '2 worked-example',
      '2 what-breaks',
      '2 check-yourself-2',
    ])
  })
})

describe('Check yourself questions', () => {
  it('pass when every question links to a heading above it, including a check partway through', () => {
    const body = lesson('### Check yourself\n\n' + LINKED, `${LINKED}\n- [What does TCP add?](#tcp-a-reliable-conversation)`)
    expect(checkYourselfIssues(body)).toEqual([])
    expect(scanCheckYourself(body).map((b) => b.questions.map((q) => q.target))).toEqual([
      ['dns-find-the-address'],
      ['dns-find-the-address', 'tcp-a-reliable-conversation'],
    ])
  })

  it('must be links', () => {
    expect(checkYourselfIssues(lesson('', '- What does DNS give back?'))).toEqual([
      expect.stringMatching(/^line 30: Check yourself question isn't linked to its answer/),
    ])
  })

  it('must point at a heading that exists', () => {
    expect(checkYourselfIssues(lesson('', '- [What does DNS give back?](#dns)'))).toEqual([
      expect.stringMatching(/^line 30: links to #dns, but no heading has that slug\. Headings: #why-this-matters, #the-concept, #dns-find-the-address/),
    ])
  })

  it('must point above the question, at an answer rather than another check', () => {
    const early = '### Check yourself\n\n- [What does TCP add?](#tcp-a-reliable-conversation)'
    expect(checkYourselfIssues(lesson(early, LINKED))).toEqual([
      expect.stringMatching(/links to #tcp-a-reliable-conversation, which comes after the question/),
    ])
    expect(checkYourselfIssues(lesson('', '- [Again?](#check-yourself)'))).toEqual([
      expect.stringMatching(/links to another Check yourself/),
    ])
  })

  it('need at least one question', () => {
    expect(checkYourselfIssues(lesson('', ''))).toEqual([expect.stringMatching(/"Check yourself" has no questions/)])
  })

  it('are checked when a lesson folder is parsed, so the validator reports them', () => {
    const fixture = [...groupLessonFiles(readContentFiles()).values()].find((g) => g.sectionDir === '_fixtures')!
    const files = { ...fixture.files, 'lesson.md': fixture.files['lesson.md'].replace('](#worked-example)', '](#worked-exampel)') }
    const { issues } = parseLessonFolder(fixture.folder, files)
    expect(issues.map((i) => i.message)).toEqual([expect.stringMatching(/links to #worked-exampel, but no heading has that slug/)])
  })
})
