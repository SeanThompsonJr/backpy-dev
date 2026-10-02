// Owns the Python worker. One run at a time; a run that outlives its timeout is stopped by
// terminating the worker, and a fresh worker is started so the next run works.
import type { TestRun } from '../../shared/pyodide-core'
import type { PythonMessage, PythonRequest } from './python-protocol'

export type PythonStatus = 'idle' | 'loading' | 'ready' | 'running' | 'restarting' | 'failed'

export interface OutputChunk {
  stream: 'stdout' | 'stderr'
  text: string
}

export type PythonOutcome =
  | { kind: 'finished'; ok: boolean; seconds: number; error?: string }
  | { kind: 'tested'; result: TestRun; seconds: number }
  | { kind: 'timeout'; seconds: number }
  | { kind: 'unavailable'; message: string }

type RequestWithoutId = PythonRequest extends infer R ? (R extends unknown ? Omit<R, 'id'> : never) : never

interface RunOptions {
  packages: string[]
  timeoutSeconds: number
  onOutput?: (chunk: OutputChunk) => void
  onTruncated?: () => void
}

interface Pending {
  id: number
  options: RunOptions
  resolve: (outcome: PythonOutcome) => void
  startedAt?: number
  timer?: ReturnType<typeof setTimeout>
}

class PythonClient {
  private worker: Worker | null = null
  private status: PythonStatus = 'idle'
  private loaded = false
  private loadError = ''
  private pending: Pending | null = null
  private nextId = 1
  private listeners = new Set<() => void>()
  version = ''

  subscribe = (listener: () => void) => {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }
  getStatus = () => this.status

  private setStatus(status: PythonStatus) {
    this.status = status
    this.listeners.forEach((l) => l())
  }

  /** Start loading Python now, so it's ready by the time Run is pressed. */
  warmUp() {
    if (!this.worker && this.status !== 'failed') this.spawn('loading')
  }

  private spawn(status: 'loading' | 'restarting') {
    this.loaded = false
    const worker = new Worker(new URL('./python.worker.ts', import.meta.url), { type: 'module' })
    this.worker = worker
    this.setStatus(status)
    worker.onmessage = (event: MessageEvent<PythonMessage>) => this.receive(event.data)
    worker.onerror = (event) => this.fail(event.message || 'The Python worker crashed.')
  }

  private fail(message: string) {
    this.loadError = message
    this.worker?.terminate()
    this.worker = null
    this.setStatus('failed')
    this.finish({ kind: 'unavailable', message })
  }

  private finish(outcome: PythonOutcome) {
    const pending = this.pending
    if (!pending) return
    clearTimeout(pending.timer)
    this.pending = null
    if (this.loaded) this.setStatus('ready')
    pending.resolve(outcome)
  }

  private elapsed() {
    const startedAt = this.pending?.startedAt
    return startedAt ? (performance.now() - startedAt) / 1000 : 0
  }

  private receive(message: PythonMessage) {
    if (message.type === 'ready') {
      this.loaded = true
      this.version = message.version
      if (!this.pending) this.setStatus('ready')
      return
    }
    if (message.type === 'load-error') return this.fail(message.message)

    const pending = this.pending
    if (!pending || message.id !== pending.id) return
    switch (message.type) {
      case 'started':
        pending.startedAt = performance.now()
        pending.timer = setTimeout(() => this.stopForTimeout(), pending.options.timeoutSeconds * 1000)
        break
      case 'stdout':
      case 'stderr':
        pending.options.onOutput?.({ stream: message.type, text: message.text })
        break
      case 'truncated':
        pending.options.onTruncated?.()
        break
      case 'done':
        this.finish({ kind: 'finished', ok: message.ok, seconds: this.elapsed(), error: message.error })
        break
      case 'tested':
        this.finish({ kind: 'tested', result: message.result, seconds: this.elapsed() })
        break
    }
  }

  private stopForTimeout() {
    const seconds = this.elapsed()
    this.worker?.terminate()
    this.worker = null
    this.loaded = false
    this.finish({ kind: 'timeout', seconds })
    this.spawn('restarting')
  }

  private send(request: RequestWithoutId, options: RunOptions): Promise<PythonOutcome> {
    if (this.status === 'failed') {
      return Promise.resolve({ kind: 'unavailable', message: this.loadError })
    }
    if (this.pending) throw new Error('Python is already running something.')
    if (!this.worker) this.spawn('loading')
    const id = this.nextId++
    return new Promise((resolve) => {
      this.pending = { id, options, resolve }
      this.setStatus('running')
      this.worker!.postMessage({ ...request, id } as PythonRequest)
    })
  }

  /** Runs code as main.py, streaming its output. */
  run(code: string, options: RunOptions) {
    return this.send({ type: 'run', code, packages: options.packages }, options)
  }

  /** Runs the exercise's hidden tests against code. */
  test(code: string, tests: string, options: RunOptions) {
    return this.send({ type: 'test', code, tests, packages: options.packages }, options)
  }
}

export const python = new PythonClient()
