import { Lightbulb, Lock } from 'lucide-react'
import type { Exercise } from '../../shared/lesson-parse'
import { hintUnlocked, solutionUnlocked, type ExerciseProgress } from './learning'
import { Markdown } from './Markdown'

interface Props {
  exercise: Exercise
  progress: ExerciseProgress
  onShowHint: (hint: 1 | 2) => void
  onShowSolution: () => void
}

function Locked({ children }: { children: string }) {
  return (
    <p className="stuck-locked">
      <Lock size={14} aria-hidden="true" />
      {children}
    </p>
  )
}

/** Hints and the solution for one exercise, each locked until the learning loop allows it. */
export function StuckPanel({ exercise, progress, onShowHint, onShowSolution }: Props) {
  const hints = exercise.hints
  if (!hints) return null
  const id = (part: string) => `${exercise.folder}-${part}`

  return (
    <section className="stuck" aria-label="Hints and solution" data-testid="stuck">
      <h2 className="stuck-title">
        <Lightbulb size={18} aria-hidden="true" />
        Stuck?
      </h2>
      {([1, 2] as const).map((n) => (
        <div key={n} className="stuck-item" data-hint={id(`hint-${n}`)} tabIndex={-1}>
          <h3>Hint {n}</h3>
          {!hintUnlocked(progress, n) ? (
            <Locked>{n === 1 ? 'Unlocks after your first failed submit.' : 'Unlocks after 2 failed submits.'}</Locked>
          ) : progress.hintsShown >= n ? (
            <p className="stuck-text">{hints.hints[n - 1]}</p>
          ) : (
            <button type="button" className="btn btn-ghost btn-small" onClick={() => onShowHint(n)}>
              Show hint {n}
            </button>
          )}
        </div>
      ))}
      <div className="stuck-item" data-hint={id('solution')} tabIndex={-1}>
        <h3>Solution</h3>
        {!solutionUnlocked(progress) ? (
          <Locked>Unlocks after 2 failed submits, or once you've solved it.</Locked>
        ) : progress.solutionShown ? (
          <>
            <Markdown className="prose prose-compact">{'```python\n' + (exercise.solution ?? '').trimEnd() + '\n```'}</Markdown>
            <p className="stuck-label">Why it works</p>
            <p className="stuck-text">{hints.solution_explanation}</p>
          </>
        ) : (
          <button type="button" className="btn btn-ghost btn-small" onClick={onShowSolution}>
            Show the solution
          </button>
        )}
      </div>
    </section>
  )
}
