import raw from '../../content/_registry/concepts.json'
import type { PromptConcept } from '../components/claude-prompt'
import { humanizeConceptId } from '../components/claude-prompt'

/** One entry of content/_registry/concepts.json (LESSON_FORMAT.md, "concepts.json"). */
export interface ConceptEntry {
  id: string
  name: string
  definition?: string
  introduced_in?: number
  analogy?: string
}

const concepts = new Map((raw.concepts as ConceptEntry[]).map((c) => [c.id, c]))

/** A lesson's concepts as Copy to Claude describes them; unregistered ones get a readable name. */
export function describeConcepts(ids: string[]): PromptConcept[] {
  return ids.map((id) => {
    const entry = concepts.get(id)
    return entry ? { name: entry.name, definition: entry.definition, analogy: entry.analogy } : { name: humanizeConceptId(id) }
  })
}
