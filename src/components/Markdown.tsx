import { useMemo, type ReactNode } from 'react'
import ReactMarkdown, { type Components } from 'react-markdown'
import type { PluggableList } from 'unified'
import { rehypeMarkClaims } from './markClaims'
import rehypeHighlight from 'rehype-highlight'
import remarkGfm from 'remark-gfm'
import { CornerLeftUp, TriangleAlert } from 'lucide-react'
import { jumpToHeading, rehypeLessonAnchors } from './lessonAnchors'
import bash from 'highlight.js/lib/languages/bash'
import json from 'highlight.js/lib/languages/json'
import pythonLang from 'highlight.js/lib/languages/python'
import sqlLang from 'highlight.js/lib/languages/sql'
import type { Element } from 'hast'

const LANGUAGES = { python: pythonLang, sql: sqlLang, bash, json }
const LANGUAGE_NAMES: Record<string, string> = { python: 'Python', sql: 'SQL', bash: 'Terminal', json: 'JSON' }

function CodeBlock({ node, children }: { node?: Element; children?: ReactNode }) {
  const code = node?.children.find((c): c is Element => c.type === 'element' && c.tagName === 'code')
  const classes = (code?.properties.className as string[] | undefined) ?? []
  const lang = classes.find((c) => c.startsWith('language-'))?.slice('language-'.length) ?? ''
  const meta = ((code?.data as { meta?: string } | undefined)?.meta ?? '').trim().split(/\s+/)
  const broken = meta[0] === 'broken'

  return (
    <figure className={`code-block${broken ? ' code-block-broken' : ''}`} data-mode={broken ? 'broken' : meta[0] || 'display'}>
      <div className="code-block-head">
        {broken && (
          <p className="code-block-caption">
            <TriangleAlert size={16} aria-hidden="true" />
            Broken on purpose{meta[1] ? <>: raises <code>{meta[1]}</code></> : null}
          </p>
        )}
        {lang && <span className="code-block-lang">{LANGUAGE_NAMES[lang] ?? lang}</span>}
      </div>
      <pre>{children}</pre>
    </figure>
  )
}

/**
 * A link to a heading in the same lesson. The site's router owns the URL's #, so instead of
 * following the link, it scrolls the lesson text to the heading. In a Check yourself list it
 * also says where the answer is.
 */
function JumpLink({ target, answerIn, children }: { target: string; answerIn?: string; children?: ReactNode }) {
  if (answerIn === undefined) {
    return (
      <button type="button" className="link-button link-button-inline" onClick={() => jumpToHeading(target)}>
        {children}
      </button>
    )
  }
  return (
    <button type="button" className="check-jump" onClick={() => jumpToHeading(target)}>
      <span className="check-question">{children}</span>
      <span className="check-where">
        <CornerLeftUp size={14} aria-hidden="true" />
        Answer in: {answerIn || 'this lesson'}
      </span>
    </button>
  )
}

const components: Components = {
  pre: CodeBlock,
  a: ({ node, href, children }) => {
    if (href?.startsWith('#')) {
      const answerIn = node?.properties.dataAnswerIn
      return (
        <JumpLink target={href.slice(1)} answerIn={answerIn === undefined ? undefined : String(answerIn)}>
          {children}
        </JumpLink>
      )
    }
    return (
      <a href={href} target={href?.startsWith('http') ? '_blank' : undefined} rel="noreferrer">
        {children}
      </a>
    )
  },
}

interface Props {
  children: string
  className?: string
  /** Unverified claims to underline in place (see markClaims.ts) */
  claims?: { quote: string; check: string }[]
  /** Lesson text: headings become jump targets for Check yourself questions (lessonAnchors.ts) */
  anchors?: boolean
  /** Renders a short phrase (e.g. a quiz option) inside a <span>, without a paragraph around it */
  inline?: boolean
}

const inlineComponents: Components = { ...components, p: ({ children }) => <>{children}</> }

export function Markdown({ children, className, claims, anchors = false, inline = false }: Props) {
  const rehypePlugins = useMemo(() => {
    const plugins: PluggableList = [[rehypeHighlight, { languages: LANGUAGES, detect: false, plainText: ['text'] }]]
    if (anchors) plugins.push(rehypeLessonAnchors)
    if (claims?.length) plugins.push([rehypeMarkClaims, { claims }])
    return plugins
  }, [claims, anchors])
  const markdown = (
    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={rehypePlugins} components={inline ? inlineComponents : components}>
      {children}
    </ReactMarkdown>
  )
  return inline ? <span className={className ?? 'md-inline'}>{markdown}</span> : <div className={className}>{markdown}</div>
}
