import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { Bug, CircleCheck, Code, Database, Play, RotateCcw, Send, Terminal, type LucideIcon } from 'lucide-react'
import { gradeTestRun } from '../../shared/grade'
import type { ExerciseType } from '../../shared/schema'
import type { Exercise } from '../../shared/lesson-parse'
import { python, type PythonStatus } from '../runtime/python-client'
import { usePythonStatus } from '../runtime/usePythonStatus'
import { CodeEditor } from './CodeEditor'
import { NEW_PROGRESS, type ExerciseProgress } from './learning'
import { Markdown } from './Markdown'
import { appendChunk, IDLE, OutputPane, type RunState } from './OutputPane'
import { StuckPanel } from './StuckPanel'

export const TYPE_LABEL: Record<ExerciseType, string> = {
  code: 'Code',
  bug_hunt: 'Bug hunt',
  sql: 'SQL',
  local: 'On your machine',
}
export const TYPE_ICON: Record<ExerciseType, LucideIcon> = { code: Code, bug_hunt: Bug, sql: Database, local: Terminal }

const isPythonExercise = (e: Exercise) => e.meta.type === 'code' || e.meta.type === 'bug_hunt'
const runShortcut = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform) ? 'Cmd+Enter' : 'Ctrl+Enter'

function Checklist({ items, done, onChange }: { items: string[]; done: boolean[]; onChange: (done: boolean[]) => void }) {
  return (
    <fieldset className="checklist">
      <legend>Done when</legend>
      {items.map((item, i) => (
        <label key={i} className="checklist-item">
          <input
            type="checkbox"
            checked={done[i] ?? false}
            onChange={(e) => onChange(Object.assign([...done], { [i]: e.target.checked }))}
          />
          <span>{item}</span>
        </label>
      ))}
    </fieldset>
  )
}

const PYTHON_STATUS_TEXT: Partial<Record<PythonStatus, string>> = {
  loading: 'Loading Python…',
  restarting: 'Restarting Python…',
  failed: "Python didn't load",
}

interface CodeExerciseProps {
  exercise: Exercise
  code: string
  onChange: (value: string) => void
  run: RunState
  onRun: () => void
  onSubmit: () => void
  onReset: () => void
  onShowHint: () => void
  solved: boolean
}

function CodeExercise({ exercise, code, onChange, run, onRun, onSubmit, onReset, onShowHint, solved }: CodeExerciseProps) {
  const isPython = isPythonExercise(exercise)
  const pythonStatus = usePythonStatus()
  const busy = pythonStatus === 'running'
  const unavailable = pythonStatus === 'failed'
  return (
    <>
      <div className="editor-frame">
        <CodeEditor
          value={code}
          language={isPython ? 'python' : 'sql'}
          label={`${isPython ? 'Python' : 'SQL'} editor: ${exercise.meta.title}`}
          onChange={onChange}
          onRun={isPython ? () => !busy && !unavailable && onRun() : undefined}
        />
      </div>
      <div className="work-toolbar">
        {isPython && (
          <>
            <button type="button" className="btn btn-run" onClick={onRun} disabled={busy || unavailable}>
              <Play size={16} aria-hidden="true" />
              Run
            </button>
            <button type="button" className="btn btn-submit" onClick={onSubmit} disabled={busy || unavailable}>
              {solved ? <CircleCheck size={16} aria-hidden="true" /> : <Send size={16} aria-hidden="true" />}
              Submit
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onReset}
              disabled={busy || code === (exercise.starter ?? '')}
            >
              <RotateCcw size={16} aria-hidden="true" />
              Reset
            </button>
            <p className="python-status" role="status">
              {PYTHON_STATUS_TEXT[pythonStatus]}
            </p>
          </>
        )}
        <p className="editor-help">
          {isPython && `${runShortcut} runs your code. `}Esc then Tab leaves the editor.
        </p>
      </div>
      {isPython ? (
        <OutputPane
          state={run}
          python={pythonStatus}
          bugDescription={exercise.meta.type === 'bug_hunt' ? exercise.meta.bug_description : undefined}
          onShowHint={onShowHint}
        />
      ) : (
        <section className="output-pane" aria-label="Output" data-testid="output">
          <p className="output-empty">Output appears here when you run your code.</p>
        </section>
      )}
    </>
  )
}

interface Props {
  exercises: Exercise[]
  selected: number
  onSelect: (index: number) => void
  progress: Record<string, ExerciseProgress>
  /** Called after each Submit; returns what the result unlocked, if anything */
  onSubmitted: (folder: string, passed: boolean) => string | undefined
  onShowHint: (folder: string, hint: 1 | 2) => void
  onShowSolution: (folder: string) => void
}

export function ExercisePanel({ exercises, selected, onSelect, progress, onSubmitted, onShowHint, onShowSolution }: Props) {
  const [code, setCode] = useState<Record<string, string>>(() =>
    Object.fromEntries(exercises.map((e) => [e.folder, e.starter ?? ''])),
  )
  const [checks, setChecks] = useState<Record<string, boolean[]>>({})
  const [runs, setRuns] = useState<Record<string, RunState>>({})
  const tabs = useRef<(HTMLButtonElement | null)[]>([])
  const baseId = useId()
  const exercise = exercises[selected]
  const progressOf = (ex: Exercise) => progress[ex.folder] ?? NEW_PROGRESS

  // Start loading Python as soon as a lesson with Python exercises opens.
  useEffect(() => {
    if (exercises.some(isPythonExercise)) python.warmUp()
  }, [exercises])

  const updateRun = (folder: string, update: (state: RunState) => RunState) =>
    setRuns((r) => ({ ...r, [folder]: update(r[folder] ?? IDLE) }))

  const runCode = async (ex: Exercise) => {
    if (ex.meta.type !== 'code' && ex.meta.type !== 'bug_hunt') return
    const { folder } = ex
    const timeoutSeconds = ex.meta.timeout_seconds
    updateRun(folder, () => ({ phase: 'running', mode: 'run', chunks: [], timeoutSeconds }))
    const outcome = await python.run(code[folder], {
      packages: ex.meta.packages,
      timeoutSeconds,
      onOutput: (chunk) => updateRun(folder, (s) => appendChunk(s, chunk)),
      onTruncated: () => updateRun(folder, (s) => ({ ...s, truncated: true })),
    })
    updateRun(folder, (s) => {
      if (outcome.kind === 'finished') {
        const withError = outcome.error ? appendChunk(s, { stream: 'stderr', text: outcome.error + '\n' }) : s
        return { ...withError, phase: outcome.ok ? 'finished' : 'error', seconds: outcome.seconds }
      }
      if (outcome.kind === 'timeout') return { ...s, phase: 'timeout', timeoutDuring: outcome.during, seconds: outcome.seconds }
      if (outcome.kind === 'unavailable') return { ...s, phase: 'unavailable', message: outcome.message }
      return s
    })
  }

  const submitCode = async (ex: Exercise) => {
    if (ex.meta.type !== 'code' && ex.meta.type !== 'bug_hunt') return
    const { folder } = ex
    const timeoutSeconds = ex.meta.timeout_seconds
    updateRun(folder, () => ({ phase: 'running', mode: 'submit', chunks: [], timeoutSeconds }))
    const outcome = await python.test(code[folder], ex.tests ?? '', { packages: ex.meta.packages, timeoutSeconds })
    if (outcome.kind === 'unavailable') {
      updateRun(folder, (s) => ({ ...s, phase: 'unavailable', message: outcome.message }))
      return
    }
    if (outcome.kind === 'finished') {
      // The worker failed before any checks could run (e.g. a package didn't load).
      updateRun(folder, (s) => ({ ...appendChunk(s, { stream: 'stderr', text: (outcome.error ?? '') + '\n' }), phase: 'error' }))
      return
    }
    if (outcome.kind === 'timeout') {
      // A timeout says nothing about whether the code is right, so it isn't a failed submit.
      updateRun(folder, (s) => ({ ...s, phase: 'timeout', mode: 'submit', timeoutDuring: outcome.during }))
      return
    }
    const grade = gradeTestRun(outcome.result)
    const unlocked = onSubmitted(folder, grade.passed)
    updateRun(folder, (s) => ({ ...s, phase: 'graded', mode: 'submit', grade, unlocked }))
  }

  const resetCode = (ex: Exercise) => {
    setCode((c) => ({ ...c, [ex.folder]: ex.starter ?? '' }))
    updateRun(ex.folder, () => ({ phase: 'reset', chunks: [] }))
  }

  const onTabKey = (e: KeyboardEvent) => {
    const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
    if (!step) return
    e.preventDefault()
    const next = (selected + step + exercises.length) % exercises.length
    onSelect(next)
    tabs.current[next]?.focus()
  }

  const current = progressOf(exercise)
  const run = runs[exercise.folder] ?? IDLE

  return (
    <section className="work-pane" aria-label="Exercises">
      {exercises.length > 1 && (
        <div role="tablist" aria-label="Exercises" className="exercise-tabs" onKeyDown={onTabKey}>
          {exercises.map((ex, i) => (
            <button
              key={ex.folder}
              ref={(el) => {
                tabs.current[i] = el
              }}
              role="tab"
              type="button"
              id={`${baseId}-tab-${i}`}
              aria-selected={i === selected}
              aria-controls={`${baseId}-panel`}
              tabIndex={i === selected ? 0 : -1}
              className="exercise-tab"
              onClick={() => onSelect(i)}
            >
              <span className="exercise-tab-num">{i + 1}</span>
              {TYPE_LABEL[ex.meta.type]}
              {progressOf(ex).solved && (
                <>
                  <CircleCheck size={14} className="exercise-tab-solved" aria-hidden="true" />
                  <span className="visually-hidden"> (solved)</span>
                </>
              )}
            </button>
          ))}
        </div>
      )}
      <div
        role={exercises.length > 1 ? 'tabpanel' : undefined}
        id={`${baseId}-panel`}
        aria-labelledby={exercises.length > 1 ? `${baseId}-tab-${selected}` : undefined}
        className="exercise-panel"
        data-testid="exercise-panel"
        data-type={exercise.meta.type}
      >
        {/* On narrow screens the lesson text is far above, so the scenario and hints sit here instead. */}
        <div className="exercise-brief-inline" data-testid="exercise-brief-inline">
          <h2>{exercise.meta.title}</h2>
          <Markdown className="prose prose-compact prose-instructions">{exercise.instructions ?? ''}</Markdown>
          <StuckPanel
            exercise={exercise}
            progress={current}
            onShowHint={(n) => onShowHint(exercise.folder, n)}
            onShowSolution={() => onShowSolution(exercise.folder)}
          />
        </div>
        {exercise.meta.type === 'local' ? (
          <div className="local-exercise">
            <Checklist
              items={exercise.meta.checklist}
              done={checks[exercise.folder] ?? []}
              onChange={(done) => setChecks((c) => ({ ...c, [exercise.folder]: done }))}
            />
          </div>
        ) : (
          <CodeExercise
            key={exercise.folder}
            exercise={exercise}
            code={code[exercise.folder]}
            onChange={(v) => setCode((c) => ({ ...c, [exercise.folder]: v }))}
            run={run}
            onRun={() => runCode(exercise)}
            onSubmit={() => submitCode(exercise)}
            onReset={() => resetCode(exercise)}
            onShowHint={() => onShowHint(exercise.folder, current.failedSubmits >= 2 ? 2 : 1)}
            solved={current.solved}
          />
        )}
      </div>
    </section>
  )
}
