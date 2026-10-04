// The one place runtime versions come from: the installed packages themselves. package.json
// pins them exactly, and the site and the Node validator import from the same node_modules.
import pyodidePackage from 'pyodide/package.json' with { type: 'json' }
// PGlite doesn't export its package.json, so it's read from node_modules directly.
import pglitePackage from '../node_modules/@electric-sql/pglite/package.json' with { type: 'json' }

export const PYODIDE_VERSION: string = pyodidePackage.version
export const PGLITE_VERSION: string = pglitePackage.version

/** Where Pyodide packages (pydantic, httpx, ...) for this exact version are downloaded from. */
export const PYODIDE_PACKAGE_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`

/** How the site's footer and the validator both describe the runtimes. */
export const runtimeSummary = (pyodide: string, pglite: string) =>
  `Python runs on Pyodide ${pyodide}. SQL runs on PGlite ${pglite}.`
