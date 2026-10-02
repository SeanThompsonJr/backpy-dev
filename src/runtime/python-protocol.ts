// Messages between the page and the Python worker.
import type { TestRun } from '../../shared/pyodide-core'

export type PythonRequest =
  | { type: 'run'; id: number; code: string; packages: string[] }
  | { type: 'test'; id: number; code: string; tests: string; packages: string[] }

export type PythonMessage =
  | { type: 'ready'; version: string }
  | { type: 'load-error'; message: string }
  /** Packages are loaded and the code is about to start: the timeout starts now. */
  | { type: 'started'; id: number }
  | { type: 'stdout' | 'stderr'; id: number; text: string }
  | { type: 'truncated'; id: number }
  | { type: 'done'; id: number; ok: boolean; error?: string }
  | { type: 'tested'; id: number; result: TestRun }

/** Output beyond this many characters per run is dropped, so a printing loop can't freeze the page. */
export const OUTPUT_LIMIT = 50_000
