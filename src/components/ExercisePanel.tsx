import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import {
  Bug,
  CircleCheck,
  Code,
  Database,
  FileCode,
  PanelRightClose,
  Play,
  RotateCcw,
  Send,
  Terminal,
  type LucideIcon,
} from 'lucide-react'
import { gradeTestRun } from '../../shared/grade'
import type { ExerciseType } from '../../shared/schema'
import type { Exercise } from '../../shared/lesson-parse'
import { python, type PythonStatus } from '../runtime/python-client'
import { progress as progressStore } from '../progress/store'
import { gradeSql } from '../../shared/sql-runner'
import { sqlRunner, type SqlStatus } from '../runtime/sql-client'
import { useSqlStatus } from '../runtime/useSqlStatus'
import { usePythonStatus } from '../runtime/usePythonStatus'
import {
  changeFolder,
  linkExercise,
  openInVsCode,
  readIfChanged,
  saveFolderPath,
  savedFolderPath,
  vscodeFileUrl,
  vscodeSyncSupported,
  writeFile,
} from '../runtime/vscode-folder'
import { EditorRail } from './EditorRail'
import { CopyToClaude } from './CopyToClaude'
import { buildClaudePrompt, lastErrorText, type PromptInput } from './claude-prompt'
import { VsCodeBanner, type SyncedFile } from './VsCodeBanner'
import { CodeEditor } from './CodeEditor'
import { NEW_PROGRESS, type ExerciseProgress } from './learning'
import { Markdown } from './Markdown'
import { appendChunk, IDLE, OutputPane, type RunState, type Runtime } from './OutputPane'
import { StuckPanel } from './StuckPanel'

export const TYPE_LABEL: Record<ExerciseType, string> = {
  code: 'Code',
  bug_hunt: 'Bug hunt',
  sql: 'SQL',
  local: 'On your machine',
}
export const TYPE_ICON: Record<ExerciseType, LucideIcon> = { code: Code, bug_hunt: Bug, sql: Database, local: Terminal }

const isPythonExercise = (e: Exercise) => e.meta.type === 'code' || e.meta.type === 'bug_hunt'
const runShortcut =
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform) ? 'Cmd+Enter' : 'Ctrl+Enter'

function Checklist({
  items,
  done,
  onChange,
}: {
  items: string[]
  done: boolean[]
  onChange: (done: boolean[]) => void
}) {
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

const STATUS_TEXT: Record<Runtime, Partial<Record<PythonStatus | SqlStatus, string>>> = {
  python: { loading: 'Loading Python…', restarting: 'Restarting Python…', failed: "Python didn't load" },
  sql: { loading: 'Loading Postgres…', restarting: 'Restarting Postgres…', failed: "Postgres didn't load" },
}

/** Which runtime an exercise runs on, or undefined for exercises done on Sean's machine. */
const runtimeOf = (e: Exercise): Runtime | undefined =>
  e.meta.type === 'sql' ? 'sql' : e.meta.type === 'local' ? undefined : 'python'

/** The current status of the runtime an exercise uses. */
function useRuntimeStatus(runtime: Runtime | undefined) {
  const pythonStatus = usePythonStatus()
  const sqlStatus = useSqlStatus()
  return runtime === 'sql' ? sqlStatus : pythonStatus
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
  /** Set while this exercise is being edited in VS Code */
  link?: SyncedFile
  vscodeError?: string
  folderPath?: string
  onStartSync: () => void
  onStopSync: () => void
  onSavePath: (pasted: string) => string | undefined
  onOpenInVsCode: () => void
  onChangeFolder: () => void
}

function CodeExercise(props: CodeExerciseProps) {
  const { exercise, code, onChange, run, onRun, onSubmit, onReset, onShowHint, solved, link, vscodeError } = props
  const runtime = runtimeOf(exercise) ?? 'python'
  const isPython = runtime === 'python'
  const status = useRuntimeStatus(runtime)
  const busy = status === 'running'
  const unavailable = status === 'failed'
  return (
    <>
      {link && (
        <VsCodeBanner
          link={link}
          folderPath={props.folderPath}
          onSavePath={props.onSavePath}
          onOpen={props.onOpenInVsCode}
          onChangeFolder={props.onChangeFolder}
          onStop={props.onStopSync}
        />
      )}
      <div className="editor-frame">
        <CodeEditor
          value={code}
          language={isPython ? 'python' : 'sql'}
          label={`${isPython ? 'Python' : 'SQL'} editor: ${exercise.meta.title}${link ? ' (read-only while editing in VS Code)' : ''}`}
          onChange={onChange}
          onRun={() => !busy && !unavailable && onRun()}
          readOnly={!!link}
        />
      </div>
      <div className="work-toolbar">
        {
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
            {!link &&
              (vscodeSyncSupported() ? (
                <button type="button" className="btn btn-ghost" onClick={props.onStartSync} disabled={busy}>
                  <FileCode size={16} aria-hidden="true" />
                  Edit in VS Code
                </button>
              ) : (
                <p className="vscode-unsupported">Editing in VS Code needs Chrome or Edge on a computer.</p>
              ))}
            <p className="runtime-status" role="status">
              {STATUS_TEXT[runtime][status]}
            </p>
          </>
        }
        {vscodeError && (
          <p className="vscode-banner-error" role="alert">
            {vscodeError}
          </p>
        )}
        <p className="editor-help">{runShortcut} runs your code. Esc then Tab leaves the editor.</p>
      </div>
      <OutputPane
        state={run}
        runtime={runtime}
        status={status}
        bugDescription={exercise.meta.type === 'bug_hunt' ? exercise.meta.bug_description : undefined}
        onShowHint={onShowHint}
      />
    </>
  )
}

interface Props {
  /** Lesson folder name, used for the VS Code sync path */
  lessonFolder: string
  /** Where this lesson's progress is saved (the lesson id) */
  lessonKey: string
  /** What Copy to Claude says about the lesson; the panel adds the exercise, code and last error */
  promptBase: Omit<PromptInput, 'exercise' | 'lastError' | 'explainBack'>
  /** The editor side is hidden to a rail, so the lesson can use the full width */
  collapsed: boolean
  onCollapsedChange: (collapsed: boolean) => void
  exercises: Exercise[]
  selected: number
  onSelect: (index: number) => void
  progress: Record<string, ExerciseProgress>
  /** Called after each Submit; returns what the result unlocked, if anything */
  onSubmitted: (folder: string, passed: boolean) => string | undefined
  onShowHint: (folder: string, hint: 1 | 2) => void
  onShowSolution: (folder: string) => void
}

export function ExercisePanel(props: Props) {
  const {
    lessonFolder,
    lessonKey,
    promptBase,
    collapsed,
    onCollapsedChange,
    exercises,
    selected,
    onSelect,
    progress,
    onSubmitted,
    onShowHint,
    onShowSolution,
  } = props
  const openStatus = useRuntimeStatus(runtimeOf(exercises[selected]))
  // Code and checklist ticks start from what was saved last time, if anything.
  const saved = () => progressStore.lesson(lessonKey)?.exercises ?? {}
  const [code, setCode] = useState<Record<string, string>>(() =>
    Object.fromEntries(exercises.map((e) => [e.folder, saved()[e.folder]?.code ?? e.starter ?? ''])),
  )
  const [checks, setChecks] = useState<Record<string, boolean[]>>(() =>
    Object.fromEntries(exercises.map((e) => [e.folder, saved()[e.folder]?.checklist ?? []])),
  )

  // Save code and ticks whenever they change, however they changed (typing, Reset, VS Code).
  // Nothing is written for an exercise Sean hasn't touched.
  useEffect(() => {
    for (const e of exercises) {
      const stored = saved()[e.folder]
      const current = code[e.folder]
      if (current !== (stored?.code ?? e.starter ?? '')) {
        progressStore.updateExercise(lessonKey, e.folder, (x) => ({ ...x, code: current }))
      }
      const ticks = checks[e.folder] ?? []
      if (JSON.stringify(ticks) !== JSON.stringify(stored?.checklist ?? [])) {
        progressStore.updateExercise(lessonKey, e.folder, (x) => ({ ...x, checklist: ticks }))
      }
    }
  }, [code, checks])
  const [runs, setRuns] = useState<Record<string, RunState>>({})
  const [links, setLinks] = useState<Record<string, SyncedFile>>({})
  const linksRef = useRef(links)
  const [vscodeErrors, setVscodeErrors] = useState<Record<string, string>>({})
  const [folderPath, setFolderPath] = useState(savedFolderPath)
  // File reads and writes run one at a time, so a save check can't overlap a Reset.
  const fileQueue = useRef<Promise<unknown>>(Promise.resolve())
  const oneAtATime = <T,>(task: () => Promise<T>): Promise<T> => {
    const result = fileQueue.current.then(task, task)
    fileQueue.current = result.catch(() => {})
    return result
  }
  const tabs = useRef<(HTMLButtonElement | null)[]>([])
  const baseId = useId()
  const exercise = exercises[selected]
  const progressOf = (ex: Exercise) => progress[ex.folder] ?? NEW_PROGRESS

  // Start loading Python as soon as a lesson with Python exercises opens.
  useEffect(() => {
    if (exercises.some(isPythonExercise)) python.warmUp()
    if (exercises.some((e) => e.meta.type === 'sql')) sqlRunner.warmUp()
  }, [exercises])

  const updateRun = (folder: string, update: (state: RunState) => RunState) =>
    setRuns((r) => ({ ...r, [folder]: update(r[folder] ?? IDLE) }))

  /** Changes or (with undefined) removes an exercise's VS Code link. linksRef stays current for polling. */
  const updateLink = (folder: string, change: (link: SyncedFile) => SyncedFile | undefined) => {
    const current = linksRef.current[folder]
    if (!current) return
    const next = { ...linksRef.current }
    const changed = change(current)
    if (changed) next[folder] = changed
    else delete next[folder]
    linksRef.current = next
    setLinks(next)
  }

  /** Reads the linked file if it changed since last time. Returns the new code, if any. */
  const syncNow = (folder: string): Promise<string | undefined> => oneAtATime(() => readSaved(folder))

  const readSaved = async (folder: string): Promise<string | undefined> => {
    const link = linksRef.current[folder]
    if (!link) return undefined
    try {
      const text = await readIfChanged(link)
      if (text === undefined) return undefined
      updateLink(folder, (l) => ({ ...l, lastText: text, updatedAt: new Date(), error: undefined }))
      setCode((c) => ({ ...c, [folder]: text }))
      return text
    } catch {
      updateLink(folder, (l) => ({
        ...l,
        error: `${l.path} was deleted or moved. Press Stop, then Edit in VS Code to create it again.`,
      }))
      return undefined
    }
  }

  // While the open exercise is linked, check its file for saves a little more than once a second.
  const openFolder = exercises[selected].folder
  const openIsLinked = !!links[openFolder]
  useEffect(() => {
    if (!openIsLinked) return
    const timer = setInterval(() => void syncNow(openFolder), 800)
    return () => clearInterval(timer)
  }, [openFolder, openIsLinked])

  const openFile = (path: string, file: SyncedFile) => openInVsCode(vscodeFileUrl(path, file.path))

  const startSync = async (ex: Exercise) => {
    setVscodeErrors((e) => ({ ...e, [ex.folder]: '' }))
    try {
      const fileName = ex.meta.type === 'sql' ? 'main.sql' : 'main.py'
      const { file, text } = await linkExercise(lessonFolder, ex.folder, fileName, code[ex.folder])
      linksRef.current = { ...linksRef.current, [ex.folder]: file }
      setLinks(linksRef.current)
      setCode((c) => ({ ...c, [ex.folder]: text }))
      // Picking a new folder forgets the old path, so read it again before opening VS Code.
      const path = savedFolderPath()
      setFolderPath(path)
      if (path) openFile(path, file)
    } catch (error) {
      if ((error as DOMException).name === 'AbortError') return // the folder picker was closed
      setVscodeErrors((e) => ({ ...e, [ex.folder]: `Couldn't set up VS Code editing: ${(error as Error).message}` }))
    }
  }
  const stopSync = (ex: Exercise) => updateLink(ex.folder, () => undefined)

  const savePath = (ex: Exercise, pasted: string) => {
    const link = linksRef.current[ex.folder]
    if (!link) return undefined
    const error = saveFolderPath(pasted, link.folderName)
    if (!error) setFolderPath(savedFolderPath())
    return error
  }

  const openExerciseInVsCode = (ex: Exercise) => {
    const link = linksRef.current[ex.folder]
    const path = savedFolderPath()
    if (link && path) openFile(path, link)
  }

  /** Picks a different folder: every link in this lesson stops, and this exercise moves to the new folder. */
  const changeFolderFor = async (ex: Exercise) => {
    try {
      await changeFolder()
    } catch (error) {
      if ((error as DOMException).name === 'AbortError') return
      setVscodeErrors((e) => ({ ...e, [ex.folder]: `Couldn't change the folder: ${(error as Error).message}` }))
      return
    }
    linksRef.current = {}
    setLinks({})
    setFolderPath(undefined)
    await startSync(ex)
  }

  const runSqlExercise = async (ex: Exercise, mode: 'run' | 'submit') => {
    if (ex.meta.type !== 'sql') return
    const { folder } = ex
    const timeoutSeconds = ex.meta.timeout_seconds
    updateRun(folder, () => ({ phase: 'running', mode, chunks: [], timeoutSeconds }))
    const source = (await syncNow(folder)) ?? code[folder]
    const seed = ex.seed ?? ''
    const outcome =
      mode === 'run'
        ? await sqlRunner.run(seed, source, timeoutSeconds)
        : await sqlRunner.grade(seed, source, ex.solution ?? '', timeoutSeconds)
    if (outcome.kind === 'unavailable') {
      updateRun(folder, (s) => ({ ...s, phase: 'unavailable', message: outcome.message }))
    } else if (outcome.kind === 'timeout') {
      updateRun(folder, (s) => ({ ...s, phase: 'timeout', timeoutDuring: outcome.during, seconds: outcome.seconds }))
    } else if (outcome.kind === 'ran') {
      updateRun(folder, (s) => ({
        ...s,
        phase: outcome.outcome.ok ? 'finished' : 'error',
        sql: outcome.outcome,
        seconds: outcome.seconds,
      }))
    } else if (!outcome.expected.ok) {
      // The solution itself failed: a content bug, shown plainly rather than graded.
      updateRun(folder, (s) => ({ ...s, phase: 'error', sql: outcome.expected }))
    } else {
      const grade = gradeSql(outcome.learner, outcome.expected.result, ex.sqlTests?.checks ?? [])
      const unlocked = onSubmitted(folder, grade.passed)
      updateRun(folder, (s) => ({ ...s, phase: 'graded', grade, unlocked }))
    }
  }

  const runCode = async (ex: Exercise) => {
    if (ex.meta.type === 'sql') return runSqlExercise(ex, 'run')
    if (ex.meta.type !== 'code' && ex.meta.type !== 'bug_hunt') return
    const { folder } = ex
    const timeoutSeconds = ex.meta.timeout_seconds
    updateRun(folder, () => ({ phase: 'running', mode: 'run', chunks: [], timeoutSeconds }))
    const source = (await syncNow(folder)) ?? code[folder]
    const outcome = await python.run(source, {
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
      if (outcome.kind === 'timeout')
        return { ...s, phase: 'timeout', timeoutDuring: outcome.during, seconds: outcome.seconds }
      if (outcome.kind === 'unavailable') return { ...s, phase: 'unavailable', message: outcome.message }
      return s
    })
  }

  const submitCode = async (ex: Exercise) => {
    if (ex.meta.type === 'sql') return runSqlExercise(ex, 'submit')
    if (ex.meta.type !== 'code' && ex.meta.type !== 'bug_hunt') return
    const { folder } = ex
    const timeoutSeconds = ex.meta.timeout_seconds
    updateRun(folder, () => ({ phase: 'running', mode: 'submit', chunks: [], timeoutSeconds }))
    const source = (await syncNow(folder)) ?? code[folder]
    const outcome = await python.test(source, ex.tests ?? '', { packages: ex.meta.packages, timeoutSeconds })
    if (outcome.kind === 'unavailable') {
      updateRun(folder, (s) => ({ ...s, phase: 'unavailable', message: outcome.message }))
      return
    }
    if (outcome.kind === 'finished') {
      // The worker failed before any checks could run (e.g. a package didn't load).
      updateRun(folder, (s) => ({
        ...appendChunk(s, { stream: 'stderr', text: (outcome.error ?? '') + '\n' }),
        phase: 'error',
      }))
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

  const resetCode = async (ex: Exercise) => {
    const starter = ex.starter ?? ''
    const link = linksRef.current[ex.folder]
    if (link) {
      // Editing happens in VS Code, so the starter goes into the file too.
      await oneAtATime(async () => {
        await writeFile(link.handle, starter)
        updateLink(ex.folder, (l) => ({ ...l, lastText: starter }))
      })
    }
    setCode((c) => ({ ...c, [ex.folder]: starter }))
    updateRun(ex.folder, () => ({ phase: 'reset', chunks: [], message: link ? link.path : undefined }))
  }

  const onTabKey = (e: KeyboardEvent) => {
    const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
    if (!step) return
    e.preventDefault()
    const next = (selected + step + exercises.length) % exercises.length
    onSelect(next)
    tabs.current[next]?.focus()
  }

  const getPrompt = () => {
    const ex = exercises[selected]
    const stored = progressOf(ex)
    return buildClaudePrompt({
      ...promptBase,
      explainBack: progressStore.lesson(lessonKey)?.explainBack ?? '',
      exercise: {
        title: ex.meta.title,
        type: TYPE_LABEL[ex.meta.type],
        instructions: ex.instructions ?? '',
        language: ex.meta.type === 'sql' ? 'sql' : 'python',
        code: code[ex.folder] ?? '',
        failedSubmits: stored.failedSubmits,
        solved: stored.solved,
      },
      lastError: lastErrorText(runs[ex.folder]),
    })
  }

  const current = progressOf(exercise)
  const run = runs[exercise.folder] ?? IDLE

  const bodyId = `${baseId}-body`
  // Run and Submit from the rail open the editor side, so the result is visible.
  const expandAnd = (action: () => void) => () => {
    onCollapsedChange(false)
    action()
  }

  return (
    <section className="work-pane" aria-label="Exercises" data-collapsed={collapsed}>
      {collapsed && (
        <EditorRail
          panelId={bodyId}
          showRunButtons={runtimeOf(exercise) !== undefined}
          busy={openStatus === 'running' || openStatus === 'failed'}
          run={run}
          linkedPath={links[exercise.folder]?.path}
          onExpand={() => onCollapsedChange(false)}
          onRun={expandAnd(() => runCode(exercise))}
          onSubmit={expandAnd(() => submitCode(exercise))}
          copyButton={<CopyToClaude getPrompt={getPrompt} variant="rail" />}
        />
      )}
      {/* Stays mounted while hidden, so edits, output and VS Code syncing carry on. */}
      <div id={bodyId} className="work-pane-body" hidden={collapsed}>
        <div className="work-head">
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
          <div className="work-head-actions">
            <CopyToClaude getPrompt={getPrompt} />
            <button
              type="button"
              className="btn btn-ghost btn-small hide-editor"
              onClick={() => onCollapsedChange(true)}
              aria-label="Hide editor"
              title="Hide editor"
              aria-expanded={true}
              aria-controls={bodyId}
            >
              <PanelRightClose size={16} aria-hidden="true" />
              <span className="work-head-label">Hide editor</span>
            </button>
          </div>
        </div>
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
              link={links[exercise.folder]}
              vscodeError={vscodeErrors[exercise.folder] || undefined}
              folderPath={folderPath}
              onStartSync={() => startSync(exercise)}
              onStopSync={() => stopSync(exercise)}
              onSavePath={(pasted) => savePath(exercise, pasted)}
              onOpenInVsCode={() => openExerciseInVsCode(exercise)}
              onChangeFolder={() => changeFolderFor(exercise)}
            />
          )}
        </div>
      </div>
    </section>
  )
}
