// CodeMirror theme built from the same CSS tokens as the lesson's highlighted code blocks,
// so code looks identical in the lesson text and in the editor.
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { EditorView } from '@codemirror/view'
import { tags as t } from '@lezer/highlight'

const chrome = EditorView.theme(
  {
    '&': {
      height: '100%',
      color: 'var(--text)',
      backgroundColor: 'var(--code-bg)',
      fontSize: '0.9375rem',
    },
    '.cm-scroller': {
      fontFamily: 'var(--font-code)',
      lineHeight: '1.6',
    },
    '.cm-content': { padding: '12px 0', caretColor: 'var(--py-yellow)' },
    '.cm-cursor, .cm-dropCursor': { borderLeftColor: 'var(--py-yellow)', borderLeftWidth: '2px' },
    '&.cm-focused': { outline: 'none' },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
      backgroundColor: 'var(--selection)',
    },
    '.cm-gutters': {
      backgroundColor: 'var(--code-bg)',
      color: 'var(--text-faint)',
      border: 'none',
    },
    '.cm-lineNumbers .cm-gutterElement': { padding: '0 12px 0 16px' },
    '.cm-activeLine': { backgroundColor: 'var(--code-line)' },
    '.cm-activeLineGutter': { backgroundColor: 'var(--code-line)', color: 'var(--text-muted)' },
    '.cm-matchingBracket, &.cm-focused .cm-matchingBracket': {
      backgroundColor: 'transparent',
      outline: '1px solid var(--text-faint)',
    },
  },
  { dark: true },
)

const highlight = HighlightStyle.define([
  { tag: [t.keyword, t.controlKeyword, t.operatorKeyword, t.definitionKeyword, t.moduleKeyword], color: 'var(--syn-keyword)' },
  { tag: [t.string, t.special(t.string), t.regexp], color: 'var(--syn-string)' },
  { tag: [t.number, t.integer, t.float], color: 'var(--syn-number)' },
  { tag: [t.bool, t.null, t.atom, t.self], color: 'var(--syn-literal)' },
  { tag: [t.function(t.variableName), t.function(t.propertyName), t.function(t.definition(t.variableName))], color: 'var(--syn-function)' },
  { tag: [t.className, t.definition(t.className), t.typeName], color: 'var(--syn-function)' },
  { tag: [t.standard(t.variableName)], color: 'var(--syn-literal)' },
  { tag: [t.comment, t.lineComment, t.blockComment], color: 'var(--syn-comment)', fontStyle: 'italic' },
  { tag: [t.invalid], color: 'var(--err)' },
])

export const backpyTheme = [chrome, syntaxHighlighting(highlight)]
