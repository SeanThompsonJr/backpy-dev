// GitHub Pages serves backpy from /backpy-dev/ (BUILD_PLAN.md). A build for that path has to load
// every page asset and the Python runtime from under it, or the site breaks on Sean's phone.
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { build } from 'vite'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const outDir = mkdtempSync(join(tmpdir(), 'backpy-pages-'))

beforeAll(async () => {
  await build({ base: '/backpy-dev/', logLevel: 'silent', build: { outDir, emptyOutDir: true } })
}, 120_000)
afterAll(() => rmSync(outDir, { recursive: true, force: true }))

describe('the GitHub Pages build', () => {
  it('loads every script, stylesheet and icon from under /backpy-dev/', () => {
    const html = readFileSync(join(outDir, 'index.html'), 'utf8')
    const urls = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map((m) => m[1])
    expect(urls.length).toBeGreaterThan(1)
    for (const url of urls) expect(url).toMatch(/^\/backpy-dev\//)
  })

  it('ships the Python runtime, and the code looks for it and the logo under /backpy-dev/', () => {
    for (const file of ['pyodide.asm.mjs', 'pyodide.asm.wasm', 'python_stdlib.zip', 'pyodide-lock.json']) {
      expect(existsSync(join(outDir, 'pyodide', file)), file).toBe(true)
    }
    const assets = join(outDir, 'assets')
    const js = readdirSync(assets)
      .filter((f) => f.endsWith('.js'))
      .map((f) => readFileSync(join(assets, f), 'utf8'))
      .join('\n')
    expect(js).toContain('/backpy-dev/')
    expect(js).not.toMatch(/["'`]\/favicon\.svg/)
  })
})
