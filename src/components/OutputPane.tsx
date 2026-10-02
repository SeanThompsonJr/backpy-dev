import { CircleAlert, CircleCheck, LoaderCircle, RotateCcw, TimerOff } from 'lucide-react'
import type { OutputChunk, PythonStatus } from '../runtime/python-client'
import { OUTPUT_LIMIT } from '../runtime/python-protocol'

export type RunPhase = 'idle' | 'running' | 'finished' | 'error' | 'timeout' | 'unavailable' | 'reset'

export interface RunState {
  phase: RunPhase
  chunks: OutputChunk[]
  truncated?: boolean
  seconds?: number
  timeoutSeconds?: number
  message?: string
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
      return null
    case 'running':
      return (
        <p className="run-summary">
          <LoaderCircle size={16} className="spin" aria-hidden="true" />
          {python === 'loading' || python === 'restarting'
            ? 'Loading Python. The first load downloads about 13 MB, so it takes a few seconds.'
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
    case 'timeout':
      return (
        <p className="run-summary run-summary-error">
          <TimerOff size={16} aria-hidden="true" />
          Stopped after {state.timeoutSeconds} seconds because your code was still running. Is there a loop that never
          ends? Python was restarted and your code is untouched.
        </p>
      )
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

export function OutputPane({ state, python }: { state: RunState; python: PythonStatus }) {
  const hasOutput = state.chunks.some((c) => c.text.length > 0)
  const done = state.phase === 'finished' || state.phase === 'error'
  return (
    <section className="output-pane" aria-label="Output" data-testid="output" data-phase={state.phase}>
      {state.phase === 'idle' && <p className="output-empty">Output appears here when you run your code.</p>}
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
      </div>
    </section>
  )
}
