import { readFileSync } from 'node:fs'
import { expect, test, type Page } from '@playwright/test'

test.describe.configure({ timeout: 120_000 })
test.use({ viewport: { width: 1280, height: 800 } })

const exercisesDir = 'content/_fixtures/000-fixture/exercises'
const fixtureFile = (exercise: string, file: string) => readFileSync(`${exercisesDir}/${exercise}/${file}`, 'utf8')
const editor = (page: Page) => page.getByTestId('code-editor').locator('.cm-content')
const exerciseTab = (page: Page, name: RegExp) => page.getByRole('tablist', { name: 'Exercises' }).getByRole('tab', { name })
const explainBox = (page: Page) => page.getByRole('textbox', { name: /What's the difference in when each one is created\?/ })

async function openFixture(page: Page) {
  await page.goto('/#/lesson/fixture')
  await expect(editor(page)).toBeVisible()
}

async function setCode(page: Page, code: string) {
  await editor(page).click()
  await page.keyboard.press('ControlOrMeta+a')
  await page.keyboard.insertText(code)
}

async function solve(page: Page, tab: RegExp, exercise: string, solutionFile: string) {
  await exerciseTab(page, tab).click()
  await expect(page.locator('.runtime-status')).toBeEmpty({ timeout: 60_000 })
  await setCode(page, fixtureFile(exercise, solutionFile))
  await page.getByRole('button', { name: 'Submit' }).click()
  await expect(page.getByTestId('grade')).toContainText(/All \d checks passed\./, { timeout: 60_000 })
}

test('finishing every part of the fixture completes it, and it stays complete after a reload', async ({ page }) => {
  await openFixture(page)
  const finish = page.getByTestId('finish-list')
  await expect(finish).toContainText('To finish this lesson: 6 things left')

  await solve(page, /Code/, '01-make-a-team', 'solution.py')
  await solve(page, /Bug hunt/, '02-shared-team-bug', 'solution.py')
  await solve(page, /SQL/, '03-private-by-default', 'solution.sql')
  await exerciseTab(page, /On your machine/).click()
  for (const box of await page.getByRole('checkbox').all()) await box.check()

  await page.getByRole('tablist', { name: 'Left side shows' }).getByRole('tab', { name: 'Lesson' }).click()
  const quiz = page.getByTestId('quiz')
  for (const letter of ['B', 'B', 'C', 'B']) {
    await quiz.getByTestId('quiz-option').filter({ hasText: new RegExp('^' + letter) }).click()
    await quiz.getByRole('button', { name: /Next question|See your score/ }).click()
  }
  await expect(quiz).toContainText('4 of 4 right on the first try.')
  await expect(finish).toContainText('1 thing left')
  await explainBox(page).fill('A Python default is made once, when def runs; a Postgres default is made for every row.')

  await expect(finish).toContainText('Lesson complete.')
  await expect(page.getByTestId('lesson-done')).toHaveText('Complete')

  await page.reload()
  await expect(page.getByTestId('lesson-done')).toHaveText('Complete')
  await expect(explainBox(page)).toHaveValue(/made once, when def runs/)
  await expect(page.getByTestId('quiz-result')).toContainText('4 of 4 right on the first try.')
  await expect(editor(page)).toContainText('if members is None:')
  await expect(exerciseTab(page, /SQL/)).toContainText('(solved)')
})

test('code and unlocked hints survive a reload', async ({ page }) => {
  await openFixture(page)
  await exerciseTab(page, /Bug hunt/).click()
  await expect(page.locator('.runtime-status')).toBeEmpty({ timeout: 60_000 })
  await setCode(page, 'def add_member(name, team=[]):\n    # working on it\n    team.append(name)\n    return team\n')
  await page.getByRole('button', { name: 'Submit' }).click()
  await expect(page.getByTestId('grade')).toContainText('Hint 1 is unlocked.')

  await page.reload()
  await exerciseTab(page, /Bug hunt/).click()
  await expect(editor(page)).toContainText('# working on it')
  await expect(page.getByTestId('exercise-brief').getByTestId('stuck').getByRole('button', { name: 'Show hint 1' })).toBeVisible()
})

test('export, clear, then import brings progress back', async ({ page }) => {
  await openFixture(page)
  await explainBox(page).fill('Saved before the export.')

  await page.goto('/')
  const downloadStarted = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export progress' }).click()
  const download = await downloadStarted
  expect(download.suggestedFilename()).toMatch(/^backpy-progress-\d{4}-\d{2}-\d{2}\.json$/)
  const exportPath = await download.path()
  expect(JSON.parse(readFileSync(exportPath, 'utf8')).lessons['0'].explainBack).toBe('Saved before the export.')

  await page.evaluate(() => localStorage.clear())
  await openFixture(page)
  await page.reload()
  await expect(explainBox(page)).toHaveValue('')

  await page.goto('/')
  await page.getByTestId('import-file').setInputFiles(exportPath)
  const confirm = page.getByTestId('import-confirm')
  await expect(confirm).toContainText('Replace your progress with')
  await confirm.getByRole('button', { name: 'Replace progress' }).click()
  await expect(page.getByTestId('progress-strip')).toContainText('Progress imported')

  await openFixture(page)
  await expect(explainBox(page)).toHaveValue('Saved before the export.')
})

test('the home page shows done lessons, finished sections and the total', async ({ page }) => {
  const done = (id: number) => [String(id), { exercises: {}, completedAt: '2026-10-03T00:00:00Z', updatedAt: '2026-10-03T00:00:00Z' }]
  const file = { app: 'backpy', version: 1, lessons: Object.fromEntries([1, 2, 3, 4, 5].map(done)) }
  await page.goto('/')
  await page.getByTestId('import-file').setInputFiles({ name: 'progress.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(file)) })
  await page.getByTestId('import-confirm').getByRole('button', { name: 'Replace progress' }).click()

  await expect(page.getByTestId('lessons-done')).toHaveText('5')
  await expect(page.getByRole('progressbar', { name: 'Lessons done' })).toHaveAttribute('aria-valuenow', '5')
  await expect(page.locator('[data-lesson-id="1"]')).toHaveAttribute('data-done', 'true')
  await expect(page.locator('[data-lesson-id="6"]')).toHaveAttribute('data-done', 'false')
  await expect(page.getByTestId('section').nth(0)).toHaveClass(/stop-done/)
  await expect(page.getByTestId('section').nth(1)).not.toHaveClass(/stop-done/)
  await expect(page.getByTestId('tier').first()).toContainText('26 lessons, 5 done')

  await page.reload()
  await expect(page.getByTestId('lessons-done')).toHaveText('5')
})

test('a file that is not a progress export is refused and nothing changes', async ({ page }) => {
  await page.goto('/')
  await page.getByTestId('import-file').setInputFiles({ name: 'notes.json', mimeType: 'application/json', buffer: Buffer.from('not json at all') })
  await expect(page.getByRole('alert')).toHaveText(
    "That file isn't valid JSON, so it can't be a backpy progress export. Nothing was changed.",
  )
  await expect(page.getByTestId('import-confirm')).toHaveCount(0)
})
