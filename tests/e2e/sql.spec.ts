import { readFileSync } from 'node:fs'
import { expect, test, type Page } from '@playwright/test'

test.describe.configure({ timeout: 90_000 })
test.use({ viewport: { width: 1280, height: 800 } })

const fixtureFile = (file: string) => readFileSync(`content/_fixtures/000-fixture/exercises/03-private-by-default/${file}`, 'utf8')
const editor = (page: Page) => page.getByTestId('code-editor').locator('.cm-content')
const output = (page: Page) => page.getByTestId('output')
const runButton = (page: Page) => page.getByRole('button', { name: 'Run', exact: true })
const submit = (page: Page) => page.getByRole('button', { name: 'Submit' })
const grade = (page: Page) => page.getByTestId('grade')

async function openSqlExercise(page: Page) {
  await page.goto('/#/lesson/fixture')
  await page.getByRole('tablist', { name: 'Exercises' }).getByRole('tab', { name: /SQL/ }).click()
  await expect(editor(page)).toContainText('ALTER TABLE teams ADD COLUMN is_public boolean;')
  await expect(page.locator('.runtime-status')).toBeEmpty({ timeout: 60_000 })
}

async function setCode(page: Page, code: string) {
  await editor(page).click()
  await page.keyboard.press('ControlOrMeta+a')
  await page.keyboard.insertText(code)
}

test('Run shows the result of the last statement as a table', async ({ page }) => {
  await openSqlExercise(page)
  await runButton(page).click()
  const table = page.getByTestId('sql-result').getByRole('table')
  await expect(table.getByRole('columnheader')).toHaveText(['id', 'name', 'is_public'])
  await expect(table.getByRole('row')).toHaveCount(4)
  await expect(table.getByRole('row').nth(3)).toHaveText(/3\s*Trick Room\s*NULL/)
  await expect(page.getByTestId('sql-result')).toContainText('3 rows')
  await expect(output(page)).toContainText('Ran 3 statements in')
})

test('every run starts from the same seed data', async ({ page }) => {
  await openSqlExercise(page)
  await setCode(page, "INSERT INTO teams (id, name) VALUES (7, 'Leftover');\nSELECT count(*) AS teams FROM teams;")
  await runButton(page).click()
  await expect(page.getByTestId('sql-result').getByRole('cell')).toHaveText(['3'])
  await runButton(page).click()
  await expect(output(page)).toContainText('Ran 2 statements')
  await expect(page.getByTestId('sql-result').getByRole('cell')).toHaveText(['3'])
})

test('Submit grades the starter with the concept message, then the solution passes', async ({ page }) => {
  await openSqlExercise(page)
  await submit(page).click()
  await expect(grade(page)).toContainText('1 of 3 checks failed.')
  await expect(grade(page).getByRole('list', { name: 'Checks' }).getByRole('listitem')).toHaveText([
    'Passed: The result has the right columns',
    'Passed: The result has the right number of rows',
    'Failed: The rows match, in the right order',
  ])
  await expect(page.getByTestId('rethink')).toContainText('Some teams have no value for is_public.')
  await expect(grade(page)).toContainText('Hint 1 is unlocked.')

  await setCode(page, fixtureFile('solution.sql'))
  await submit(page).click()
  await expect(grade(page)).toContainText('All 3 checks passed.')
})

test('a SQL error shows the message and the line it happened on', async ({ page }) => {
  await openSqlExercise(page)
  await setCode(page, 'SELECT 1;\nSELEC name FROM teams;')
  await runButton(page).click()
  await expect(page.getByTestId('sql-error')).toContainText('ERROR: syntax error at or near "SELEC" (line 2)')
  await expect(output(page)).toContainText('Postgres stopped at an error.')

  await submit(page).click()
  await expect(grade(page)).toContainText("Your code couldn't run, so no checks ran.")
})

test('a script that ends without a SELECT says how to see a result', async ({ page }) => {
  await openSqlExercise(page)
  await setCode(page, "INSERT INTO teams (id, name) VALUES (3, 'Trick Room');")
  await runButton(page).click()
  await expect(output(page)).toContainText("The last statement didn't return rows; it changed 1 row.")
  await submit(page).click()
  await expect(page.getByTestId('rethink')).toContainText("This check couldn't run")
  await expect(page.getByTestId('rethink')).toContainText("didn't return any rows to check")
})

test('a query that never finishes is stopped, and the next run works', async ({ page }) => {
  await openSqlExercise(page)
  await setCode(page, 'WITH RECURSIVE r(n) AS (SELECT 1 UNION ALL SELECT n + 1 FROM r)\nSELECT count(*) FROM r;')
  const started = Date.now()
  await runButton(page).click()
  await expect(output(page)).toContainText('Timed out after 5 seconds', { timeout: 10_000 })
  expect(Date.now() - started).toBeLessThan(6_500)
  await expect(output(page)).toContainText('A query may be stuck')

  await setCode(page, 'SELECT 42 AS answer;')
  await expect(runButton(page)).toBeEnabled({ timeout: 60_000 })
  await runButton(page).click()
  await expect(page.getByTestId('sql-result').getByRole('cell')).toHaveText(['42'], { timeout: 60_000 })
})

test('Ctrl+Enter runs SQL, and the unlocked solution is shown as SQL', async ({ page }) => {
  await openSqlExercise(page)
  await setCode(page, 'SELECT 1 AS one;')
  await page.keyboard.press('ControlOrMeta+Enter')
  await expect(page.getByTestId('sql-result').getByRole('cell')).toHaveText(['1'])

  await setCode(page, fixtureFile('starter.sql'))
  await submit(page).click()
  await expect(grade(page)).toContainText('1 of 3 checks failed.')
  await submit(page).click()
  await expect(grade(page)).toContainText('Hint 2 and the solution are unlocked.')
  const stuck = page.getByTestId('exercise-brief').getByTestId('stuck')
  await stuck.getByRole('button', { name: 'Show the solution' }).click()
  await expect(stuck.locator('code.language-sql')).toContainText('NOT NULL DEFAULT false')
})
