// The learning loop's rules for one exercise (TEACHING_STYLE.md, "The learning method"):
// hint 1 after the first failed submit, hint 2 and the solution after the second.

export interface ExerciseProgress {
  failedSubmits: number
  solved: boolean
  /** How many hints Sean has chosen to open (0-2) */
  hintsShown: number
  solutionShown: boolean
}

export const NEW_PROGRESS: ExerciseProgress = { failedSubmits: 0, solved: false, hintsShown: 0, solutionShown: false }

export const hintUnlocked = (p: ExerciseProgress, hint: 1 | 2) => p.failedSubmits >= hint
export const solutionUnlocked = (p: ExerciseProgress) => p.failedSubmits >= 2 || p.solved

export function afterSubmit(p: ExerciseProgress, passed: boolean): ExerciseProgress {
  return passed ? { ...p, solved: true } : { ...p, failedSubmits: p.failedSubmits + 1 }
}

/** What a failed submit just unlocked, to say so in the output. */
export function newlyUnlocked(before: ExerciseProgress, after: ExerciseProgress): string | undefined {
  if (before.failedSubmits < 1 && after.failedSubmits >= 1) return 'Hint 1 is unlocked.'
  if (before.failedSubmits < 2 && after.failedSubmits >= 2) return 'Hint 2 and the solution are unlocked.'
  return undefined
}
