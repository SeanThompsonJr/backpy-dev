import { readFileSync } from 'node:fs'
import { expect, test, type Page } from '@playwright/test'

test.describe.configure({ timeout: 90_000 })
test.use({ viewport: { width: 1280, height: 800 } })

const fixtureFile = (exercise: string, file: string) =>
  readFileSync(`content/_fixtures/000-fixture/exercises/${exercise}/${file}`, 'utf8')

const editor = (page: Page) => page.getByTestId('code-editor').locator('.cm-content')
const exerciseTab = (page: Page, name: RegExp) => page.getByRole('tablist', { name: 'Exercises' }).getByRole('tab', { name })
const submit = (page: Page) => page.getByRole('button', { name: 'Submit' })
const grade = (page: Page) => page.getByTestId('grade')
const stuck = (page: Page) => page.getByTestId('exercise-brief').getByTestId('stuck')

async function openFixture(page: Page) {
  await page.goto('/#/lesson/fixture')
  await expect(editor(page)).toBeVisible()
  await expect(page.locator('.python-status')).toBeEmpty({ timeout: 60_000 })
}

async function setCode(page: Page, code: string) {
  await editor(page).click()
  await page.keyboard.press('ControlOrMeta+a')
  await page.keyboard.insertText(code)
}

test('the full learning loop on the bug hunt: concept message, hint 1, hint 2, solution, then a pass', async ({ page }) => {
  await openFixture(page)
  await exerciseTab(page, /Bug hunt/).click()
  await expect(stuck(page)).toContainText('Unlocks after your first failed submit.')
  await expect(stuck(page).getByRole('button')).toHaveCount(0)

  // First failed submit: the checklist, the failing check's concept message, and hint 1 unlocks.
  await submit(page).click()
  await expect(grade(page)).toContainText('1 of 2 checks failed.')
  await expect(grade(page).getByRole('list', { name: 'Checks' }).getByRole('listitem')).toHaveText([
    'Failed: Each new team starts empty',
    'Passed: Passing a team still adds to it',
  ])
  await expect(page.getByTestId('rethink')).toContainText(
    'The second new team already had a member. When is a default value created: when def runs, or on each call?',
  )
  await expect(grade(page)).toContainText('Hint 1 is unlocked.')
  await expect(stuck(page)).toContainText('Unlocks after 2 failed submits.')

  await grade(page).getByRole('button', { name: 'Show hint 1' }).click()
  await expect(stuck(page)).toContainText('Look at when the default value comes into existence.')
  await expect(stuck(page).getByRole('button', { name: 'Show the solution' })).toHaveCount(0)

  // Second failed submit: hint 2 and the solution unlock.
  await submit(page).click()
  await expect(grade(page)).toContainText('Hint 2 and the solution are unlocked.')
  await stuck(page).getByRole('button', { name: 'Show hint 2' }).click()
  await expect(stuck(page)).toContainText('The likely mistake is assuming team=[] means')
  await stuck(page).getByRole('button', { name: 'Show the solution' }).click()
  await expect(stuck(page)).toContainText('if team is None:')
  await expect(stuck(page)).toContainText('Why it works')

  // Fix the bug and submit: everything passes, the bug is explained, and the tab shows it's solved.
  await setCode(page, fixtureFile('02-shared-team-bug', 'solution.py'))
  await submit(page).click()
  await expect(grade(page)).toContainText('All 2 checks passed.')
  await expect(page.getByTestId('bug-reveal')).toContainText('The default list was created once, when def ran')
  await expect(page.getByTestId('exercise-brief')).toContainText('What the bug was')
  await expect(exerciseTab(page, /Bug hunt/)).toContainText('(solved)')
})

test('an exception during the checks shows the error and its traceback', async ({ page }) => {
  await openFixture(page)
  await submit(page).click()
  await expect(grade(page)).toContainText('5 of 5 checks failed.')
  const rethink = page.getByTestId('rethink')
  await expect(rethink).toContainText('Your code raised an error in this check')
  await expect(rethink).toContainText('TypeError')
})

test('code that cannot load explains that no checks ran', async ({ page }) => {
  await openFixture(page)
  await setCode(page, 'def make_team(name:\n    pass\n')
  await submit(page).click()
  await expect(grade(page)).toContainText("Your code couldn't load, so no checks ran.")
  await expect(grade(page)).toContainText('SyntaxError')
})

test('solving on the first try opens the solution but not the hints', async ({ page }) => {
  await openFixture(page)
  await setCode(page, fixtureFile('01-make-a-team', 'solution.py'))
  await submit(page).click()
  await expect(grade(page)).toContainText('All 5 checks passed.')
  await page.getByRole('tablist', { name: 'Left side shows' }).getByRole('tab', { name: /Exercise 1/ }).click()
  await expect(stuck(page)).toContainText('Unlocks after your first failed submit.')
  await expect(stuck(page).getByRole('button', { name: 'Show the solution' })).toBeVisible()
})

test('a submit that times out says why and does not count as a failed submit', async ({ page }) => {
  await openFixture(page)
  await exerciseTab(page, /Bug hunt/).click()
  await setCode(page, 'while True:\n    pass\n')
  await submit(page).click()
  const message = page.getByTestId('timeout-message')
  await expect(message).toContainText('Timed out after 5 seconds', { timeout: 10_000 })
  await expect(message).toContainText('a loop that never ends, or waiting on a network request')
  await expect(message).toContainText("This didn't count as a failed submit.")
  await expect(stuck(page)).toContainText('Unlocks after your first failed submit.')
})

test('if Python never finishes downloading, the run times out with a network message', async ({ page }) => {
  await page.addInitScript(() => {
    ;(globalThis as { __backpyLoadTimeoutMs?: number }).__backpyLoadTimeoutMs = 1_500
  })
  // Hold the Python runtime download forever, as a dead connection would.
  await page.context().route('**/pyodide/pyodide.asm.wasm', () => {})
  await page.goto('/#/lesson/fixture')
  await expect(editor(page)).toBeVisible()
  await submit(page).click()
  const message = page.getByTestId('timeout-message')
  await expect(message).toContainText("Python couldn't finish downloading", { timeout: 10_000 })
  await expect(message).toContainText('Check your internet connection')
  await expect(message).toContainText("This didn't count as a failed submit.")
})

test('Ctrl+Enter in the editor runs the code', async ({ page }) => {
  await openFixture(page)
  await setCode(page, 'print("ran from the keyboard")')
  await page.keyboard.press('ControlOrMeta+Enter')
  await expect(page.getByTestId('output-text')).toHaveText('ran from the keyboard\n')
  await expect(editor(page)).toHaveText('print("ran from the keyboard")')
})

test('the lesson ends with an explain-back box', async ({ page }) => {
  await openFixture(page)
  const box = page.getByRole('textbox', { name: /What's the difference in when each one is created\?/ })
  await box.fill('Python makes the default once; Postgres makes it per row.')
  await expect(box).toHaveValue('Python makes the default once; Postgres makes it per row.')
})
