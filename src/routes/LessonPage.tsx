import { Link, useParams } from 'react-router'
import { curriculum } from '../data/curriculum'

export function LessonPage() {
  const { id } = useParams()
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

  const section = curriculum.sectionByNumber.get(lesson.sectionNumber)!
  return (
    <div className="page-message">
      <p className="crumb">
        <Link to="/">Route</Link> / {section.name}
      </p>
      <h1>{lesson.title}</h1>
      <p>
        This lesson hasn't been written yet. It's added when the {section.name} section is generated.
      </p>
    </div>
  )
}
