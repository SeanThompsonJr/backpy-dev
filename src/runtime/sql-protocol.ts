// Messages between the page and the SQL worker.
import type { SqlOutcome } from '../../shared/sql-runner'

export type SqlRequest =
  | { type: 'run'; id: number; seed: string; sql: string }
  | { type: 'grade'; id: number; seed: string; sql: string; solution: string }

export type SqlMessage =
  | { type: 'ready' }
  | { type: 'load-error'; message: string }
  /** Postgres is ready and the SQL is about to run: the timeout starts now. */
  | { type: 'started'; id: number }
  | { type: 'ran'; id: number; outcome: SqlOutcome }
  | { type: 'graded'; id: number; learner: SqlOutcome; expected: SqlOutcome }
