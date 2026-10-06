import { useEffect, useId, useRef, useState } from 'react'
import { Link } from 'react-router'
import { CircleCheck, SearchCheck } from 'lucide-react'
import type { LessonEntry } from '../../shared/content'
import type { UnverifiedClaim } from '../../shared/lesson-parse'
import { curriculum } from '../data/curriculum'
import { ExercisePanel, TYPE_ICON, TYPE_LABEL } from './ExercisePanel'
import { ExplainBack } from './ExplainBack'
import { FinishList } from './FinishList'
import { CopyToClaude } from './CopyToClaude'
import { buildClaudePrompt } from './claude-prompt'
import { describeConcepts } from '../data/concepts'
import { lessonCompletion } from '../progress/completion'
import { progress as progressStore, useProgress } from '../progress/store'
import { LessonQuiz } from './LessonQuiz'
import { afterSubmit, newlyUnlocked, NEW_PROGRESS, type ExerciseProgress } from './learning'
import { StuckPanel } from './StuckPanel'
import { Markdown } from './Markdown'

function showClaim(index: number) {
  const mark = document.getElementById(`claim-${index}`)
  if (!mark) return
  const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  mark.scrollIntoView({ block: 'center', behavior: smooth ? 'smooth' : 'auto' })
  mark.focus({ preventScroll: true })
}

function VerifyNote({ claims }: { claims: UnverifiedClaim[] }) {
  const one = claims.length === 1
  return (
    <aside className="verify-note" aria-label="Claims to verify">
      <SearchCheck size={18} aria-hidden="true" className="verify-note-icon" />
      <div>
        <p>
          <strong>Verify this.</strong> {one ? 'One statement' : `${claims.length} statements`} in this lesson couldn't
          be confirmed against official documentation. {one ? "It's" : "They're"} underlined in the text. Everything
          else was checked.
        </p>
        <ol className="verify-list">
          {claims.map((c, i) => (
            <li key={i} data-testid="claim">
              <q className="verify-quote">{c.quote}</q>
              {c.section && <span className="verify-where"> in {c.section}</span>}
              <p className="verify-check">
                <strong>What to check:</strong> {c.check}
              </p>
              <button type="button" className="link-button" onClick={() => showClaim(i)}>
                Show in lesson
              </button>
            </li>
          ))}
        </ol>
      </div>
    </aside>
  )
}

function Pager({ id }: { id: number }) {
  const prev = curriculum.lessonById.get(id - 1)
  const next = curriculum.lessonById.get(id + 1)
  return (
    <nav className="lesson-pager" aria-label="Lessons">
      {prev ? (
        <Link to={`/lesson/${prev.id}`} className="pager-link" rel="prev">
          <span className="pager-dir">Previous</span>
          {prev.title}
        </Link>
      ) : (
        <span />
      )}
      {next && (
        <Link to={`/lesson/${next.id}`} className="pager-link pager-next" rel="next">
          <span className="pager-dir">Next</span>
          {next.title}
        </Link>
      )}
    </nav>
  )
}

type LeftView = 'lesson' | 'exercise'

// Whether the editor side is hidden is a per-browser preference, remembered across lessons.
const COLLAPSED_KEY = 'backpy.editorCollapsed'
function loadCollapsed() {
  try {
    return localStorage.getItem(COLLAPSED_KEY) === '1'
  } catch {
    return false
  }
}
function saveCollapsed(collapsed: boolean) {
  try {
    localStorage.setItem(COLLAPSED_KEY, collapsed ? '1' : '0')
  } catch {
    // Not remembered; the page still works.
  }
}

export function LessonView({ entry }: { entry: LessonEntry }) {
  const { frontMatter: fm, body, exercises, claims } = entry.lesson
  const isFixture = entry.sectionDir === '_fixtures'
  const planned = curriculum.lessonById.get(fm.id)
  const section = planned && curriculum.sectionByNumber.get(planned.sectionNumber)

  const [selected, setSelected] = useState(0)
  const [leftView, setLeftView] = useState<LeftView>('lesson')
  const [editorCollapsed, setEditorCollapsed] = useState(loadCollapsed)
  const changeCollapsed = (collapsed: boolean) => {
    setEditorCollapsed(collapsed)
    saveCollapsed(collapsed)
  }
  const textPane = useRef<HTMLElement>(null)
  const ids = useId()
  const exercise = exercises[selected]

  // Everything Sean does here is saved (milestone 8). The store is synchronous, so a change is
  // readable straight away, before React re-renders.
  const lessonKey = String(fm.id)
  const saved = useProgress().lessons[lessonKey]
  const progress: Record<string, ExerciseProgress> = saved?.exercises ?? {}
  const explanation = saved?.explainBack ?? ''
  const setExplanation = (explainBack: string) => progressStore.updateLesson(lessonKey, (l) => ({ ...l, explainBack }))
  const progressOf = (folder: string) => progress[folder] ?? NEW_PROGRESS

  // What Copy to Claude says about the lesson itself; ExercisePanel adds code and errors.
  const promptBase = {
    lessonLabel: isFixture ? 'Fixture lesson' : `Lesson ${fm.id} of ${curriculum.lessonCount}, ${section?.name ?? fm.section}`,
    lessonTitle: fm.title,
    concepts: describeConcepts(fm.concepts_introduced),
    conceptText: entry.lesson.sections.find((s) => s.title === 'The concept')?.markdown ?? '',
  }

  const completion = lessonCompletion(entry.lesson, saved)
  useEffect(() => {
    if (completion.done && !saved?.completedAt) {
      progressStore.updateLesson(lessonKey, (l) => ({ ...l, completedAt: new Date().toISOString() }))
    }
  }, [completion.done, saved?.completedAt, lessonKey])

  const showLeft = (view: LeftView) => {
    setLeftView(view)
    textPane.current?.scrollTo({ top: 0 })
  }

  const updateProgress = (folder: string, change: (p: ExerciseProgress) => ExerciseProgress) => {
    const before: ExerciseProgress = progressStore.lesson(lessonKey)?.exercises[folder] ?? NEW_PROGRESS
    const after = change(before)
    progressStore.updateExercise(lessonKey, folder, (stored) => ({ ...stored, ...after }))
    return { before, after }
  }

  const onSubmitted = (folder: string, passed: boolean) => {
    const { before, after } = updateProgress(folder, (p) => afterSubmit(p, passed))
    return passed ? undefined : newlyUnlocked(before, after)
  }

  /** Opens a hint or the solution, then brings it into view wherever it is visible. */
  const reveal = (folder: string, part: string, change: (p: ExerciseProgress) => ExerciseProgress) => {
    updateProgress(folder, change)
    setLeftView('exercise')
    requestAnimationFrame(() => {
      const target = [...document.querySelectorAll<HTMLElement>(`[data-hint="${folder}-${part}"]`)].find(
        (el) => el.offsetParent !== null,
      )
      target?.scrollIntoView({ block: 'nearest' })
      target?.focus({ preventScroll: true })
    })
  }
  const showHint = (folder: string, hint: 1 | 2) =>
    reveal(folder, `hint-${hint}`, (p) => ({ ...p, hintsShown: Math.max(p.hintsShown, hint) }))
  const showSolution = (folder: string) => reveal(folder, 'solution', (p) => ({ ...p, solutionShown: true }))
  const selectExercise = (index: number) => {
    setSelected(index)
    showLeft('exercise')
  }

  const crumb = (
    <p className="crumb">
      <Link to="/">Route</Link> / {section?.name ?? fm.section}
    </p>
  )

  return (
    <div
      className={`lesson-page ${exercises.length ? 'lesson-page-split' : 'lesson-page-single'}${
        exercises.length && editorCollapsed ? ' lesson-page-collapsed' : ''
      }`}
      data-testid="lesson-page"
    >
      <article ref={textPane} className="lesson-text-pane" data-testid="lesson-text" data-view={leftView}>
        {exercise && (
          <div role="tablist" aria-label="Left side shows" className="left-switch">
            <button
              type="button"
              role="tab"
              id={`${ids}-lesson-tab`}
              aria-selected={leftView === 'lesson'}
              aria-controls={`${ids}-lesson`}
              className="left-switch-tab"
              onClick={() => showLeft('lesson')}
            >
              Lesson
            </button>
            <button
              type="button"
              role="tab"
              id={`${ids}-exercise-tab`}
              aria-selected={leftView === 'exercise'}
              aria-controls={`${ids}-exercise`}
              className="left-switch-tab"
              onClick={() => showLeft('exercise')}
            >
              Exercise {selected + 1}: {TYPE_LABEL[exercise.meta.type]}
            </button>
          </div>
        )}

        <div
          id={`${ids}-lesson`}
          role={exercise ? 'tabpanel' : undefined}
          aria-labelledby={exercise ? `${ids}-lesson-tab` : undefined}
          className="lesson-text left-view-lesson"
          hidden={leftView !== 'lesson'}
        >
          <header className="lesson-head">
            {crumb}
            <h1>{fm.title}</h1>
            <p className="lesson-meta">
              {isFixture ? 'Fixture lesson, development only' : `Lesson ${fm.id} of ${curriculum.lessonCount}`}
              {saved?.completedAt && (
                <span className="lesson-done" data-testid="lesson-done">
                  <CircleCheck size={14} aria-hidden="true" />
                  Complete
                </span>
              )}
            </p>
            {!exercise && (
              <div className="lesson-head-actions">
                <CopyToClaude
                  getPrompt={() =>
                    buildClaudePrompt({ ...promptBase, explainBack: progressStore.lesson(lessonKey)?.explainBack ?? '' })
                  }
                />
              </div>
            )}
          </header>
          {claims.length > 0 && <VerifyNote claims={claims} />}
          <Markdown className="prose" claims={claims} anchors>
            {body}
          </Markdown>
          {entry.lesson.quiz && (
            <LessonQuiz
              quiz={entry.lesson.quiz}
              saved={saved?.quiz}
              onChange={(quiz) => progressStore.updateLesson(lessonKey, (l) => ({ ...l, quiz }))}
            />
          )}
          <ExplainBack question={fm.explain_back} answer={explanation} onChange={setExplanation} />
          <FinishList parts={completion.parts} complete={!!saved?.completedAt} />
          {!isFixture && <Pager id={fm.id} />}
        </div>

        {exercise && (
          <div
            id={`${ids}-exercise`}
            role="tabpanel"
            aria-labelledby={`${ids}-exercise-tab`}
            className="lesson-text left-view-exercise"
            hidden={leftView !== 'exercise'}
            data-testid="exercise-brief"
          >
            <header className="lesson-head">
              {crumb}
              <h1>{exercise.meta.title}</h1>
              <p className="lesson-meta exercise-meta">
                <ExerciseTypeIcon type={exercise.meta.type} />
                Exercise {selected + 1} of {exercises.length}: {TYPE_LABEL[exercise.meta.type]}
              </p>
            </header>
            <Markdown className="prose prose-instructions">{exercise.instructions ?? ''}</Markdown>
            {exercise.meta.type === 'bug_hunt' && progressOf(exercise.folder).solved && (
              <div className="bug-reveal">
                <p className="bug-reveal-label">What the bug was</p>
                <p>{exercise.meta.bug_description}</p>
              </div>
            )}
            <StuckPanel
              exercise={exercise}
              progress={progressOf(exercise.folder)}
              onShowHint={(n) => showHint(exercise.folder, n)}
              onShowSolution={() => showSolution(exercise.folder)}
            />
          </div>
        )}
      </article>
      {exercise && (
        <ExercisePanel
          lessonFolder={entry.lesson.folder}
          lessonKey={lessonKey}
          promptBase={promptBase}
          collapsed={editorCollapsed}
          onCollapsedChange={changeCollapsed}
          exercises={exercises}
          selected={selected}
          onSelect={selectExercise}
          progress={progress}
          onSubmitted={onSubmitted}
          onShowHint={showHint}
          onShowSolution={showSolution}
        />
      )}
    </div>
  )
}

function ExerciseTypeIcon({ type }: { type: keyof typeof TYPE_ICON }) {
  const Icon = TYPE_ICON[type]
  return <Icon size={16} aria-hidden="true" />
}
