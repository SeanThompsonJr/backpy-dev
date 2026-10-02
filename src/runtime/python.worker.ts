// Runs Python off the main thread, so a loop that never ends can be stopped by terminating
// this worker. Uses the same shared runner as the Node validator.
import { loadPyodide } from 'pyodide'
import runner from '../../shared/python/backpy_runner.py?raw'
import testRunner from '../../shared/python/backpy_test_runner.py?raw'
import { installBackpy } from '../../shared/pyodide-core'
import { PYODIDE_PACKAGE_URL } from '../../shared/runtime-versions'
import { OUTPUT_LIMIT, type PythonMessage, type PythonRequest } from './python-protocol'

const scope = self as unknown as DedicatedWorkerGlobalScope
const post = (message: PythonMessage) => scope.postMessage(message)

let current = 0
let written = 0

function writer(type: 'stdout' | 'stderr') {
  const decoder = new TextDecoder()
  return {
    write(buffer: Uint8Array) {
      const text = decoder.decode(buffer, { stream: true })
      if (written < OUTPUT_LIMIT) {
        written += text.length
        post({ type, id: current, text })
        if (written >= OUTPUT_LIMIT) post({ type: 'truncated', id: current })
      }
      return buffer.length
    },
  }
}

const ready = (async () => {
  const py = await loadPyodide({
    indexURL: new URL(`${import.meta.env.BASE_URL}pyodide/`, scope.location.origin).href,
    packageBaseUrl: PYODIDE_PACKAGE_URL,
  })
  py.setStdout(writer('stdout'))
  py.setStderr(writer('stderr'))
  py.setStdin({ error: true })
  const backpy = installBackpy(py, { runner, testRunner })
  post({ type: 'ready', version: py.version })
  return backpy
})()
ready.catch((error: unknown) => post({ type: 'load-error', message: String(error) }))

scope.onmessage = async (event: MessageEvent<PythonRequest>) => {
  const request = event.data
  const backpy = await ready
  current = request.id
  written = 0
  try {
    await backpy.loadPackages(request.packages)
    post({ type: 'started', id: request.id })
    if (request.type === 'run') {
      post({ type: 'done', id: request.id, ok: backpy.runCode(request.code) })
    } else {
      post({ type: 'tested', id: request.id, result: backpy.runTests(request.code, request.tests) })
    }
  } catch (error) {
    post({ type: 'done', id: request.id, ok: false, error: String(error) })
  }
}
