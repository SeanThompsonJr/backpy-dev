// The browser and the lesson checker must run the same Python and the same Postgres
// (CLAUDE.md: "Node scripts for content validation, using the SAME Pyodide and PGlite runtimes").
import { execFileSync } from 'node:child_process'
import { expect, test, type Page } from '@playwright/test'

test.describe.configure({ timeout: 120_000 })
test.use({ viewport: { width: 1280, height: 800 } })

interface Versions {
  pyodide: string
  python: string
  pglite: string
  postgres: string
}

// What the Node validator actually loads.
const validator = JSON.parse(
  execFileSync(process.execPath, ['--import', 'tsx', 'scripts/validate.ts', '--versions'], { encoding: 'utf8' }).trim().split('\n').at(-1)!,
) as Versions

const editor = (page: Page) => page.getByTestId('code-editor').locator('.cm-content')

async function runInEditor(page: Page, code: string) {
  await expect(page.locator('.runtime-status')).toBeEmpty({ timeout: 60_000 })
  await editor(page).click()
  await page.keyboard.press('ControlOrMeta+a')
  await page.keyboard.insertText(code)
  await page.getByRole('button', { name: 'Run', exact: true }).click()
}

test('the footer names the same Pyodide and PGlite versions the validator loads', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByTestId('runtime-versions')).toContainText(
    `Python runs on Pyodide ${validator.pyodide}. SQL runs on PGlite ${validator.pglite}.`,
  )
})

test('the browser runs the same Python and Postgres versions as the validator', async ({ page }) => {
  await page.goto('/#/lesson/fixture')
  await runInEditor(page, 'import sys\nprint(sys.version.split()[0])')
  await expect(page.getByTestId('output-text')).toHaveText(`${validator.python}\n`)

  await page.getByRole('tablist', { name: 'Exercises' }).getByRole('tab', { name: /SQL/ }).click()
  await runInEditor(page, "SELECT current_setting('server_version') AS version;")
  await expect(page.getByTestId('sql-result').getByRole('cell')).toHaveText([validator.postgres])
})
