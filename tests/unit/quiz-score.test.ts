import { describe, expect, it } from 'vitest'
import type { QuizQuestion } from '../../shared/schema'
import { addPick, emptyPicks, scoreQuiz } from '../../src/components/quiz-score'

const q = (answer: number): QuizQuestion => ({
  q: 'question',
  options: ['a', 'b', 'c', 'd'],
  answer,
  explanations: ['a', 'b', 'c', 'd'],
})
const questions = [q(1), q(2), q(0)]

describe('quiz scoring', () => {
  it('only the first pick on each question counts', () => {
    let picks = emptyPicks(questions)
    picks = addPick(picks, 0, 3) // wrong first...
    picks = addPick(picks, 0, 1) // ...then right: still wrong on the first try
    picks = addPick(picks, 1, 2) // right first
    picks = addPick(picks, 1, 0) // reading another option's explanation changes nothing
    expect(scoreQuiz(questions, picks)).toEqual({ right: 1, total: 3, firstTry: ['wrong', 'right', 'unanswered'] })
  })

  it('picking the same option twice records it once', () => {
    let picks = emptyPicks(questions)
    picks = addPick(picks, 2, 0)
    picks = addPick(picks, 2, 0)
    expect(picks[2]).toEqual([0])
  })

  it('a perfect run scores every question', () => {
    let picks = emptyPicks(questions)
    questions.forEach((question, i) => (picks = addPick(picks, i, question.answer)))
    expect(scoreQuiz(questions, picks).right).toBe(3)
  })
})
