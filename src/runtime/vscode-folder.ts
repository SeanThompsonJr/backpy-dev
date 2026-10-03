// VS Code sync (BUILD_PLAN.md, milestone 5b): exercises are written to a folder Sean picks,
// as <lesson>/<exercise>/main.py, and read back when he saves in VS Code. Hidden tests are
// never written. Uses the File System Access API, so it needs Chrome or Edge.

const DB_NAME = 'backpy'
const STORE = 'handles'
const ROOT_KEY = 'vscode-folder'
const PATH_KEY = 'backpy.vscodeFolderPath'

export const vscodeSyncSupported = () =>
  typeof window !== 'undefined' && (typeof window.showDirectoryPicker === 'function' || !!window.__backpyPickFolder)

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => request.result.createObjectStore(STORE)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

// The chosen folder is remembered in IndexedDB: a folder handle can't be stored in localStorage.
async function storeRoot(root: FileSystemDirectoryHandle | undefined) {
  const db = await openDb()
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite')
      if (root) tx.objectStore(STORE).put(root, ROOT_KEY)
      else tx.objectStore(STORE).delete(ROOT_KEY)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } finally {
    db.close()
  }
}

async function loadRoot(): Promise<FileSystemDirectoryHandle | undefined> {
  try {
    const db = await openDb()
    try {
      return await new Promise((resolve, reject) => {
        const request = db.transaction(STORE).objectStore(STORE).get(ROOT_KEY)
        request.onsuccess = () => resolve(request.result as FileSystemDirectoryHandle | undefined)
        request.onerror = () => reject(request.error)
      })
    } finally {
      db.close()
    }
  } catch {
    return undefined
  }
}

/** True for a folder inside the browser's own private storage, which Sean can't see on disk. */
async function isBrowserStorage(handle: FileSystemDirectoryHandle) {
  try {
    const browserRoot = await navigator.storage.getDirectory()
    return (await handle.isSameEntry(browserRoot)) || (await browserRoot.resolve(handle)) !== null
  } catch {
    return false
  }
}

async function canWrite(handle: FileSystemHandle) {
  if ((await handle.queryPermission({ mode: 'readwrite' })) === 'granted') return true
  return (await handle.requestPermission({ mode: 'readwrite' })) === 'granted'
}

/** The folder in use this session, so the remembered one is read from IndexedDB at most once per page load. */
let sessionRoot: FileSystemDirectoryHandle | undefined

async function pickRoot(): Promise<FileSystemDirectoryHandle> {
  const root = window.__backpyPickFolder
    ? await window.__backpyPickFolder()
    : await window.showDirectoryPicker!({ id: 'backpy', mode: 'readwrite', startIn: 'documents' })
  if (!(await canWrite(root))) throw new Error('backpy needs permission to edit files in that folder.')
  await storeRoot(root)
  forgetFolderPath()
  sessionRoot = root
  return root
}

/**
 * The remembered folder if it's still usable, otherwise asks Sean to pick one. Must run from a click.
 * A remembered folder inside the browser's private storage is never reused (outside tests).
 */
async function getRoot(): Promise<FileSystemDirectoryHandle> {
  if (sessionRoot && (await canWrite(sessionRoot))) return sessionRoot
  const remembered = await loadRoot()
  const usable =
    remembered && (window.__backpyPickFolder || !(await isBrowserStorage(remembered))) && (await canWrite(remembered))
  if (!usable) return pickRoot()
  sessionRoot = remembered
  return remembered
}

/** Asks Sean for a different folder. Must run from a click. */
export const changeFolder = () => pickRoot()

// ---------- The folder's location on disk, for opening files in VS Code ----------
// Browsers never reveal where a picked folder is, so Sean pastes its path once. It's a
// per-browser convenience, so it lives in localStorage.

export function savedFolderPath(): string | undefined {
  try {
    return localStorage.getItem(PATH_KEY) ?? undefined
  } catch {
    return undefined
  }
}

function forgetFolderPath() {
  try {
    localStorage.removeItem(PATH_KEY)
  } catch {
    // nothing remembered
  }
}

/**
 * Checks and saves a pasted folder path. Accepts what Windows' "Copy as path" gives
 * (quotes included). Returns an error message, or undefined if it was saved.
 */
export function saveFolderPath(pasted: string, folderName: string): string | undefined {
  const path = pasted.trim().replace(/^["']|["']$/g, '').replace(/[\\/]+$/, '')
  if (!/^([a-zA-Z]:[\\/]|\/)/.test(path)) {
    return 'That doesn\'t look like a full path. It should start with a drive letter, like C:\\Users\\…'
  }
  const lastPart = path.split(/[\\/]/).pop() ?? ''
  if (lastPart.toLowerCase() !== folderName.toLowerCase()) {
    return `That path ends in "${lastPart}", but the folder you picked is "${folderName}". Paste the path of "${folderName}" itself.`
  }
  try {
    localStorage.setItem(PATH_KEY, path)
  } catch {
    return "Your browser didn't let backpy save the path. Check that site data is allowed for this page."
  }
  return undefined
}

/** A vscode:// link that opens the file in VS Code (the browser asks permission first). */
export function vscodeFileUrl(folderPath: string, relativePath: string): string {
  const full = `${folderPath.replace(/\\/g, '/')}/${relativePath}`
  return `vscode://file/${encodeURI(full.startsWith('/') ? full.slice(1) : full)}`
}

/** Opens a vscode:// link. e2e tests watch these through __backpyOpenUrl instead. */
export function openInVsCode(url: string) {
  if (window.__backpyOpenUrl) return window.__backpyOpenUrl(url)
  const link = document.createElement('a')
  link.href = url
  link.click()
}

// ---------- Linking an exercise to its file ----------

export interface LinkedFile {
  handle: FileSystemFileHandle
  /** Shown to Sean, e.g. "000-fixture/01-make-a-team/main.py" */
  path: string
  /** Name of the folder Sean picked */
  folderName: string
  /** The text last read from or written to the file */
  lastText: string
}

export interface LinkResult {
  file: LinkedFile
  /** The file's contents: the existing file if Sean already worked on it there, else what was written */
  text: string
}

async function createFile(root: FileSystemDirectoryHandle, lessonFolder: string, exerciseFolder: string, fileName: string, code: string) {
  const lessonDir = await root.getDirectoryHandle(lessonFolder, { create: true })
  const exerciseDir = await lessonDir.getDirectoryHandle(exerciseFolder, { create: true })
  try {
    const handle = await exerciseDir.getFileHandle(fileName)
    return { handle, text: await (await handle.getFile()).text() }
  } catch {
    const handle = await exerciseDir.getFileHandle(fileName, { create: true })
    await writeFile(handle, code)
    return { handle, text: code }
  }
}

/**
 * Links an exercise to <folder>/<lesson>/<exercise>/main.py (or main.sql). If the file already
 * exists it's kept and read, so earlier work in VS Code is never overwritten.
 */
export async function linkExercise(lessonFolder: string, exerciseFolder: string, fileName: string, code: string): Promise<LinkResult> {
  let root = await getRoot()
  let created
  try {
    created = await createFile(root, lessonFolder, exerciseFolder, fileName, code)
  } catch (error) {
    // The remembered folder was deleted or moved on disk: ask for a folder again.
    if ((error as DOMException).name !== 'NotFoundError') throw error
    root = await pickRoot()
    created = await createFile(root, lessonFolder, exerciseFolder, fileName, code)
  }
  const path = `${lessonFolder}/${exerciseFolder}/${fileName}`
  return { file: { handle: created.handle, path, folderName: root.name, lastText: created.text }, text: created.text }
}

export async function writeFile(handle: FileSystemFileHandle, text: string) {
  const writable = await handle.createWritable()
  await writable.write(text)
  await writable.close()
}

/**
 * The file's text if it differs from what was last seen, else undefined. Throws if the file is gone.
 * Compares contents rather than timestamps, so two quick saves in the same millisecond aren't missed.
 */
export async function readIfChanged(file: LinkedFile): Promise<string | undefined> {
  const text = await (await file.handle.getFile()).text()
  return text === file.lastText ? undefined : text
}
