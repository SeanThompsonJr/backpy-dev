// Loads the same Pyodide the site uses (same node_modules package), for the validator and tests.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { Worker } from 'node:worker_threads'
import { loadPyodide } from 'pyodide'
import { installBackpy, type Backpy } from '../../shared/pyodide-core'

export interface NodePython {
  backpy: Backpy
  /** Returns and clears everything written to stdout/stderr since the last call. */
  takeOutput(): { stdout: string; stderr: string }
  /**
   * Runs Python with a time limit. If time runs out, Python is interrupted (KeyboardInterrupt),
   * so a loop that never ends fails instead of hanging the validator. Returns 'timeout' then.
   */
  withTimeLimit<T>(seconds: number, run: () => T): T | 'timeout'
  version: string
  /** The Python version inside Pyodide, e.g. "3.14.2" */
  pythonVersion: string
}

// A watchdog thread: waits on the shared array, and if the run isn't finished in time it sets
// Pyodide's interrupt signal (2 = SIGINT), which Python sees as KeyboardInterrupt.
const WATCHDOG = `
const { workerData } = require('node:worker_threads')
const shared = new Int32Array(workerData.buffer)
if (Atomics.wait(shared, 1, 0, workerData.ms) === 'timed-out') Atomics.store(shared, 0, 2)
`

export async function loadNodePython(root = process.cwd()): Promise<NodePython> {
  const py = await loadPyodide({ packageCacheDir: join(root, '.cache', 'pyodide-packages') })
  let stdout = ''
  let stderr = ''
  const decoders = { out: new TextDecoder(), err: new TextDecoder() }
  py.setStdout({ write: (buf) => ((stdout += decoders.out.decode(buf, { stream: true })), buf.length) })
  py.setStderr({ write: (buf) => ((stderr += decoders.err.decode(buf, { stream: true })), buf.length) })
  py.setStdin({ error: true })

  // [0] is Pyodide's interrupt signal; [1] tells the watchdog the run finished.
  const shared = new Int32Array(new SharedArrayBuffer(8))
  py.setInterruptBuffer(new Int32Array(shared.buffer, 0, 1))

  const read = (name: string) => readFileSync(join(root, 'shared', 'python', name), 'utf8')
  const backpy = installBackpy(py, { runner: read('backpy_runner.py'), testRunner: read('backpy_test_runner.py') })

  return {
    backpy,
    version: py.version,
    pythonVersion: py.runPython('import sys; sys.version.split()[0]') as string,
    takeOutput() {
      const out = { stdout, stderr }
      stdout = ''
      stderr = ''
      return out
    },
    withTimeLimit(seconds, run) {
      Atomics.store(shared, 0, 0)
      Atomics.store(shared, 1, 0)
      const watchdog = new Worker(WATCHDOG, { eval: true, workerData: { buffer: shared.buffer, ms: seconds * 1000 } })
      try {
        return run()
      } catch (error) {
        if (String(error).includes('KeyboardInterrupt')) return 'timeout'
        throw error
      } finally {
        Atomics.store(shared, 1, 1)
        Atomics.notify(shared, 1)
        Atomics.store(shared, 0, 0)
        void watchdog.terminate()
      }
    },
  }
}
