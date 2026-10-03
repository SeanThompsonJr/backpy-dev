// Quiz scoring (LESSON_FORMAT.md, quiz.json): only the first pick on each question counts.
import type { QuizQuestion } from '../../shared/schema'

/** Options picked on each question, in the order Sean picked them. */
export type QuizPicks = number[][]

export const emptyPicks = (questions: QuizQuestion[]): QuizPicks => questions.map(() => [])

/** Records a pick. Picking an option again doesn't change the record. */
export function addPick(picks: QuizPicks, question: number, option: number): QuizPicks {
  if (picks[question].includes(option)) return picks
  return picks.map((p, i) => (i === question ? [...p, option] : p))
}

export interface QuizScore {
  right: number
  total: number
  /** Per question: right on the first try, wrong on the first try, or not answered yet */
  firstTry: ('right' | 'wrong' | 'unanswered')[]
}

export function scoreQuiz(questions: QuizQuestion[], picks: QuizPicks): QuizScore {
  const firstTry = questions.map((q, i) => {
    const first = picks[i]?.[0]
    if (first === undefined) return 'unanswered' as const
    return first === q.answer ? ('right' as const) : ('wrong' as const)
  })
  return { right: firstTry.filter((r) => r === 'right').length, total: questions.length, firstTry }
}
