import { useMemo, type ReactNode } from 'react'
import ReactMarkdown, { type Components } from 'react-markdown'
import type { PluggableList } from 'unified'
import { rehypeMarkClaims } from './markClaims'
import rehypeHighlight from 'rehype-highlight'
import remarkGfm from 'remark-gfm'
import { TriangleAlert } from 'lucide-react'
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

const components: Components = {
  pre: CodeBlock,
  a: ({ href, children }) => (
    <a href={href} target={href?.startsWith('http') ? '_blank' : undefined} rel="noreferrer">
      {children}
    </a>
  ),
}

interface Props {
  children: string
  className?: string
  /** Unverified claims to underline in place (see markClaims.ts) */
  claims?: { quote: string; check: string }[]
}

export function Markdown({ children, className, claims }: Props) {
  const rehypePlugins = useMemo(() => {
    const plugins: PluggableList = [[rehypeHighlight, { languages: LANGUAGES, detect: false, plainText: ['text'] }]]
    if (claims?.length) plugins.push([rehypeMarkClaims, { claims }])
    return plugins
  }, [claims])
  return (
    <div className={className}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={rehypePlugins} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  )
}
