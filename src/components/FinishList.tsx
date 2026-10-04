import { Circle, CircleCheck } from 'lucide-react'
import type { CompletionPart } from '../progress/completion'

/** What's left before the lesson counts as complete. */
export function FinishList({ parts, complete }: { parts: CompletionPart[]; complete: boolean }) {
  const left = parts.filter((p) => !p.done).length
  return (
    <section className="finish-list" aria-label="Finishing this lesson" data-testid="finish-list">
      <p className="finish-list-title">
        {complete
          ? 'Lesson complete. Your progress is saved in this browser.'
          : `To finish this lesson: ${left} thing${left === 1 ? '' : 's'} left`}
      </p>
      <ul>
        {parts.map((p) => (
          <li key={p.label} className={p.done ? 'finish-done' : undefined}>
            {p.done ? <CircleCheck size={16} aria-hidden="true" /> : <Circle size={16} aria-hidden="true" />}
            <span className="visually-hidden">{p.done ? 'Done: ' : 'Not done yet: '}</span>
            {p.label}
          </li>
        ))}
      </ul>
    </section>
  )
}
