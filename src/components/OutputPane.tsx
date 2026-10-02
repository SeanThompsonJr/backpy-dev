import { CircleAlert, CircleCheck, CircleX, LoaderCircle, RotateCcw, TimerOff } from 'lucide-react'
import type { Grade } from '../../shared/grade'
import type { OutputChunk, PythonStatus } from '../runtime/python-client'
import { OUTPUT_LIMIT } from '../runtime/python-protocol'

export type RunPhase = 'idle' | 'running' | 'finished' | 'error' | 'timeout' | 'unavailable' | 'reset' | 'graded'

export interface RunState {
  phase: RunPhase
  /** Run shows output; Submit checks the code against the hidden tests */
  mode?: 'run' | 'submit'
  chunks: OutputChunk[]
  truncated?: boolean
  seconds?: number
  timeoutSeconds?: number
  /** Why a timeout happened: the code kept running, or Python never finished downloading */
  timeoutDuring?: 'loading' | 'running'
  message?: string
  grade?: Grade
  /** e.g. "Hint 1 is unlocked." after a failed submit */
  unlocked?: string
}

export const IDLE: RunState = { phase: 'idle', chunks: [] }

const undoKey = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform) ? 'Cmd+Z' : 'Ctrl+Z'

const formatSeconds = (s = 0) => (s < 0.01 ? 'under 0.01 s' : `${s < 1 ? s.toFixed(2) : s.toFixed(1)} s`)

/** Appends output, merging with the previous chunk when it's the same stream. */
export function appendChunk(state: RunState, chunk: OutputChunk): RunState {
  const last = state.chunks[state.chunks.length - 1]
  const chunks =
    last && last.stream === chunk.stream
      ? [...state.chunks.slice(0, -1), { stream: chunk.stream, text: last.text + chunk.text }]
      : [...state.chunks, chunk]
  return { ...state, chunks }
}

function Summary({ state, python }: { state: RunState; python: PythonStatus }) {
  switch (state.phase) {
    case 'idle':
    case 'graded':
      return null
    case 'running':
      return (
        <p className="run-summary">
          <LoaderCircle size={16} className="spin" aria-hidden="true" />
          {python === 'loading' || python === 'restarting'
            ? 'Loading Python. The first load downloads about 13 MB, so it takes a few seconds.'
            : state.mode === 'submit'
              ? 'Checking your code…'
              : 'Running…'}
        </p>
      )
    case 'finished':
      return (
        <p className="run-summary run-summary-ok">
          <CircleCheck size={16} aria-hidden="true" />
          Ran in {formatSeconds(state.seconds)}.
        </p>
      )
    case 'error':
      return (
        <p className="run-summary run-summary-error">
          <CircleAlert size={16} aria-hidden="true" />
          Stopped by an error. The last line of the traceback says what went wrong.
        </p>
      )
    case 'timeout': {
      const notCounted = state.mode === 'submit' ? " This didn't count as a failed submit." : ''
      return (
        <p className="run-summary run-summary-error" data-testid="timeout-message">
          <TimerOff size={16} aria-hidden="true" />
          {state.timeoutDuring === 'loading'
            ? `Timed out: Python couldn't finish downloading, so your code never started. Check your internet connection, then try again.${notCounted}`
            : `Timed out after ${state.timeoutSeconds} seconds: your code was still running. It may be stuck in a loop that never ends, or waiting on a network request that never finished. Python was restarted and your code is untouched.${notCounted}`}
        </p>
      )
    }
    case 'unavailable':
      return (
        <p className="run-summary run-summary-error">
          <CircleAlert size={16} aria-hidden="true" />
          Python couldn't load ({state.message}). Check your connection, then reload the page.
        </p>
      )
    case 'reset':
      return (
        <p className="run-summary">
          <RotateCcw size={16} aria-hidden="true" />
          Back to the starter code. Press {undoKey} in the editor to undo.
        </p>
      )
  }
}

interface GradeViewProps {
  grade: Grade
  unlocked?: string
  bugDescription?: string
  onShowHint?: () => void
}

function GradeView({ grade, unlocked, bugDescription, onShowHint }: GradeViewProps) {
  const total = grade.checks.length
  return (
    <div className="grade" data-testid="grade" data-passed={grade.passed}>
      <p className={`grade-title ${grade.passed ? 'grade-title-pass' : 'grade-title-fail'}`}>
        {grade.passed ? <CircleCheck size={18} aria-hidden="true" /> : <CircleX size={18} aria-hidden="true" />}
        {grade.loadError
          ? "Your code couldn't load, so no checks ran."
          : grade.passed
            ? `All ${total} check${total === 1 ? '' : 's'} passed.`
            : `${grade.failedCount} of ${total} check${total === 1 ? '' : 's'} failed.`}
      </p>

      {grade.checks.length > 0 && (
        <ul className="check-list" aria-label="Checks">
          {grade.checks.map((c) => (
            <li key={c.name} className={c.passed ? 'check-pass' : 'check-fail'}>
              {c.passed ? <CircleCheck size={15} aria-hidden="true" /> : <CircleX size={15} aria-hidden="true" />}
              <span className="visually-hidden">{c.passed ? 'Passed: ' : 'Failed: '}</span>
              {c.label}
            </li>
          ))}
        </ul>
      )}

      {grade.loadError && <pre className="output-text output-stderr">{grade.loadError}</pre>}

      {grade.firstFailure && (
        <div className="rethink" data-testid="rethink">
          <p className="rethink-label">
            {grade.firstFailure.kind === 'assertion' ? 'Think about this' : 'Your code raised an error in this check'}:{' '}
            <span className="rethink-check">{grade.firstFailure.label}</span>
          </p>
          {grade.firstFailure.kind === 'assertion' && <p className="rethink-message">{grade.firstFailure.message}</p>}
          {grade.firstFailure.traceback ? (
            <pre className="output-text output-stderr">{grade.firstFailure.traceback}</pre>
          ) : (
            grade.firstFailure.kind !== 'assertion' && <pre className="output-text output-stderr">{grade.firstFailure.message}</pre>
          )}
        </div>
      )}

      {unlocked && (
        <p className="unlock-note">
          {unlocked}{' '}
          {onShowHint && (
            <button type="button" className="link-button" onClick={onShowHint}>
              {unlocked.startsWith('Hint 1') ? 'Show hint 1' : 'Show hint 2'}
            </button>
          )}
        </p>
      )}

      {grade.passed && bugDescription && (
        <div className="bug-reveal" data-testid="bug-reveal">
          <p className="bug-reveal-label">What the bug was</p>
          <p>{bugDescription}</p>
        </div>
      )}

      {grade.output && (
        <>
          <p className="output-note">Printed while your code loaded:</p>
          <pre className="output-text">{grade.output}</pre>
        </>
      )}
    </div>
  )
}

interface Props {
  state: RunState
  python: PythonStatus
  bugDescription?: string
  onShowHint?: () => void
}

export function OutputPane({ state, python, bugDescription, onShowHint }: Props) {
  const hasOutput = state.chunks.some((c) => c.text.length > 0)
  const done = state.phase === 'finished' || state.phase === 'error'
  return (
    <section className="output-pane" aria-label="Output" data-testid="output" data-phase={state.phase}>
      {state.phase === 'idle' && (
        <p className="output-empty">Run shows what your code prints. Submit checks it against the exercise.</p>
      )}
      {hasOutput && (
        <pre className="output-text" data-testid="output-text">
          {state.chunks.map((c, i) => (
            <span key={i} className={c.stream === 'stderr' ? 'output-stderr' : undefined}>
              {c.text}
            </span>
          ))}
        </pre>
      )}
      {done && !hasOutput && <p className="output-empty">Your code didn't print anything.</p>}
      {state.truncated && (
        <p className="output-note">Output was cut off after {OUTPUT_LIMIT.toLocaleString()} characters.</p>
      )}
      <div aria-live="polite" data-testid="run-summary">
        <Summary state={state} python={python} />
        {state.phase === 'graded' && state.grade && (
          <GradeView grade={state.grade} unlocked={state.unlocked} bugDescription={bugDescription} onShowHint={onShowHint} />
        )}
      </div>
    </section>
  )
}
