import { expect, test, type Page } from '@playwright/test'

test.describe.configure({ timeout: 90_000 })
test.use({ viewport: { width: 1280, height: 800 } })

const editor = (page: Page) => page.getByTestId('code-editor').locator('.cm-content')
const output = (page: Page) => page.getByTestId('output-text')
const summary = (page: Page) => page.getByTestId('run-summary')
const runButton = (page: Page) => page.getByRole('button', { name: 'Run', exact: true })
const exerciseTab = (page: Page, name: RegExp) => page.getByRole('tablist', { name: 'Exercises' }).getByRole('tab', { name })

async function openFixtureWithPython(page: Page) {
  await page.goto('/#/lesson/fixture')
  await expect(editor(page)).toBeVisible()
  // Python is ready once the loading status clears.
  await expect(page.locator('.runtime-status')).toBeEmpty({ timeout: 60_000 })
  await expect(runButton(page)).toBeEnabled()
}

async function setCode(page: Page, code: string) {
  await editor(page).click()
  await page.keyboard.press('ControlOrMeta+a')
  await page.keyboard.insertText(code)
}

test('Run shows what the code printed', async ({ page }) => {
  await openFixtureWithPython(page)
  await setCode(page, 'team = ["pikachu", "eevee"]\nfor name in team:\n    print(name.title())\n')
  await runButton(page).click()
  await expect(output(page)).toHaveText('Pikachu\nEevee\n')
  await expect(summary(page)).toContainText('Ran in')
})

test('an error shows a traceback that points at the line in main.py', async ({ page }) => {
  await openFixtureWithPython(page)
  await setCode(page, 'def level_up(level):\n    return level + "1"\n\nlevel_up(5)\n')
  await runButton(page).click()
  const stderr = output(page).locator('.output-stderr')
  await expect(stderr).toContainText('File "main.py", line 4, in <module>')
  await expect(stderr).toContainText('TypeError')
  await expect(stderr).not.toContainText('backpy_runner')
  await expect(summary(page)).toContainText('Stopped by an error')
})

test('a loop that never ends is stopped within the timeout plus a second, and the next run works', async ({ page }) => {
  await openFixtureWithPython(page)
  await setCode(page, 'while True:\n    pass\n')
  const started = Date.now()
  await runButton(page).click()
  await expect(summary(page)).toContainText('Timed out after 5 seconds', { timeout: 10_000 })
  expect(Date.now() - started).toBeLessThan(6_000 + 500)
  await expect(page.getByTestId('output')).toContainText('stuck in a loop that never ends, or waiting on a network request that never finished')

  await setCode(page, 'print("back again")\n')
  await expect(runButton(page)).toBeEnabled()
  await runButton(page).click()
  await expect(output(page)).toHaveText('back again\n', { timeout: 60_000 })
})

test('a loop that prints forever is capped, stopped, and leaves the page responsive', async ({ page }) => {
  await openFixtureWithPython(page)
  await setCode(page, 'while True:\n    print("pikachu used thunderbolt")\n')
  await runButton(page).click()
  await expect(summary(page)).toContainText('Timed out after 5 seconds', { timeout: 10_000 })
  await expect(page.getByTestId('output')).toContainText('Output was cut off after 50,000 characters.')
  await exerciseTab(page, /Bug hunt/).click()
  await expect(editor(page)).toContainText('def add_member(name, team=[]):')
})

test('Reset restores the starter code, and undo brings the edit back', async ({ page }) => {
  await openFixtureWithPython(page)
  const reset = page.getByRole('button', { name: 'Reset' })
  await expect(reset).toBeDisabled()
  await setCode(page, 'print(1)\n')
  await expect(reset).toBeEnabled()
  await reset.click()
  await expect(editor(page)).toContainText('def make_team(name):')
  await expect(summary(page)).toContainText('Back to the starter code.')
  await expect(reset).toBeDisabled()
  await editor(page).click()
  await page.keyboard.press('ControlOrMeta+z')
  await expect(editor(page)).toContainText('print(1)')
})

test('input() explains why it is unavailable', async ({ page }) => {
  await openFixtureWithPython(page)
  await setCode(page, 'name = input("Pokemon? ")\n')
  await runButton(page).click()
  await expect(output(page)).toContainText("input() isn't available here: browser Python has no keyboard.")
})

test('each exercise keeps its own output', async ({ page }) => {
  await openFixtureWithPython(page)
  await setCode(page, 'print("from exercise one")\n')
  await runButton(page).click()
  await expect(output(page)).toHaveText('from exercise one\n')
  await exerciseTab(page, /Bug hunt/).click()
  await expect(page.getByTestId('output')).toContainText('Run shows what your code prints.')
  await exerciseTab(page, /Code/).click()
  await expect(output(page)).toHaveText('from exercise one\n')
})
