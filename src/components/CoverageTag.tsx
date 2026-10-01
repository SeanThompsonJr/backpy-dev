import { BookOpen, BookOpenText, PenLine } from 'lucide-react'
import type { Coverage } from '../../shared/curriculum'
import { curriculum } from '../data/curriculum'

const ICONS = { sources: BookOpen, partial: BookOpenText, claude: PenLine } as const

export function CoverageTag({ coverage }: { coverage: Coverage }) {
  const Icon = ICONS[coverage]
  const meaning = curriculum.coverageKey[coverage]
  return (
    <span className={`tag tag-${coverage}`} title={meaning} data-testid="coverage-tag">
      <Icon size={14} strokeWidth={2} aria-hidden="true" />
      {coverage}
      <span className="visually-hidden">: {meaning}</span>
    </span>
  )
}
