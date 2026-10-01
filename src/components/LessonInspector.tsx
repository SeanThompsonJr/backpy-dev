// Milestone 2: shows a parsed lesson's raw parts so the format can be checked before the
// real lesson layout exists (milestone 3 replaces this for normal use).
import type { LessonEntry } from '../../shared/content'
import type { Issue } from '../../shared/lesson-parse'

const TYPE_LABEL = { code: 'Code', bug_hunt: 'Bug hunt', sql: 'SQL', local: 'Local' } as const

export function LessonInspector({ entry, issues }: { entry: LessonEntry; issues: Issue[] }) {
  const { lesson } = entry
  const fm = lesson.frontMatter
  const ownIssues = issues.filter((i) => i.file.startsWith(`${entry.sectionDir}/${lesson.folder}/`))

  return (
    <article className="inspector">
      <p className="crumb">
        content/{entry.sectionDir}/{lesson.folder}
      </p>
      <h1>{fm.title}</h1>

      {ownIssues.length > 0 && (
        <section className="inspector-issues" role="alert">
          <h2>{ownIssues.length} format problem{ownIssues.length === 1 ? '' : 's'}</h2>
          <ul>
            {ownIssues.map((i, n) => (
              <li key={n}>
                <code>{i.file}</code> {i.message}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2>Front matter</h2>
        <dl className="inspector-fields">
          <dt>id</dt>
          <dd>{fm.id}</dd>
          <dt>section</dt>
          <dd>{fm.section}</dd>
          <dt>sources</dt>
          <dd>{fm.sources.join(', ') || 'none'}</dd>
          <dt>concepts introduced</dt>
          <dd>{fm.concepts_introduced.join(', ') || 'none'}</dd>
          <dt>concepts used</dt>
          <dd>{fm.concepts_used.join(', ') || 'none'}</dd>
          <dt>explain back</dt>
          <dd>{fm.explain_back}</dd>
          <dt>unverified claims</dt>
          <dd>{fm.unverified_claims.length ? fm.unverified_claims.join(' / ') : 'none'}</dd>
        </dl>
      </section>

      <section>
        <h2>Lesson sections</h2>
        {lesson.sections.map((s) => (
          <details key={s.title} className="inspector-section" data-testid="lesson-section">
            <summary>{s.title}</summary>
            <pre>{s.markdown}</pre>
          </details>
        ))}
      </section>

      <section>
        <h2>Code blocks</h2>
        <table className="inspector-table">
          <thead>
            <tr>
              <th scope="col">Line</th>
              <th scope="col">Fence</th>
              <th scope="col">In section</th>
            </tr>
          </thead>
          <tbody>
            {lesson.blocks.map((b) => (
              <tr key={b.line} data-testid="code-block">
                <td>{b.line}</td>
                <td>
                  <code>{[b.lang, b.mode === 'display' ? '' : b.mode, b.expectedError ?? ''].filter(Boolean).join(' ')}</code>
                </td>
                <td>{b.section}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2>Quiz</h2>
        <ol className="inspector-list">
          {lesson.quiz?.questions.map((q, n) => (
            <li key={n} data-testid="quiz-question">
              <pre>{q.q}</pre>
              <span className="inspector-meta">
                {q.options.length} options, answer {q.answer + 1}
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section>
        <h2>Exercises</h2>
        <ol className="inspector-list">
          {lesson.exercises.map((ex) => (
            <li key={ex.folder} data-testid="exercise" data-type={ex.meta.type}>
              <strong>{ex.meta.title}</strong>
              <span className="inspector-meta">
                {TYPE_LABEL[ex.meta.type]} in {ex.folder}
                {ex.hints && ', 2 hints'}
                {ex.meta.type === 'bug_hunt' && ', bug description'}
                {ex.meta.type === 'local' && `, ${ex.meta.checklist.length} checklist items`}
              </span>
            </li>
          ))}
        </ol>
      </section>
    </article>
  )
}
