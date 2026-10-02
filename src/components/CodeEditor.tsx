import { useEffect, useRef } from 'react'
import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete'
import { defaultKeymap, history, historyKeymap, indentWithTab, isolateHistory } from '@codemirror/commands'
import { python } from '@codemirror/lang-python'
import { PostgreSQL, sql } from '@codemirror/lang-sql'
import { bracketMatching, indentOnInput, indentUnit } from '@codemirror/language'
import { EditorState, Prec } from '@codemirror/state'
import {
  EditorView,
  drawSelection,
  highlightActiveLine,
  highlightActiveLineGutter,
  highlightSpecialChars,
  keymap,
  lineNumbers,
} from '@codemirror/view'
import { backpyTheme } from '../editor/theme'

export type EditorLanguage = 'python' | 'sql'

interface Props {
  value: string
  language: EditorLanguage
  label: string
  onChange: (value: string) => void
  /** Ctrl+Enter (Cmd+Enter on a Mac) */
  onRun?: () => void
}

/**
 * CodeMirror 6 editor. The parent owns the text: when `value` changes from outside
 * (switching exercise, reset), the editor's document is replaced.
 */
export function CodeEditor({ value, language, label, onChange, onRun }: Props) {
  const host = useRef<HTMLDivElement>(null)
  const view = useRef<EditorView | null>(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  const onRunRef = useRef(onRun)
  onRunRef.current = onRun

  useEffect(() => {
    const state = EditorState.create({
      doc: value,
      extensions: [
        lineNumbers(),
        highlightActiveLineGutter(),
        highlightSpecialChars(),
        history(),
        drawSelection(),
        indentOnInput(),
        bracketMatching(),
        closeBrackets(),
        highlightActiveLine(),
        indentUnit.of('    '),
        EditorState.tabSize.of(4),
        // Highest precedence so Mod-Enter runs the code instead of inserting a blank line.
        Prec.highest(
          keymap.of([
            {
              key: 'Mod-Enter',
              run: () => {
                if (!onRunRef.current) return false
                onRunRef.current()
                return true
              },
            },
          ]),
        ),
        keymap.of([...closeBracketsKeymap, ...defaultKeymap, ...historyKeymap, indentWithTab]),
        language === 'python' ? python() : sql({ dialect: PostgreSQL }),
        backpyTheme,
        EditorView.contentAttributes.of({ 'aria-label': label }),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) onChangeRef.current(update.state.doc.toString())
        }),
      ],
    })
    view.current = new EditorView({ state, parent: host.current! })
    return () => {
      view.current?.destroy()
      view.current = null
    }
    // The editor is rebuilt only when the language or label changes; text changes go through the effect below.
  }, [language, label])

  useEffect(() => {
    const v = view.current
    if (v && v.state.doc.toString() !== value) {
      // A replacement from outside (e.g. Reset) is its own undo step, never merged with typing.
      v.dispatch({
        changes: { from: 0, to: v.state.doc.length, insert: value },
        annotations: isolateHistory.of('full'),
      })
    }
  }, [value])

  return <div ref={host} className="code-editor" data-testid="code-editor" />
}
