import { useId, useRef, useState, type KeyboardEvent } from 'react'
import { Bug, Code, Database, Terminal, type LucideIcon } from 'lucide-react'
import type { ExerciseType } from '../../shared/schema'
import type { Exercise } from '../../shared/lesson-parse'
import { CodeEditor } from './CodeEditor'
import { Markdown } from './Markdown'

export const TYPE_LABEL: Record<ExerciseType, string> = {
  code: 'Code',
  bug_hunt: 'Bug hunt',
  sql: 'SQL',
  local: 'On your machine',
}
export const TYPE_ICON: Record<ExerciseType, LucideIcon> = { code: Code, bug_hunt: Bug, sql: Database, local: Terminal }

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

function CodeExercise({ exercise, code, onChange }: { exercise: Exercise; code: string; onChange: (v: string) => void }) {
  const language = exercise.meta.type === 'sql' ? 'sql' : 'python'
  return (
    <>
      <div className="editor-frame">
        <CodeEditor
          value={code}
          language={language}
          label={`${language === 'sql' ? 'SQL' : 'Python'} editor: ${exercise.meta.title}`}
          onChange={onChange}
        />
      </div>
      <div className="work-toolbar">
        <p className="editor-help">Esc then Tab moves focus out of the editor.</p>
      </div>
      <section className="output-pane" aria-label="Output" data-testid="output">
        <p className="output-empty">Output appears here when you run your code.</p>
      </section>
    </>
  )
}

interface Props {
  exercises: Exercise[]
  selected: number
  onSelect: (index: number) => void
}

export function ExercisePanel({ exercises, selected, onSelect }: Props) {
  const [code, setCode] = useState<Record<string, string>>(() =>
    Object.fromEntries(exercises.map((e) => [e.folder, e.starter ?? ''])),
  )
  const [checks, setChecks] = useState<Record<string, boolean[]>>({})
  const tabs = useRef<(HTMLButtonElement | null)[]>([])
  const baseId = useId()
  const exercise = exercises[selected]

  const onTabKey = (e: KeyboardEvent) => {
    const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
    if (!step) return
    e.preventDefault()
    const next = (selected + step + exercises.length) % exercises.length
    onSelect(next)
    tabs.current[next]?.focus()
  }

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
        {/* On narrow screens the lesson text is far above, so the scenario sits here instead. */}
        <div className="exercise-brief-inline" data-testid="exercise-brief-inline">
          <h2>{exercise.meta.title}</h2>
          <Markdown className="prose prose-compact">{exercise.instructions ?? ''}</Markdown>
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
          />
        )}
      </div>
    </section>
  )
}
