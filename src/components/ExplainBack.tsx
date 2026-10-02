import { useId } from 'react'

interface Props {
  question: string
  answer: string
  onChange: (answer: string) => void
}

/** The lesson's last step: answer one question in your own words (TEACHING_STYLE.md, step 6). */
export function ExplainBack({ question, answer, onChange }: Props) {
  const id = useId()
  return (
    <section className="explain-back" aria-labelledby={`${id}-title`} data-testid="explain-back">
      <h2 id={`${id}-title`}>Explain it back</h2>
      <label htmlFor={`${id}-answer`} className="explain-back-question">
        {question}
      </label>
      <textarea
        id={`${id}-answer`}
        rows={5}
        value={answer}
        onChange={(e) => onChange(e.target.value)}
        aria-describedby={`${id}-help`}
      />
      <p id={`${id}-help`} className="explain-back-help">
        Use your own words and no code. If you can't explain it simply, reread the concept.
      </p>
    </section>
  )
}
