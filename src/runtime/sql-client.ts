// Owns the SQL worker, the same way python-client.ts owns the Python one: one query at a time,
// and a query that outlives its timeout is stopped by restarting the worker.
import type { SqlOutcome } from '../../shared/sql-runner'
import type { SqlMessage, SqlRequest } from './sql-protocol'

export type SqlStatus = 'idle' | 'loading' | 'ready' | 'running' | 'restarting' | 'failed'

export type SqlRunOutcome =
  | { kind: 'ran'; outcome: SqlOutcome; seconds: number }
  | { kind: 'graded'; learner: SqlOutcome; expected: SqlOutcome; seconds: number }
  | { kind: 'timeout'; during: 'loading' | 'running'; seconds: number }
  | { kind: 'unavailable'; message: string }

type RequestWithoutId = SqlRequest extends infer R ? (R extends unknown ? Omit<R, 'id'> : never) : never

interface Pending {
  id: number
  timeoutSeconds: number
  resolve: (outcome: SqlRunOutcome) => void
  startedAt?: number
  timer?: ReturnType<typeof setTimeout>
  loadTimer?: ReturnType<typeof setTimeout>
}

/** How long Postgres may take to download before a run gives up. Tests shorten it. */
const loadTimeoutMs = () => (globalThis as { __backpyLoadTimeoutMs?: number }).__backpyLoadTimeoutMs ?? 120_000

class SqlClient {
  private worker: Worker | null = null
  private status: SqlStatus = 'idle'
  private loaded = false
  private loadError = ''
  private pending: Pending | null = null
  private nextId = 1
  private listeners = new Set<() => void>()

  subscribe = (listener: () => void) => {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }
  getStatus = () => this.status

  private setStatus(status: SqlStatus) {
    this.status = status
    this.listeners.forEach((l) => l())
  }

  /** Start loading Postgres now, so it's ready by the time Run is pressed. */
  warmUp() {
    if (!this.worker && this.status !== 'failed') this.spawn('loading')
  }

  private spawn(status: 'loading' | 'restarting') {
    this.loaded = false
    const worker = new Worker(new URL('./sql.worker.ts', import.meta.url), { type: 'module' })
    this.worker = worker
    this.setStatus(status)
    worker.onmessage = (event: MessageEvent<SqlMessage>) => this.receive(event.data)
    worker.onerror = (event) => this.fail(event.message || 'The SQL worker crashed.')
  }

  private fail(message: string) {
    this.loadError = message
    this.worker?.terminate()
    this.worker = null
    this.setStatus('failed')
    this.finish({ kind: 'unavailable', message })
  }

  private finish(outcome: SqlRunOutcome) {
    const pending = this.pending
    if (!pending) return
    clearTimeout(pending.timer)
    clearTimeout(pending.loadTimer)
    this.pending = null
    if (this.loaded) this.setStatus('ready')
    pending.resolve(outcome)
  }

  private elapsed() {
    const startedAt = this.pending?.startedAt
    return startedAt ? (performance.now() - startedAt) / 1000 : 0
  }

  private receive(message: SqlMessage) {
    if (message.type === 'ready') {
      this.loaded = true
      if (!this.pending) this.setStatus('ready')
      return
    }
    if (message.type === 'load-error') return this.fail(message.message)
    const pending = this.pending
    if (!pending || message.id !== pending.id) return
    if (message.type === 'started') {
      clearTimeout(pending.loadTimer)
      pending.startedAt = performance.now()
      pending.timer = setTimeout(() => this.stopForTimeout('running'), pending.timeoutSeconds * 1000)
    } else if (message.type === 'ran') {
      this.finish({ kind: 'ran', outcome: message.outcome, seconds: this.elapsed() })
    } else {
      this.finish({ kind: 'graded', learner: message.learner, expected: message.expected, seconds: this.elapsed() })
    }
  }

  private stopForTimeout(during: 'loading' | 'running') {
    const seconds = this.elapsed()
    this.worker?.terminate()
    this.worker = null
    this.loaded = false
    this.finish({ kind: 'timeout', during, seconds })
    this.spawn('restarting')
  }

  private send(request: RequestWithoutId, timeoutSeconds: number): Promise<SqlRunOutcome> {
    if (this.status === 'failed') return Promise.resolve({ kind: 'unavailable', message: this.loadError })
    if (this.pending) throw new Error('SQL is already running something.')
    if (!this.worker) this.spawn('loading')
    const id = this.nextId++
    return new Promise((resolve) => {
      this.pending = { id, timeoutSeconds, resolve }
      this.pending.loadTimer = setTimeout(() => this.stopForTimeout('loading'), loadTimeoutMs())
      this.setStatus('running')
      this.worker!.postMessage({ ...request, id } as SqlRequest)
    })
  }

  /** Runs a script on freshly seeded data and returns the last statement's result. */
  run(seed: string, sql: string, timeoutSeconds: number) {
    return this.send({ type: 'run', seed, sql }, timeoutSeconds)
  }

  /** Runs Sean's script and the solution, each on its own freshly seeded data, for grading. */
  grade(seed: string, sql: string, solution: string, timeoutSeconds: number) {
    return this.send({ type: 'grade', seed, sql, solution }, timeoutSeconds)
  }
}

export const sqlRunner = new SqlClient()
