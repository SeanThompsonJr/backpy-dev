import { Link } from 'react-router'
import { CircleCheck } from 'lucide-react'
import { curriculum } from '../data/curriculum'
import { pad, type Section, type Tier } from '../../shared/curriculum'
import { CoverageTag } from '../components/CoverageTag'
import { ProgressStrip } from '../components/ProgressStrip'
import { useProgress } from '../progress/store'
import { PGLITE_VERSION, PYODIDE_VERSION, runtimeSummary } from '../../shared/runtime-versions'

function jumpTo(section: Section) {
  const heading = document.getElementById(`section-${section.slug}`)
  if (!heading) return
  heading.scrollIntoView({ block: 'start' })
  heading.focus({ preventScroll: true })
}

function SectionIndex({ tiers }: { tiers: Tier[] }) {
  return (
    <nav className="route-index" aria-label="Sections">
      {tiers.map((tier) => (
        <div key={tier.slug} className="route-index-tier">
          <p className="route-index-tier-name">{tier.name}</p>
          <ol>
            {tier.sections.map((section) => (
              <li key={section.slug}>
                <button type="button" onClick={() => jumpTo(section)}>
                  <span className="num">{pad(section.number, 2)}</span>
                  {section.name}
                </button>
              </li>
            ))}
          </ol>
        </div>
      ))}
    </nav>
  )
}

function SectionStop({ section, done }: { section: Section; done: Set<number> }) {
  const sectionDone = section.lessons.every((l) => done.has(l.id))
  return (
    <li className={`stop${sectionDone ? ' stop-done' : ''}`} data-testid="section">
      <span className="stop-node" aria-hidden="true">
        {pad(section.number, 2)}
      </span>
      <h3 id={`section-${section.slug}`} tabIndex={-1} className="stop-title">
        {section.name}
      </h3>
      <ol className="lesson-list">
        {section.lessons.map((lesson) => (
          <li key={lesson.id}>
            <Link
              to={`/lesson/${lesson.id}`}
              className={`lesson-row${done.has(lesson.id) ? ' lesson-row-done' : ''}`}
              data-testid="lesson-row"
              data-lesson-id={lesson.id}
              data-done={done.has(lesson.id)}
            >
              <span className="lesson-num">
                {done.has(lesson.id) ? (
                  <>
                    <CircleCheck size={16} aria-hidden="true" />
                    <span className="visually-hidden">Done: </span>
                  </>
                ) : (
                  lesson.prefix
                )}
              </span>
              <span className="lesson-title">{lesson.title}</span>
              <span className="lesson-tags">
                <CoverageTag coverage={lesson.coverage} />
                {lesson.optional && <span className="tag tag-optional">optional</span>}
              </span>
            </Link>
          </li>
        ))}
      </ol>
      <div className="checkpoint">
        <span className="checkpoint-gate" aria-hidden="true" />
        <p>
          <strong>Checkpoint.</strong> {section.checkpoint}
        </p>
      </div>
    </li>
  )
}

export function Home() {
  const { tiers, lessonCount, sections } = curriculum
  const saved = useProgress()
  // Only curriculum lessons count; the fixture (id 0) never does.
  const done = new Set(
    Object.entries(saved.lessons)
      .filter(([key, l]) => curriculum.lessonById.has(Number(key)) && l.completedAt)
      .map(([key]) => Number(key)),
  )
  return (
    <div className="home">
      <header className="home-intro">
        <h1>{lessonCount} lessons from first script to first job</h1>
        <p>
          Work through them in order. Every section ends with a checkpoint you build into PokeTeam,
          and all {sections.length} sections are open from day one.
        </p>
        {import.meta.env.DEV && (
          <p className="dev-link">
            <Link to="/lesson/fixture">Open the fixture lesson</Link> (development only)
          </p>
        )}
        <ProgressStrip done={done.size} total={lessonCount} />
      </header>

      <div className="home-body">
        <SectionIndex tiers={tiers} />

        <div className="route">
          {tiers.map((tier) => {
            const lessonTotal = tier.sections.reduce((n, s) => n + s.lessons.length, 0)
            const tierDone = tier.sections.reduce((n, s) => n + s.lessons.filter((l) => done.has(l.id)).length, 0)
            return (
              <section key={tier.slug} className="tier" aria-labelledby={`${tier.slug}-title`} data-testid="tier">
                <header className="tier-head">
                  <span className="tier-mark" aria-hidden="true">
                    {tier.number}
                  </span>
                  <div>
                    <h2 id={`${tier.slug}-title`}>{tier.name}</h2>
                    <p className="tier-meta">
                      Tier {tier.number} of {tiers.length}, {tier.sections.length} sections, {lessonTotal} lessons
                      {tierDone > 0 && `, ${tierDone} done`}
                    </p>
                  </div>
                </header>
                <ol className="rail">
                  {tier.sections.map((section) => (
                    <SectionStop key={section.slug} section={section} done={done} />
                  ))}
                </ol>
              </section>
            )
          })}
        </div>
      </div>
      <footer className="site-footer" data-testid="runtime-versions">
        {runtimeSummary(PYODIDE_VERSION, PGLITE_VERSION)} The lesson checker uses the same versions.
      </footer>
    </div>
  )
}
