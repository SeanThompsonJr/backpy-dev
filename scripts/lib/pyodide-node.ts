// Loads the same Pyodide the site uses (same node_modules package), for the validator and tests.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { loadPyodide } from 'pyodide'
import { installBackpy, type Backpy } from '../../shared/pyodide-core'

export interface NodePython {
  backpy: Backpy
  /** Returns and clears everything written to stdout/stderr since the last call. */
  takeOutput(): { stdout: string; stderr: string }
  version: string
}

export async function loadNodePython(root = process.cwd()): Promise<NodePython> {
  const py = await loadPyodide({ packageCacheDir: join(root, '.cache', 'pyodide-packages') })
  let stdout = ''
  let stderr = ''
  const decoders = { out: new TextDecoder(), err: new TextDecoder() }
  py.setStdout({ write: (buf) => ((stdout += decoders.out.decode(buf, { stream: true })), buf.length) })
  py.setStderr({ write: (buf) => ((stderr += decoders.err.decode(buf, { stream: true })), buf.length) })
  py.setStdin({ error: true })

  const read = (name: string) => readFileSync(join(root, 'shared', 'python', name), 'utf8')
  const backpy = installBackpy(py, { runner: read('backpy_runner.py'), testRunner: read('backpy_test_runner.py') })

  return {
    backpy,
    version: py.version,
    takeOutput() {
      const out = { stdout, stderr }
      stdout = ''
      stderr = ''
      return out
    },
  }
}
