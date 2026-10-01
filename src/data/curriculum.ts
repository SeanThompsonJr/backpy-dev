import raw from '../../curriculum/curriculum.json'
import { buildCurriculum, type RawCurriculum } from '../../shared/curriculum'

export const curriculum = buildCurriculum(raw as RawCurriculum)
