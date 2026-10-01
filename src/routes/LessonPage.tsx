import { Link, useParams } from 'react-router'
import { curriculum } from '../data/curriculum'
import { contentIssues, fixture, lessonsById } from '../content/loader'
import { LessonInspector } from '../components/LessonInspector'

export function LessonPage() {
  const { id } = useParams()

  if (id === 'fixture') {
    if (!fixture) {
      return (
        <div className="page-message">
          <h1>Fixture lesson not available</h1>
          <p>
            The fixture only loads in development (<code>npm run dev</code>). <Link to="/">Back to the route</Link>
          </p>
        </div>
      )
    }
    return <LessonInspector entry={fixture} issues={contentIssues} />
  }

  const lesson = curriculum.lessonById.get(Number(id))
  if (!lesson) {
    return (
      <div className="page-message">
        <h1>No lesson {id}</h1>
        <p>
          Lessons are numbered 1 to {curriculum.lessonCount}. <Link to="/">Back to the route</Link>
        </p>
      </div>
    )
  }

  const entry = lessonsById.get(lesson.id)
  if (entry) return <LessonInspector entry={entry} issues={contentIssues} />

  const section = curriculum.sectionByNumber.get(lesson.sectionNumber)!
  return (
    <div className="page-message">
      <p className="crumb">
        <Link to="/">Route</Link> / {section.name}
      </p>
      <h1>{lesson.title}</h1>
      <p>This lesson hasn't been written yet. It's added when the {section.name} section is generated.</p>
    </div>
  )
}
