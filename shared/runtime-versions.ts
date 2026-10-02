// The one place runtime versions come from: the installed packages themselves. package.json
// pins them exactly, and the site and the Node validator import from the same node_modules.
import pyodidePackage from 'pyodide/package.json' with { type: 'json' }

export const PYODIDE_VERSION: string = pyodidePackage.version

/** Where Pyodide packages (pydantic, httpx, ...) for this exact version are downloaded from. */
export const PYODIDE_PACKAGE_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`
