import { expect, test, type Page } from '@playwright/test'

test.use({ viewport: { width: 1280, height: 800 } })

const quiz = (page: Page) => page.getByTestId('quiz')
const option = (page: Page, letter: string) => quiz(page).getByTestId('quiz-option').filter({ hasText: new RegExp(`^${letter}`) })
const feedback = (page: Page) => quiz(page).getByTestId('quiz-feedback')
const next = (page: Page) => quiz(page).getByRole('button', { name: /Next question|See your score/ })

async function openQuiz(page: Page) {
  await page.goto('/#/lesson/fixture')
  await quiz(page).scrollIntoViewIfNeeded()
  await expect(quiz(page).getByTestId('quiz-count')).toHaveText('Question 1 of 4')
}

test('one question at a time, with an explanation for whichever option you pick', async ({ page }) => {
  await openQuiz(page)
  await expect(quiz(page).getByTestId('quiz-option')).toHaveCount(4)
  await expect(next(page)).toBeDisabled()

  await option(page, 'A').click()
  await expect(feedback(page)).toContainText('A is incorrect')
  await expect(feedback(page)).toContainText("That's how many people expect it to work")
  await expect(option(page, 'A')).toContainText('(incorrect)')
  await expect(next(page)).toBeEnabled()

  await option(page, 'B').click()
  await expect(feedback(page)).toContainText('B is correct')
  await expect(feedback(page)).toContainText('stores that object on the function')

  await next(page).click()
  await expect(quiz(page).getByTestId('quiz-count')).toHaveText('Question 2 of 4')
  await expect(feedback(page)).toBeEmpty()
  await expect(next(page)).toBeDisabled()
})

test('code in a question shows as a highlighted code block, and code in options as code', async ({ page }) => {
  await openQuiz(page)
  await option(page, 'B').click()
  await next(page).click()
  const question = quiz(page).getByTestId('quiz-question')
  await expect(question.locator('.code-block .hljs-keyword').first()).toHaveText('def')
  await expect(question.locator('pre')).toContainText("print(add('eevee'))")
  await expect(option(page, 'B').locator('code')).toHaveText("['pikachu', 'eevee']")
})

test('the final score counts first tries only, and each question can be reopened', async ({ page }) => {
  await openQuiz(page)
  // Q1 wrong first then right, Q2 right, Q3 wrong, Q4 right: 2 of 4 on the first try.
  await option(page, 'A').click()
  await option(page, 'B').click()
  await next(page).click()
  await option(page, 'B').click()
  await next(page).click()
  await option(page, 'A').click()
  await next(page).click()
  await option(page, 'B').click()
  await expect(next(page)).toHaveText('See your score')
  await next(page).click()

  const result = quiz(page).getByTestId('quiz-result')
  await expect(result).toContainText('2 of 4 right on the first try.')
  await expect(result.getByRole('listitem')).toHaveText([
    /Missed on the first try: 1When does Python create/,
    /Right on the first try: 2Predict the output/,
    /Missed on the first try: 3Which default value is safe/,
    /Right on the first try: 4Predict the output/,
  ])

  await result.getByRole('button', { name: /Which default value is safe/ }).click()
  await expect(quiz(page).getByTestId('quiz-count')).toHaveText('Question 3 of 4')
  await expect(feedback(page)).toContainText('A is incorrect')
  await option(page, 'C').click()
  await expect(feedback(page)).toContainText('C is correct')
})

test('the quiz can be taken again from the start', async ({ page }) => {
  await openQuiz(page)
  for (let i = 0; i < 4; i++) {
    await option(page, 'B').click()
    await next(page).click()
  }
  await expect(quiz(page).getByTestId('quiz-result')).toBeVisible()
  await quiz(page).getByRole('button', { name: 'Take the quiz again' }).click()
  await expect(quiz(page).getByTestId('quiz-count')).toHaveText('Question 1 of 4')
  await expect(option(page, 'B')).not.toContainText('(correct)')
})
