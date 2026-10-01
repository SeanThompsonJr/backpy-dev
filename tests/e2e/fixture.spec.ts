import { expect, test } from '@playwright/test'

test('the fixture lesson loads and shows every part of the format', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: 'Open the fixture lesson' }).click()
  await expect(page).toHaveURL(/#\/lesson\/fixture$/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Fixture: default arguments that remember too much')
  await expect(page.getByRole('alert')).toHaveCount(0)

  await expect(page.getByTestId('lesson-section').locator('summary')).toHaveText([
    'Why this matters',
    'The concept',
    'Worked example',
    'What breaks',
    'Check yourself',
  ])
  await expect(page.getByTestId('code-block').locator('code')).toHaveText([
    'python run',
    'python run',
    'sql run',
    'sql run',
    'python broken TypeError',
  ])
  await expect(page.getByTestId('quiz-question')).toHaveCount(3)
  const types = await page.getByTestId('exercise').evaluateAll((els) => els.map((e) => e.getAttribute('data-type')))
  expect(types).toEqual(['code', 'bug_hunt', 'sql', 'local'])
})
