// Section 01 (Orientation) as Sean sees it: every lesson opens, and a real bug hunt grades.
import { readFileSync } from 'node:fs'
import { expect, test, type Page } from '@playwright/test'
import { buildCurriculum, type RawCurriculum } from '../../shared/curriculum'
import { LESSON_SECTIONS } from '../../shared/schema'

test.describe.configure({ timeout: 90_000 })
test.use({ viewport: { width: 1280, height: 800 } })

const curriculum = buildCurriculum(JSON.parse(readFileSync('curriculum/curriculum.json', 'utf8')) as RawCurriculum)
const orientation = curriculum.sectionBySlug.get('01-orientation')!
const lessonText = (page: Page) => page.locator('.left-view-lesson')
const editor = (page: Page) => page.getByTestId('code-editor').locator('.cm-content')
const grade = (page: Page) => page.getByTestId('grade')

for (const lesson of orientation.lessons) {
  test(`lesson ${lesson.id} opens with its title, all five sections and a quiz`, async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    await page.goto(`/#/lesson/${lesson.id}`)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(lesson.title)
    for (const section of LESSON_SECTIONS) {
      await expect(lessonText(page).getByRole('heading', { level: 2, name: section, exact: true })).toBeVisible()
    }
    await expect(editor(page)).toBeVisible()
    await expect(page.getByTestId('lesson-page').getByText(/Question 1 of \d/)).toBeVisible()

    // Every Check yourself question says where its answer is, and jumps there.
    const questions = lessonText(page).locator('.check-jump')
    expect(await questions.count()).toBeGreaterThan(0)
    for (const label of await questions.locator('.check-where').allTextContents()) {
      expect(label).toMatch(/^Answer in: \S/)
    }
    await questions.last().click()
    await expect(page.locator('.prose :is(h2, h3):focus')).toBeInViewport()
    expect(errors).toEqual([])
  })
}

test('the "We\'re out of that" bug hunt: the starter fails with readable checks, the fix passes', async ({ page }) => {
  const dir = 'content/tier-1/01-orientation/003-the-pieces/exercises/01-were-out-of-that'
  await page.goto('/#/lesson/3')
  await expect(page.locator('.runtime-status')).toBeEmpty({ timeout: 60_000 })

  await page.getByRole('button', { name: 'Submit' }).click()
  await expect(grade(page)).toContainText('2 of 3 checks failed.')
  await expect(grade(page).getByRole('list', { name: 'Checks' }).getByRole('listitem')).toHaveText([
    'Passed: A Pokémon that exists comes back with 200 and its data',
    'Failed: A missing Pokémon gets the not found status',
    'Failed: The not found body names the missing Pokémon',
  ])

  await editor(page).click()
  await page.keyboard.press('ControlOrMeta+a')
  await page.keyboard.insertText(readFileSync(`${dir}/solution.py`, 'utf8'))
  await page.getByRole('button', { name: 'Submit' }).click()
  await expect(grade(page)).toContainText('All 3 checks passed.')
})
