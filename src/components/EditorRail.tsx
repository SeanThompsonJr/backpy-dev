import type { ReactNode } from 'react'
import { CircleCheck, CircleX, FileCode, LoaderCircle, PanelRightOpen, Play, Send } from 'lucide-react'
import type { RunState } from './OutputPane'

interface Props {
  /** id of the hidden editor side, for aria-controls */
  panelId: string
  showRunButtons: boolean
  busy: boolean
  run: RunState
  /** Path of the file being edited in VS Code, if any */
  linkedPath?: string
  onExpand: () => void
  onRun: () => void
  onSubmit: () => void
  /** Copy to Claude, so it's reachable while coding in VS Code */
  copyButton?: ReactNode
}

function LastResult({ run }: { run: RunState }) {
  if (run.phase === 'running') {
    return (
      <span className="rail-result" title="Running">
        <LoaderCircle size={18} className="spin" aria-hidden="true" />
        <span className="visually-hidden">Running</span>
      </span>
    )
  }
  if (run.phase === 'graded' && run.grade) {
    const { passed, failedCount, checks } = run.grade
    const text = passed ? 'Last submit passed' : `Last submit: ${failedCount} of ${checks.length} checks failed`
    return (
      <span className={`rail-result ${passed ? 'rail-result-pass' : 'rail-result-fail'}`} title={text}>
        {passed ? <CircleCheck size={18} aria-hidden="true" /> : <CircleX size={18} aria-hidden="true" />}
        <span className="visually-hidden">{text}</span>
      </span>
    )
  }
  return null
}

/**
 * The editor side, collapsed to a strip so the lesson can use the full width while Sean codes
 * in VS Code. Run and Submit stay one click away and open the editor side to show the result.
 */
export function EditorRail({
  panelId,
  showRunButtons,
  busy,
  run,
  linkedPath,
  onExpand,
  onRun,
  onSubmit,
  copyButton,
}: Props) {
  return (
    <aside className="editor-rail" aria-label="Editor (hidden)" data-testid="editor-rail">
      <button type="button" className="rail-button" onClick={onExpand} aria-expanded={false} aria-controls={panelId}>
        <PanelRightOpen size={20} aria-hidden="true" />
        <span>Show editor</span>
      </button>
      {showRunButtons && (
        <>
          <button type="button" className="rail-button rail-run" onClick={onRun} disabled={busy}>
            <Play size={18} aria-hidden="true" />
            <span>Run</span>
          </button>
          <button type="button" className="rail-button rail-submit" onClick={onSubmit} disabled={busy}>
            <Send size={18} aria-hidden="true" />
            <span>Submit</span>
          </button>
        </>
      )}
      {copyButton}
      <LastResult run={run} />
      {linkedPath && (
        <span className="rail-linked" title={`Editing ${linkedPath} in VS Code`}>
          <FileCode size={18} aria-hidden="true" />
          <span className="visually-hidden">Editing {linkedPath} in VS Code</span>
        </span>
      )}
    </aside>
  )
}
