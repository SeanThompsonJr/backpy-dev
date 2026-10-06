// rehype plugin for lesson text: gives each "##"/"###" heading an id a Check yourself question
// can jump to, and marks each question with the heading its answer is under (LESSON_FORMAT.md).
// Slugs come from shared/anchors.ts, the same rules the validator checks links against.
import type { Element, ElementContent, Root, RootContent } from 'hast'
import { CHECK_YOURSELF, uniqueSlugger } from '../../shared/anchors'

export const HEADING_ID_PREFIX = 'lesson-'

const textOf = (node: ElementContent | RootContent): string =>
  node.type === 'text' ? node.value : node.type === 'element' ? node.children.map(textOf).join('') : ''

const isHeading = (node: RootContent): node is Element =>
  node.type === 'element' && (node.tagName === 'h2' || node.tagName === 'h3')

function linksIn(el: Element): Element[] {
  return el.children.flatMap((c) =>
    c.type !== 'element' ? [] : c.tagName === 'a' ? [c] : linksIn(c),
  )
}

export function rehypeLessonAnchors() {
  return (tree: Root) => {
    const slug = uniqueSlugger()
    const headingText = new Map<string, string>()
    for (const node of tree.children) {
      if (!isHeading(node)) continue
      const text = textOf(node).trim()
      const id = slug(text)
      node.properties.id = HEADING_ID_PREFIX + id
      node.properties.tabIndex = -1
      headingText.set(id, text)
    }

    const children = tree.children
    for (let i = 0; i < children.length; i++) {
      const heading = children[i]
      if (!isHeading(heading) || textOf(heading).trim() !== CHECK_YOURSELF) continue
      let j = i + 1
      while (j < children.length && children[j].type === 'text') j++
      const list = children[j]
      if (!list || list.type !== 'element' || list.tagName !== 'ul') continue

      list.properties.className = ['check-list']
      for (const link of linksIn(list)) {
        const href = String(link.properties.href ?? '')
        if (href.startsWith('#')) link.properties.dataAnswerIn = headingText.get(href.slice(1)) ?? ''
      }
      // A check partway through the lesson gets its own panel; the final one is a section.
      if (heading.tagName === 'h3') {
        const block: Element = {
          type: 'element',
          tagName: 'div',
          properties: { className: ['check-block'] },
          children: [heading, list],
        }
        children.splice(i, j - i + 1, block)
      }
    }
  }
}

const highlightTimers = new WeakMap<HTMLElement, number>()

/** Scrolls the lesson text to a heading, moves focus there, and briefly highlights it. */
export function jumpToHeading(slug: string) {
  const heading = document.getElementById(HEADING_ID_PREFIX + slug)
  if (!heading) return
  const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  heading.scrollIntoView({ block: 'start', behavior: smooth ? 'smooth' : 'auto' })
  heading.focus({ preventScroll: true })
  window.clearTimeout(highlightTimers.get(heading))
  heading.classList.remove('jump-landed')
  void heading.offsetWidth // restarts the highlight when the same heading is picked twice
  heading.classList.add('jump-landed')
  highlightTimers.set(
    heading,
    window.setTimeout(() => heading.classList.remove('jump-landed'), 1600),
  )
}
