import { expect, test, type Page } from '@playwright/test'

test.describe.configure({ timeout: 90_000 })
test.use({ viewport: { width: 1280, height: 800 } })

const RULES =
  "Tutor me. Give direction and the concept, not the answer. Let me attempt. Correct my thinking, not my code. Only give the answer after I've tried twice."

const editor = (page: Page) => page.getByTestId('code-editor').locator('.cm-content')
// Windows stores clipboard text with CRLF line endings.
const clipboard = async (page: Page) =>
  (await page.evaluate(() => navigator.clipboard.readText())).replace(/\r\n/g, '\n')

test.beforeEach(async ({ context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
})

test('Copy to Claude puts the lesson, concept, code, last error, explain-back and rules on the clipboard', async ({ page }) => {
  await page.goto('/#/lesson/fixture')
  await page.getByRole('tablist', { name: 'Exercises' }).getByRole('tab', { name: /Bug hunt/ }).click()
  await expect(page.locator('.runtime-status')).toBeEmpty({ timeout: 60_000 })

  await editor(page).click()
  await page.keyboard.press('ControlOrMeta+a')
  await page.keyboard.insertText('def add_member(name, team=[]):\n    # my attempt\n    team.append(name)\n    return team\n')
  await page.getByRole('button', { name: 'Submit' }).click()
  await expect(page.getByTestId('grade')).toContainText('1 of 2 checks failed.')

  await page.getByRole('tablist', { name: 'Left side shows' }).getByRole('tab', { name: 'Lesson' }).click()
  await page.getByRole('textbox', { name: /What's the difference in when each one is created\?/ }).fill('Python makes it once.')

  await page.getByTestId('copy-claude').click()
  await expect(page.getByTestId('copy-claude')).toContainText('Copied')

  const prompt = await clipboard(page)
  expect(prompt.startsWith(RULES)).toBe(true)
  expect(prompt).toContain('Fixture lesson: Fixture: default values in Python and in Postgres')
  expect(prompt).toContain('- Mutable default argument')
  expect(prompt).toContain('Python creates the default **once, when `def` runs**')
  expect(prompt).toContain("Fix the shared-team bug (Bug hunt). I've submitted 1 time without passing.")
  expect(prompt).toContain('# my attempt')
  expect(prompt).toContain('Failed check: Each new team starts empty')
  expect(prompt).toContain('The second new team already had a member.')
  expect(prompt).toContain('## My explain-back answer\nPython makes it once.')
})

test('the copy button is on the rail too, for copying while coding in VS Code', async ({ page }) => {
  await page.goto('/#/lesson/fixture')
  await page.getByRole('button', { name: 'Hide editor' }).click()
  await page.getByTestId('rail-copy-claude').click()
  await expect(page.getByTestId('rail-copy-claude')).toContainText('Copied')
  const prompt = await clipboard(page)
  expect(prompt.startsWith(RULES)).toBe(true)
  expect(prompt).toContain('## My code\n```python\ndef make_team(name):')
  expect(prompt).toContain('## The last error\nNo errors yet.')
})

test('when copying is blocked, the prompt is shown to copy by hand', async ({ page }) => {
  await page.goto('/#/lesson/fixture')
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: () => Promise.reject(new Error('blocked')) } })
    document.execCommand = () => false
  })
  await page.getByTestId('copy-claude').click()
  const fallback = page.getByRole('dialog', { name: 'Copy this prompt' })
  await expect(fallback).toContainText('Your browser blocked copying.')
  await expect(fallback.getByRole('textbox')).toHaveValue(new RegExp('^' + RULES.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
})
