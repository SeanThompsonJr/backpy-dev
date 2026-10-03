import { readFileSync } from 'node:fs'
import { expect, test, type Page } from '@playwright/test'

test.describe.configure({ timeout: 90_000 })

const editor = (page: Page) => page.getByTestId('code-editor').locator('.cm-content')
const rail = (page: Page) => page.getByTestId('editor-rail')
const hideButton = (page: Page) => page.getByRole('button', { name: 'Hide editor' })

async function openFixture(page: Page) {
  await page.goto('/#/lesson/fixture')
  await expect(editor(page)).toBeVisible()
}

test.describe('desktop', () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  test('Hide editor gives the lesson the full width and leaves a rail with Run and Submit', async ({ page }) => {
    await openFixture(page)
    await expect(hideButton(page)).toHaveAttribute('aria-expanded', 'true')
    await hideButton(page).click()

    await expect(editor(page)).toBeHidden()
    await expect(page.getByRole('region', { name: 'Output' })).toBeHidden()
    await expect(rail(page).getByRole('button', { name: 'Show editor' })).toHaveAttribute('aria-expanded', 'false')
    await expect(rail(page).getByRole('button', { name: 'Run' })).toBeVisible()
    await expect(rail(page).getByRole('button', { name: 'Submit' })).toBeVisible()

    // The column change animates briefly; measure once it settles.
    await expect.poll(async () => (await page.getByTestId('lesson-text').boundingBox())!.width).toBeGreaterThan(1200)
    expect((await page.getByRole('region', { name: 'Exercises' }).boundingBox())!.width).toBeLessThanOrEqual(64)
  })

  test('Show editor brings it back with your edits and output kept', async ({ page }) => {
    await openFixture(page)
    await expect(page.locator('.runtime-status')).toBeEmpty({ timeout: 60_000 })
    await editor(page).click()
    await page.keyboard.press('ControlOrMeta+a')
    await page.keyboard.insertText('print("still here")\n')
    await page.getByRole('button', { name: 'Run', exact: true }).click()
    await expect(page.getByTestId('output-text')).toHaveText('still here\n')

    await hideButton(page).click()
    await rail(page).getByRole('button', { name: 'Show editor' }).click()
    await expect(editor(page)).toContainText('print("still here")')
    await expect(page.getByTestId('output-text')).toHaveText('still here\n')
  })

  test('the choice is remembered when you come back', async ({ page }) => {
    await openFixture(page)
    await hideButton(page).click()
    await expect(rail(page)).toBeVisible()
    await page.reload()
    await expect(rail(page)).toBeVisible()
    await expect(editor(page)).toBeHidden()
  })

  test('Submit from the rail opens the editor side to show the result', async ({ page }) => {
    await openFixture(page)
    await expect(page.locator('.runtime-status')).toBeEmpty({ timeout: 60_000 })
    await editor(page).click()
    await page.keyboard.press('ControlOrMeta+a')
    await page.keyboard.insertText(readFileSync('content/_fixtures/000-fixture/exercises/01-make-a-team/solution.py', 'utf8'))
    await hideButton(page).click()
    await rail(page).getByRole('button', { name: 'Submit' }).click()
    await expect(rail(page)).toHaveCount(0)
    await expect(page.getByTestId('grade')).toContainText('All 5 checks passed.')
  })

  test('the rail shows how the last submit went', async ({ page }) => {
    await openFixture(page)
    await expect(page.locator('.runtime-status')).toBeEmpty({ timeout: 60_000 })
    await page.getByRole('button', { name: 'Submit' }).click()
    await expect(page.getByTestId('grade')).toContainText('5 of 5 checks failed.')
    await hideButton(page).click()
    await expect(rail(page)).toContainText('Last submit: 5 of 5 checks failed')
  })
})

test('phones keep the stacked layout, with nothing to hide', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await openFixture(page)
  await expect(hideButton(page)).toBeHidden()
  await expect(rail(page)).toHaveCount(0)
})
