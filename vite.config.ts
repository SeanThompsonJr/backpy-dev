import { createReadStream, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, extname, join } from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

const require = createRequire(import.meta.url)

/**
 * Serves the Pyodide runtime straight from node_modules/pyodide at /pyodide/ (dev) and copies
 * it into dist/pyodide/ (build), so the site runs exactly the version package.json pins.
 * Extra packages (pydantic, ...) come from the CDN for that same version.
 */
function pyodideRuntime(): Plugin {
  const dir = dirname(require.resolve('pyodide/package.json'))
  const files = ['pyodide.asm.mjs', 'pyodide.asm.wasm', 'python_stdlib.zip', 'pyodide-lock.json']
  const types: Record<string, string> = {
    '.mjs': 'text/javascript',
    '.wasm': 'application/wasm',
    '.zip': 'application/zip',
    '.json': 'application/json',
  }
  return {
    name: 'backpy-pyodide-runtime',
    configureServer(server) {
      server.middlewares.use('/pyodide', (req, res, next) => {
        const file = (req.url ?? '').split('?')[0].replace(/^\//, '')
        if (!files.includes(file)) return next()
        res.setHeader('Content-Type', types[extname(file)])
        createReadStream(join(dir, file)).pipe(res)
      })
    },
    generateBundle() {
      for (const file of files) {
        this.emitFile({ type: 'asset', fileName: `pyodide/${file}`, source: readFileSync(join(dir, file)) })
      }
    },
  }
}

export default defineConfig({
  plugins: [react(), pyodideRuntime()],
  worker: { format: 'es' },
  optimizeDeps: {
    // Scan every source file at startup, not just what index.html reaches eagerly. Otherwise the
    // lazily loaded lesson page discovers its dependencies on first visit and Vite reloads the page.
    entries: ['index.html', 'src/**/*.{ts,tsx}'],
    // Pyodide and PGlite locate their runtime files themselves; pre-bundling them breaks that.
    exclude: ['pyodide', '@electric-sql/pglite'],
  },
})
