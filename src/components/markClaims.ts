// rehype plugin: wraps each unverified-claim quote in <mark class="claim" data-claim="i">.
// A quote can cross inline formatting (**bold**, `code`, links) inside one paragraph, list
// item, heading or table cell; whitespace is matched loosely, as in shared/claims.ts.
import type { Element, ElementContent, Root, RootContent, Text } from 'hast'
import { normalizeText } from '../../shared/claims'

const BLOCKS = new Set(['p', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'td', 'th'])
const SKIP = new Set(['pre', 'ul', 'ol', 'p', 'table'])

interface TextRef {
  node: Text
  parent: Element
}

/** Text nodes inside a block, stopping at nested blocks so each block is searched on its own. */
function textNodes(block: Element): TextRef[] {
  const out: TextRef[] = []
  const walk = (el: Element) => {
    for (const child of el.children) {
      if (child.type === 'text') out.push({ node: child, parent: el })
      else if (child.type === 'element' && !(child !== block && SKIP.has(child.tagName))) walk(child)
    }
  }
  walk(block)
  return out
}

/** Normalised text of the nodes, plus where each normalised character came from. */
function indexText(refs: TextRef[]) {
  let text = ''
  const origin: { ref: number; offset: number }[] = []
  refs.forEach((r, ref) => {
    for (let offset = 0; offset < r.node.value.length; offset++) {
      const ch = r.node.value[offset]
      if (/\s/.test(ch)) {
        if (text === '' || text.endsWith(' ')) continue
        text += ' '
      } else text += ch
      origin.push({ ref, offset })
    }
  })
  return { text, origin }
}

function markRange(refs: TextRef[], start: { ref: number; offset: number }, end: { ref: number; offset: number }, claim: number, title: string) {
  // Work backwards so earlier positions stay valid while siblings are inserted.
  for (let r = end.ref; r >= start.ref; r--) {
    const { node, parent } = refs[r]
    const from = r === start.ref ? start.offset : 0
    const to = r === end.ref ? end.offset + 1 : node.value.length
    const pieces: ElementContent[] = []
    if (from > 0) pieces.push({ type: 'text', value: node.value.slice(0, from) })
    pieces.push({
      type: 'element',
      tagName: 'mark',
      properties: {
        className: ['claim'],
        dataClaim: String(claim),
        title,
        ...(r === start.ref ? { id: `claim-${claim}`, tabIndex: -1 } : {}),
      },
      children: [{ type: 'text', value: node.value.slice(from, to) }],
    })
    if (r === end.ref) {
      pieces.push({
        type: 'element',
        tagName: 'span',
        properties: { className: ['visually-hidden'] },
        children: [{ type: 'text', value: ' (unverified claim)' }],
      })
    }
    if (to < node.value.length) pieces.push({ type: 'text', value: node.value.slice(to) })
    parent.children.splice(parent.children.indexOf(node), 1, ...pieces)
  }
}

export function rehypeMarkClaims(options: { claims: { quote: string; check: string }[] }) {
  return (tree: Root) => {
    const blocks: Element[] = []
    const collect = (nodes: RootContent[]) => {
      for (const n of nodes) {
        if (n.type !== 'element') continue
        if (n.tagName === 'pre') continue
        if (BLOCKS.has(n.tagName)) blocks.push(n)
        collect(n.children)
      }
    }
    collect(tree.children)

    options.claims.forEach(({ quote, check }, claim) => {
      const target = normalizeText(quote)
      for (const block of blocks) {
        const refs = textNodes(block)
        const { text, origin } = indexText(refs)
        const at = text.indexOf(target)
        if (at === -1) continue
        markRange(refs, origin[at], origin[at + target.length - 1], claim, `Unverified. Check: ${check}`)
        break
      }
    })
  }
}
