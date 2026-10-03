// Runs SQL in PGlite off the main thread, so a query that never finishes can be stopped by
// terminating this worker. Uses the same runner as the Node validator.
import { PGlite } from '@electric-sql/pglite'
import { runSql } from '../../shared/sql-runner'
import type { SqlMessage, SqlRequest } from './sql-protocol'

const scope = self as unknown as DedicatedWorkerGlobalScope
const post = (message: SqlMessage) => scope.postMessage(message)

// One empty database per worker; every run works on a fresh clone of it.
const ready = PGlite.create().then((db) => {
  post({ type: 'ready' })
  return db
})
ready.catch((error: unknown) => post({ type: 'load-error', message: String(error) }))

scope.onmessage = async (event: MessageEvent<SqlRequest>) => {
  const request = event.data
  const base = await ready
  post({ type: 'started', id: request.id })
  const learner = await runSql(base, request.seed, request.sql)
  if (request.type === 'run') {
    post({ type: 'ran', id: request.id, outcome: learner })
  } else {
    post({ type: 'graded', id: request.id, learner, expected: await runSql(base, request.seed, request.solution) })
  }
}
