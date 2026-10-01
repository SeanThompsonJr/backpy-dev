import { expect, test } from '@playwright/test'
import raw from '../../curriculum/curriculum.json' with { type: 'json' }
import type { RawCurriculum } from '../../shared/curriculum'

test('home shows every tier, section and lesson from curriculum.json', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('124 lessons from first script to first job')
  await expect(page.getByTestId('tier')).toHaveCount(4)
  await expect(page.getByTestId('section')).toHaveCount(27)
  await expect(page.getByTestId('lesson-row')).toHaveCount(124)

  const ids = await page.getByTestId('lesson-row').evaluateAll((rows) => rows.map((r) => Number(r.getAttribute('data-lesson-id'))))
  expect(ids).toEqual(Array.from({ length: 124 }, (_, i) => i + 1))

  await expect(page.getByTestId('coverage-tag')).toHaveCount(124)
  await expect(page.locator('[data-lesson-id="1"] [data-testid="coverage-tag"]')).toContainText('sources')
  await expect(page.locator('[data-lesson-id="29"] [data-testid="coverage-tag"]')).toContainText('claude')
  await expect(page.locator('[data-lesson-id="16"] [data-testid="coverage-tag"]')).toContainText('partial')
})

test('optional lessons are tagged and others are not', async ({ page }) => {
  await page.goto('/')
  const optional = page.locator('[data-testid="lesson-row"]:has(.tag-optional)')
  await expect(optional).toHaveCount(2)
  await expect(page.locator('[data-lesson-id="75"] .tag-optional')).toHaveText('optional')
  await expect(page.locator('[data-lesson-id="105"] .tag-optional')).toHaveText('optional')
})

test('each section shows its checkpoint', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('.checkpoint')).toHaveCount(27)
  await expect(page.locator('.checkpoint').first()).toContainText('Draw the path of one PokeTeam request')
})

test('a lesson row opens that lesson', async ({ page }) => {
  const lesson15 = (raw as RawCurriculum).tiers.flatMap((t) => t.sections.flatMap((s) => s.lessons)).find((l) => l.id === 15)!
  await page.goto('/')
  await page.locator('[data-lesson-id="15"]').click()
  await expect(page).toHaveURL(/#\/lesson\/15$/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(lesson15.title)
})

test('opening a lesson from far down the map starts at the top, and Back returns to the same spot', async ({ page }) => {
  await page.goto('/')
  const row = page.locator('[data-lesson-id="100"]')
  await row.scrollIntoViewIfNeeded()
  const homeScroll = await page.evaluate(() => window.scrollY)
  expect(homeScroll).toBeGreaterThan(1000)
  await row.click()
  await expect(page).toHaveURL(/#\/lesson\/100$/)
  expect(await page.evaluate(() => window.scrollY)).toBe(0)
  await page.goBack()
  await expect(row).toBeVisible()
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(homeScroll - 50)
})

test('the map fits a phone screen without sideways scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/')
  await expect(page.getByTestId('lesson-row')).toHaveCount(124)
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(overflow).toBeLessThanOrEqual(0)
})
