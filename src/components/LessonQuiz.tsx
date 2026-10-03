import { useId, useRef, useState } from 'react'
import { CircleCheck, CircleX, RotateCcw } from 'lucide-react'
import type { Quiz } from '../../shared/schema'
import { Markdown } from './Markdown'
import { addPick, emptyPicks, scoreQuiz, type QuizPicks } from './quiz-score'

const LETTERS = 'ABCDEF'

/** The first line of a question, without Markdown, for the score list. */
const questionSummary = (q: string) =>
  q
    .split('\n')[0]
    .replace(/[`*_]/g, '')
    .trim()

interface Props {
  quiz: Quiz
}

/** One question at a time; each pick shows that option's explanation. Only first picks are scored. */
export function LessonQuiz({ quiz }: Props) {
  const { questions } = quiz
  const [index, setIndex] = useState(0)
  const [picks, setPicks] = useState<QuizPicks>(() => emptyPicks(questions))
  /** The option whose explanation is showing on the current question */
  const [shown, setShown] = useState<number | undefined>()
  const [finished, setFinished] = useState(false)
  const questionRef = useRef<HTMLDivElement>(null)
  const id = useId()

  const question = questions[index]
  const picked = picks[index]
  const score = scoreQuiz(questions, picks)

  const goTo = (next: number) => {
    setIndex(next)
    setShown(picks[next].at(-1))
    setFinished(false)
    // Move focus to the new question so it's read out and the page doesn't jump.
    requestAnimationFrame(() => questionRef.current?.focus({ preventScroll: false }))
  }
  const pick = (option: number) => {
    setPicks((p) => addPick(p, index, option))
    setShown(option)
  }
  const restart = () => {
    setPicks(emptyPicks(questions))
    setShown(undefined)
    setFinished(false)
    setIndex(0)
  }

  return (
    <section className="quiz" aria-labelledby={`${id}-title`} data-testid="quiz">
      <div className="quiz-head">
        <h2 id={`${id}-title`}>Quiz</h2>
        <p className="quiz-count" data-testid="quiz-count">
          {finished ? `${questions.length} questions` : `Question ${index + 1} of ${questions.length}`}
        </p>
      </div>
      <ol className="quiz-steps" aria-hidden="true">
        {score.firstTry.map((result, i) => (
          <li key={i} className={`quiz-step quiz-step-${result}${!finished && i === index ? ' quiz-step-current' : ''}`} />
        ))}
      </ol>

      {finished ? (
        <div className="quiz-result" data-testid="quiz-result">
          <p className="quiz-score">
            <strong>
              {score.right} of {score.total}
            </strong>{' '}
            right on the first try.
          </p>
          {score.right < score.total && (
            <p className="quiz-score-help">Open a question you missed to read why each answer is right or wrong.</p>
          )}
          <ol className="quiz-review">
            {questions.map((q, i) => (
              <li key={i}>
                <button type="button" className="quiz-review-item" onClick={() => goTo(i)}>
                  {score.firstTry[i] === 'right' ? (
                    <CircleCheck size={16} aria-hidden="true" className="quiz-icon-right" />
                  ) : (
                    <CircleX size={16} aria-hidden="true" className="quiz-icon-wrong" />
                  )}
                  <span className="visually-hidden">
                    {score.firstTry[i] === 'right' ? 'Right on the first try: ' : 'Missed on the first try: '}
                  </span>
                  <span className="quiz-review-num">{i + 1}</span>
                  {questionSummary(q.q)}
                </button>
              </li>
            ))}
          </ol>
          <button type="button" className="btn btn-ghost btn-small" onClick={restart}>
            <RotateCcw size={14} aria-hidden="true" />
            Take the quiz again
          </button>
        </div>
      ) : (
        <>
          <div ref={questionRef} tabIndex={-1} className="quiz-question" id={`${id}-q`} data-testid="quiz-question">
            <Markdown className="prose prose-compact">{question.q}</Markdown>
          </div>
          <ol className="quiz-options" aria-labelledby={`${id}-q`}>
            {question.options.map((option, i) => {
              const wasPicked = picked.includes(i)
              const correct = i === question.answer
              const state = wasPicked ? (correct ? 'right' : 'wrong') : 'open'
              return (
                <li key={i}>
                  <button
                    type="button"
                    className={`quiz-option quiz-option-${state}${shown === i ? ' quiz-option-shown' : ''}`}
                    onClick={() => pick(i)}
                    data-testid="quiz-option"
                  >
                    <span className="quiz-letter" aria-hidden="true">
                      {LETTERS[i]}
                    </span>
                    <Markdown inline>{option}</Markdown>
                    {state === 'right' && <CircleCheck size={18} aria-hidden="true" className="quiz-icon-right" />}
                    {state === 'wrong' && <CircleX size={18} aria-hidden="true" className="quiz-icon-wrong" />}
                    {state !== 'open' && <span className="visually-hidden">{correct ? ' (correct)' : ' (incorrect)'}</span>}
                  </button>
                </li>
              )
            })}
          </ol>

          <div aria-live="polite" data-testid="quiz-feedback">
            {shown !== undefined && (
              <div className={`quiz-explanation ${shown === question.answer ? 'quiz-explanation-right' : 'quiz-explanation-wrong'}`}>
                <p className="quiz-verdict">
                  {shown === question.answer ? (
                    <CircleCheck size={16} aria-hidden="true" />
                  ) : (
                    <CircleX size={16} aria-hidden="true" />
                  )}
                  {LETTERS[shown]} is {shown === question.answer ? 'correct' : 'incorrect'}
                </p>
                <Markdown className="prose prose-compact">{question.explanations[shown]}</Markdown>
              </div>
            )}
          </div>

          <div className="quiz-nav">
            {index > 0 && (
              <button type="button" className="btn btn-ghost btn-small" onClick={() => goTo(index - 1)}>
                Previous question
              </button>
            )}
            <button
              type="button"
              className="btn btn-run btn-small"
              disabled={picked.length === 0}
              onClick={() => (index === questions.length - 1 ? setFinished(true) : goTo(index + 1))}
            >
              {index === questions.length - 1 ? 'See your score' : 'Next question'}
            </button>
            {picked.length === 0 && <p className="quiz-nav-help">Pick an answer to continue.</p>}
          </div>
        </>
      )}
    </section>
  )
}
