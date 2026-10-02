import { expect, test, type Page } from '@playwright/test'

const openFixture = async (page: Page) => {
  await page.goto('/')
  await page.getByRole('link', { name: 'Open the fixture lesson' }).click()
  await expect(page).toHaveURL(/#\/lesson\/fixture$/)
  await expect(page.getByTestId('lesson-page')).toBeVisible()
}

const editorText = (page: Page) => page.getByTestId('code-editor').locator('.cm-content')
const exerciseTab = (page: Page, name: RegExp) => page.getByRole('tablist', { name: 'Exercises' }).getByRole('tab', { name })
const leftSide = (page: Page) => page.getByTestId('lesson-text')

test.describe('desktop', () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  test('lesson text sits left of the editor and output, each filling the window height', async ({ page }) => {
    await openFixture(page)
    const text = (await leftSide(page).boundingBox())!
    const work = (await page.getByRole('region', { name: 'Exercises' }).boundingBox())!
    expect(text.x).toBe(0)
    expect(work.x).toBeGreaterThanOrEqual(text.x + text.width - 1)
    expect(Math.abs(work.y - text.y)).toBeLessThan(2)
    expect(text.y + text.height).toBeCloseTo(800, 0)
    expect(work.y + work.height).toBeCloseTo(800, 0)
    await expect(page.getByRole('region', { name: 'Output' })).toBeVisible()
    // Only the two panes scroll; the page itself never does.
    expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeLessThanOrEqual(800)
  })

  test('lesson code blocks are syntax highlighted, and broken blocks say how they fail', async ({ page }) => {
    await openFixture(page)
    const blocks = page.locator('.code-block')
    await expect(blocks).toHaveCount(5)
    await expect(blocks.first().locator('.hljs-keyword').first()).toHaveText('def')
    const keywordColor = await blocks.first().locator('.hljs-keyword').first().evaluate((el) => getComputedStyle(el).color)
    const plainColor = await blocks.first().locator('pre').evaluate((el) => getComputedStyle(el).color)
    expect(keywordColor).not.toBe(plainColor)
    await expect(page.locator('.code-block[data-mode="broken"]')).toContainText('Broken on purpose: raises TypeError')
    await expect(page.locator('.code-block[data-mode="run"]')).toHaveCount(4)
  })

  test('verify-this names the exact statement, says what to check, and shows it in the text', async ({ page }) => {
    await openFixture(page)
    const note = page.getByRole('complementary', { name: 'Claims to verify' })
    const claim = note.getByTestId('claim')
    await expect(claim).toHaveCount(1)
    await expect(claim.locator('q')).toHaveText('Postgres evaluates a column default for every inserted row')
    await expect(claim).toContainText('in The concept')
    await expect(claim).toContainText('What to check: PostgreSQL documentation, CREATE TABLE, the DEFAULT clause')

    const mark = page.locator('mark.claim')
    await expect(mark).toHaveText('Postgres evaluates a column default for every inserted row')
    await claim.getByRole('button', { name: 'Show in lesson' }).click()
    await expect(mark).toBeFocused()
    await expect(mark).toBeInViewport()
    expect(await page.evaluate(() => window.scrollY)).toBe(0)
    expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeLessThanOrEqual(800)
  })

  test('the editor shows the starter code with Python highlighting', async ({ page }) => {
    await openFixture(page)
    await expect(editorText(page)).toContainText('def make_team(name):')
    const keyword = page.getByTestId('code-editor').locator('.cm-line span', { hasText: /^def$/ }).first()
    await expect(keyword).toHaveCSS('color', 'rgb(130, 180, 230)')
  })

  test('opening an exercise switches the left side to its scenario, and Lesson switches back', async ({ page }) => {
    await openFixture(page)
    const switcher = page.getByRole('tablist', { name: 'Left side shows' })
    await expect(switcher.getByRole('tab', { name: 'Lesson' })).toHaveAttribute('aria-selected', 'true')
    await expect(leftSide(page).getByRole('heading', { level: 1 })).toHaveText('Fixture: default values in Python and in Postgres')

    await exerciseTab(page, /Bug hunt/).click()
    await expect(switcher.getByRole('tab', { name: 'Exercise 2: Bug hunt' })).toHaveAttribute('aria-selected', 'true')
    const brief = page.getByTestId('exercise-brief')
    await expect(brief.getByRole('heading', { level: 1 })).toHaveText('Fix the shared-team bug')
    await expect(brief).toContainText('Exercise 2 of 4: Bug hunt')
    await expect(brief).toContainText('I made a brand-new team and it already had Pikachu in it.')
    await expect(page.getByText('Python creates the default')).toBeHidden()

    await switcher.getByRole('tab', { name: 'Lesson' }).click()
    await expect(page.getByText('Python creates the default')).toBeVisible()
    await expect(exerciseTab(page, /Bug hunt/)).toHaveAttribute('aria-selected', 'true')
    await switcher.getByRole('tab', { name: /Exercise 2/ }).click()
    await expect(brief).toBeVisible()
  })

  test('exercise tabs switch exercises and keep each one’s edits', async ({ page }) => {
    await openFixture(page)
    await expect(page.getByRole('tablist', { name: 'Exercises' }).getByRole('tab')).toHaveText([
      '1Code',
      '2Bug hunt',
      '3SQL',
      '4On your machine',
    ])

    await editorText(page).click()
    await page.keyboard.press('ControlOrMeta+End')
    await page.keyboard.type('# my edit')

    await exerciseTab(page, /SQL/).click()
    await expect(page.getByTestId('exercise-brief').getByRole('heading', { level: 1 })).toHaveText('Teams start private')
    await expect(editorText(page)).toContainText('ALTER TABLE teams ADD COLUMN is_public boolean;')

    await exerciseTab(page, /Code/).click()
    await expect(editorText(page)).toContainText('# my edit')

    await exerciseTab(page, /Code/).press('ArrowRight')
    await expect(exerciseTab(page, /Bug hunt/)).toBeFocused()
    await expect(editorText(page)).toContainText('def add_member(name, team=[]):')
  })

  test('a local exercise shows its instructions on the left and a checklist that survives tab switches', async ({ page }) => {
    await openFixture(page)
    await exerciseTab(page, /On your machine/).click()
    await expect(page.getByTestId('code-editor')).toHaveCount(0)
    await expect(page.getByTestId('exercise-brief')).toContainText('Run it from a terminal')
    const first = page.getByRole('checkbox', { name: /fix.py runs with python/ })
    await first.check()
    await exerciseTab(page, /SQL/).click()
    await exerciseTab(page, /On your machine/).click()
    await expect(first).toBeChecked()
  })
})

test.describe('phone', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('text and work stack in one column, with each scenario above its editor', async ({ page }) => {
    await openFixture(page)
    const text = (await leftSide(page).boundingBox())!
    const work = (await page.getByRole('region', { name: 'Exercises' }).boundingBox())!
    expect(work.y).toBeGreaterThanOrEqual(text.y + text.height - 1)
    expect(Math.round(work.width)).toBe(390)
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(overflow).toBeLessThanOrEqual(0)

    await expect(page.getByRole('tablist', { name: 'Left side shows' })).toBeHidden()
    const inline = page.getByTestId('exercise-brief-inline')
    await expect(inline).toContainText('PokeTeam’s "New team" button only asks for a name.'.replace('’', "'"))
    await exerciseTab(page, /Bug hunt/).click()
    await expect(inline).toContainText('I made a brand-new team')
    await expect(page.getByText('Python creates the default')).toBeVisible()
  })
})
