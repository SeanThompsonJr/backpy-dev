// Finds unverified-claim quotes in a lesson's prose. The validator uses this to reject a quote
// that isn't in the text; the site uses the same normalisation to underline it in place.
import type { Nodes, Root } from 'mdast'
import { toString } from 'mdast-util-to-string'
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import { unified } from 'unified'

/** Collapses all whitespace so line wraps in the Markdown source don't affect matching. */
export const normalizeText = (text: string) => text.replace(/\s+/g, ' ').trim()

export interface ProseBlock {
  /** The block's visible text (formatting removed), whitespace-normalised */
  text: string
  /** Title of the "## " section the block is in */
  section: string
}

/** Paragraphs, headings and table cells of a lesson body, in order. Code blocks are skipped. */
export function proseBlocks(markdown: string): ProseBlock[] {
  const tree = unified().use(remarkParse).use(remarkGfm).parse(markdown) as Root
  const blocks: ProseBlock[] = []
  let section = ''
  const visit = (node: Nodes) => {
    if (node.type === 'heading' && node.depth === 2) section = normalizeText(toString(node))
    if (node.type === 'paragraph' || node.type === 'heading' || node.type === 'tableCell') {
      blocks.push({ text: normalizeText(toString(node)), section })
      return
    }
    if (node.type === 'code' || node.type === 'html') return
    if ('children' in node) node.children.forEach(visit)
  }
  visit(tree)
  return blocks
}

/** The section a quote appears in, or undefined if it isn't in any single block of prose. */
export function locateQuote(quote: string, blocks: ProseBlock[]): string | undefined {
  const target = normalizeText(quote)
  return blocks.find((b) => b.text.includes(target))?.section
}
