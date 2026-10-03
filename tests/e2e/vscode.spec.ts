// VS Code sync. Playwright can't use the real folder picker, so these tests hand backpy a folder
// in the browser's private file system (same File System Access API, no dialog), and play the
// part of VS Code by writing to that folder directly.
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { chromium, expect, test as base, type BrowserContext, type Page } from '@playwright/test'

// A normal browser profile, like Sean's Chrome. Playwright's default contexts are incognito-style,
// and Chromium crashes there when it reads a folder handle back from IndexedDB.
const test = base.extend<{ context: BrowserContext; page: Page }>({
  context: async ({ baseURL }, use) => {
    const profile = mkdtempSync(join(tmpdir(), 'backpy-profile-'))
    const context = await chromium.launchPersistentContext(profile, { baseURL, viewport: { width: 1280, height: 800 } })
    await use(context)
    await context.close()
    rmSync(profile, { recursive: true, force: true })
  },
  page: async ({ context }, use) => use(context.pages()[0] ?? (await context.newPage())),
})

test.describe.configure({ timeout: 90_000 })

const fixtureFile = (exercise: string, file: string) =>
  readFileSync(`content/_fixtures/000-fixture/exercises/${exercise}/${file}`, 'utf8')
const editor = (page: Page) => page.getByTestId('code-editor').locator('.cm-content')
const banner = (page: Page) => page.getByTestId('vscode-banner')
const exerciseTab = (page: Page, name: RegExp) => page.getByRole('tablist', { name: 'Exercises' }).getByRole('tab', { name })

/** Runs in the page: the test folder standing in for the one Sean picks. */
const TEST_FOLDER = 'vscode-test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript((folder) => {
    // One test turns the test picker off to behave like a real browser after a reload.
    if (sessionStorage.getItem('realPicker') !== '1') {
      window.__backpyPickFolder = async () => (await navigator.storage.getDirectory()).getDirectoryHandle(folder, { create: true })
    }
    // Record vscode:// links instead of trying to open VS Code.
    const w = window as unknown as { __opened: string[] }
    w.__opened = []
    window.__backpyOpenUrl = (url) => w.__opened.push(url)
  }, TEST_FOLDER)
  await page.goto('/#/lesson/fixture')
  await page.evaluate(async () => {
    const root = await navigator.storage.getDirectory()
    for await (const name of (root as unknown as { keys(): AsyncIterable<string> }).keys()) {
      await root.removeEntry(name, { recursive: true })
    }
  })
  await expect(editor(page)).toBeVisible()
  await expect(page.locator('.runtime-status')).toBeEmpty({ timeout: 60_000 })
})

/** Writes a file the way VS Code would when Sean saves. */
async function saveInVsCode(page: Page, path: string, text: string) {
  await page.evaluate(
    async ({ folder, path, text }) => {
      let dir = await (await navigator.storage.getDirectory()).getDirectoryHandle(folder, { create: true })
      const parts = path.split('/')
      for (const part of parts.slice(0, -1)) dir = await dir.getDirectoryHandle(part, { create: true })
      const writable = await (await dir.getFileHandle(parts[parts.length - 1], { create: true })).createWritable()
      await writable.write(text)
      await writable.close()
    },
    { folder: TEST_FOLDER, path, text },
  )
}

async function readFromDisk(page: Page, path: string) {
  return page.evaluate(
    async ({ folder, path }) => {
      let dir = await (await navigator.storage.getDirectory()).getDirectoryHandle(folder)
      const parts = path.split('/')
      for (const part of parts.slice(0, -1)) dir = await dir.getDirectoryHandle(part)
      return (await (await dir.getFileHandle(parts[parts.length - 1])).getFile()).text()
    },
    { folder: TEST_FOLDER, path },
  )
}

async function listFolder(page: Page, path: string) {
  return page.evaluate(
    async ({ folder, path }) => {
      let dir = await (await navigator.storage.getDirectory()).getDirectoryHandle(folder)
      for (const part of path.split('/')) dir = await dir.getDirectoryHandle(part)
      const names: string[] = []
      for await (const name of (dir as unknown as { keys(): AsyncIterable<string> }).keys()) names.push(name)
      return names.sort()
    },
    { folder: TEST_FOLDER, path },
  )
}

const MAKE_TEAM = '000-fixture/01-make-a-team'

test('Edit in VS Code writes only main.py, with the starter, to <lesson>/<exercise>/', async ({ page }) => {
  await page.getByRole('button', { name: 'Edit in VS Code' }).click()
  await expect(banner(page)).toContainText(`Editing in VS Code: ${MAKE_TEAM}/main.py`)
  expect(await readFromDisk(page, `${MAKE_TEAM}/main.py`)).toBe(fixtureFile('01-make-a-team', 'starter.py'))
  expect(await listFolder(page, MAKE_TEAM)).toEqual(['main.py'])

  // The browser editor is read-only while VS Code owns the file.
  await editor(page).click()
  await page.keyboard.type('typed in the browser')
  await expect(editor(page)).not.toContainText('typed in the browser')
})

test('a save in VS Code shows up in the browser within a second or two, and Submit grades it', async ({ page }) => {
  await page.getByRole('button', { name: 'Edit in VS Code' }).click()
  await expect(banner(page)).toBeVisible()
  await saveInVsCode(page, `${MAKE_TEAM}/main.py`, fixtureFile('01-make-a-team', 'solution.py'))
  await expect(editor(page)).toContainText('if members is None:', { timeout: 2_000 })
  await expect(banner(page)).toContainText('Last save received at')
  await page.getByRole('button', { name: 'Submit' }).click()
  await expect(page.getByTestId('grade')).toContainText('All 5 checks passed.')
})

test('Submit straight after a save uses the saved file, without waiting for the next check', async ({ page }) => {
  await exerciseTab(page, /Bug hunt/).click()
  await page.getByRole('button', { name: 'Edit in VS Code' }).click()
  await expect(banner(page)).toContainText('000-fixture/02-shared-team-bug/main.py')
  await saveInVsCode(page, '000-fixture/02-shared-team-bug/main.py', fixtureFile('02-shared-team-bug', 'solution.py'))
  await page.getByRole('button', { name: 'Submit' }).click()
  await expect(page.getByTestId('grade')).toContainText('All 2 checks passed.')
})

test('work already in the folder is kept, not overwritten', async ({ page }) => {
  const earlierWork = 'def make_team(name, members=None, public=False):\n    # started this yesterday\n    pass\n'
  await saveInVsCode(page, `${MAKE_TEAM}/main.py`, earlierWork)
  await page.getByRole('button', { name: 'Edit in VS Code' }).click()
  await expect(editor(page)).toContainText('# started this yesterday')
  expect(await readFromDisk(page, `${MAKE_TEAM}/main.py`)).toBe(earlierWork)
})

test('Stop hands editing back to the browser with the latest code', async ({ page }) => {
  await page.getByRole('button', { name: 'Edit in VS Code' }).click()
  await expect(banner(page)).toBeVisible()
  await saveInVsCode(page, `${MAKE_TEAM}/main.py`, 'print("from vs code")\n')
  await expect(editor(page)).toContainText('print("from vs code")', { timeout: 2_000 })
  await banner(page).getByRole('button', { name: 'Stop' }).click()
  await expect(banner(page)).toHaveCount(0)
  await editor(page).click()
  await page.keyboard.press('ControlOrMeta+End')
  await page.keyboard.type('# browser again')
  await expect(editor(page)).toContainText('# browser again')
})

test('Reset while editing in VS Code puts the starter into the file too', async ({ page }) => {
  await page.getByRole('button', { name: 'Edit in VS Code' }).click()
  await expect(banner(page)).toBeVisible()
  await saveInVsCode(page, `${MAKE_TEAM}/main.py`, 'print("half done")\n')
  await expect(editor(page)).toContainText('half done', { timeout: 2_000 })
  await page.getByRole('button', { name: 'Reset' }).click()
  await expect(page.getByTestId('run-summary')).toContainText(`Back to the starter code, here and in ${MAKE_TEAM}/main.py.`)
  await expect(editor(page)).toContainText('def make_team(name):')
  expect(await readFromDisk(page, `${MAKE_TEAM}/main.py`)).toBe(fixtureFile('01-make-a-team', 'starter.py'))
})

test('a linked file that gets deleted says so', async ({ page }) => {
  await page.getByRole('button', { name: 'Edit in VS Code' }).click()
  await expect(banner(page)).toBeVisible()
  await page.evaluate(async ({ folder, path }) => {
    let dir = await (await navigator.storage.getDirectory()).getDirectoryHandle(folder)
    for (const part of path.split('/')) dir = await dir.getDirectoryHandle(part)
    await dir.removeEntry('main.py')
  }, { folder: TEST_FOLDER, path: MAKE_TEAM })
  await expect(banner(page).getByRole('alert')).toContainText('main.py was deleted or moved.', { timeout: 3_000 })
})

const opened = (page: Page) => page.evaluate(() => (window as unknown as { __opened: string[] }).__opened)

test('pasting the folder path once opens VS Code at the file, and later links open it straight away', async ({ page }) => {
  await page.getByRole('button', { name: 'Edit in VS Code' }).click()
  await expect(banner(page)).toContainText('In folder vscode-test.')
  expect(await opened(page)).toEqual([])

  // Windows' "Copy as path" wraps the path in quotes; that's accepted as-is.
  await banner(page).getByRole('textbox').fill(String.raw`"C:\Users\Sean Thompson Jr\Documents\vscode-test"`)
  await banner(page).getByRole('button', { name: 'Save and open' }).click()
  await expect.poll(() => opened(page)).toEqual([
    'vscode://file/C:/Users/Sean%20Thompson%20Jr/Documents/vscode-test/000-fixture/01-make-a-team/main.py',
  ])
  await expect(banner(page).getByRole('textbox')).toHaveCount(0)
  await expect(banner(page).getByRole('button', { name: 'Open in VS Code' })).toBeVisible()

  await exerciseTab(page, /Bug hunt/).click()
  await page.getByRole('button', { name: 'Edit in VS Code' }).click()
  await expect.poll(() => opened(page)).toHaveLength(2)
  expect((await opened(page))[1]).toBe(
    'vscode://file/C:/Users/Sean%20Thompson%20Jr/Documents/vscode-test/000-fixture/02-shared-team-bug/main.py',
  )
})

test('a path that is not the picked folder is refused with a clear message', async ({ page }) => {
  await page.getByRole('button', { name: 'Edit in VS Code' }).click()
  await banner(page).getByRole('textbox').fill(String.raw`C:\Users\Sean\Documents\some-other-folder`)
  await banner(page).getByRole('button', { name: 'Save and open' }).click()
  await expect(banner(page).getByRole('alert')).toContainText(
    'That path ends in "some-other-folder", but the folder you picked is "vscode-test".',
  )
  await banner(page).getByRole('textbox').fill('vscode-test')
  await banner(page).getByRole('button', { name: 'Save and open' }).click()
  await expect(banner(page).getByRole('alert')).toContainText("doesn't look like a full path")
  expect(await opened(page)).toEqual([])
})

test('Change folder moves the exercise into a newly picked folder', async ({ page }) => {
  await page.getByRole('button', { name: 'Edit in VS Code' }).click()
  await expect(banner(page)).toContainText('In folder vscode-test.')
  await page.evaluate(() => {
    window.__backpyPickFolder = async () => (await navigator.storage.getDirectory()).getDirectoryHandle('new-folder', { create: true })
  })
  await banner(page).getByRole('button', { name: 'Change folder' }).click()
  await expect(page.locator('.work-toolbar [role=alert]')).toHaveCount(0)
  await expect(banner(page)).toContainText('In folder new-folder.')
  const inNewFolder = await page.evaluate(async () => {
    const dir = await (await (await (await navigator.storage.getDirectory()).getDirectoryHandle('new-folder')).getDirectoryHandle('000-fixture')).getDirectoryHandle('01-make-a-team')
    return (await (await dir.getFileHandle('main.py')).getFile()).text()
  })
  expect(inNewFolder).toBe(fixtureFile('01-make-a-team', 'starter.py'))
})

test("a remembered folder inside the browser's own storage is never reused: you're asked to pick again", async ({ page }) => {
  // Link once, so a folder from the browser's private storage gets remembered (as happened in the pane).
  await page.getByRole('button', { name: 'Edit in VS Code' }).click()
  await expect(banner(page)).toContainText('In folder vscode-test.')
  await banner(page).getByRole('button', { name: 'Stop' }).click()

  // Come back later, like a real browser: reload with no test picker, and count how often the
  // real picker is shown.
  await page.evaluate(() => sessionStorage.setItem('realPicker', '1'))
  await page.reload()
  await expect(editor(page)).toBeVisible()
  await page.evaluate(() => {
    const w = window as unknown as { __pickerShown: number }
    w.__pickerShown = 0
    window.showDirectoryPicker = async () => {
      w.__pickerShown++
      return (await navigator.storage.getDirectory()).getDirectoryHandle('picked-again', { create: true })
    }
  })
  await page.getByRole('button', { name: 'Edit in VS Code' }).click()
  await expect(banner(page)).toContainText('In folder picked-again.')
  expect(await page.evaluate(() => (window as unknown as { __pickerShown: number }).__pickerShown)).toBe(1)
})

test('with the editor hidden, saves in VS Code keep syncing and Submit from the rail grades them', async ({ page }) => {
  await page.getByRole('button', { name: 'Edit in VS Code' }).click()
  await expect(banner(page)).toBeVisible()
  await page.getByRole('button', { name: 'Hide editor' }).click()
  await expect(page.getByTestId('editor-rail')).toContainText('Editing 000-fixture/01-make-a-team/main.py in VS Code')
  await saveInVsCode(page, `${MAKE_TEAM}/main.py`, fixtureFile('01-make-a-team', 'solution.py'))
  await page.getByTestId('editor-rail').getByRole('button', { name: 'Submit' }).click()
  await expect(page.getByTestId('grade')).toContainText('All 5 checks passed.')
  await expect(editor(page)).toContainText('if members is None:')
})
