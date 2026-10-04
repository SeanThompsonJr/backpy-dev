import { useId, useRef, useState } from 'react'
import { Download, Upload } from 'lucide-react'
import { progress, parseProgressFile } from '../progress/store'
import type { ProgressFile } from '../progress/schema'

const doneCount = (file: ProgressFile) =>
  Object.entries(file.lessons).filter(([key, l]) => Number(key) > 0 && l.completedAt).length

function downloadExport() {
  const blob = new Blob([progress.export()], { type: 'application/json' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `backpy-progress-${new Date().toISOString().slice(0, 10)}.json`
  link.click()
  URL.revokeObjectURL(link.href)
}

type ImportState =
  | { step: 'idle' }
  | { step: 'confirm'; data: ProgressFile; fileName: string }
  | { step: 'error'; message: string }
  | { step: 'done'; lessonsDone: number }

/** Lessons done so far, plus export and import of the saved progress. */
export function ProgressStrip({ done, total }: { done: number; total: number }) {
  const [importState, setImportState] = useState<ImportState>({ step: 'idle' })
  const fileInput = useRef<HTMLInputElement>(null)
  const id = useId()

  const readFile = async (file: File) => {
    const result = parseProgressFile(await file.text())
    setImportState(result.ok ? { step: 'confirm', data: result.data, fileName: file.name } : { step: 'error', message: result.error })
  }

  return (
    <section className="progress-strip" aria-label="Your progress" data-testid="progress-strip">
      <div className="progress-summary">
        <p>
          <strong data-testid="lessons-done">{done}</strong> of {total} lessons done
        </p>
        <div
          className="progress-bar"
          role="progressbar"
          aria-label="Lessons done"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={done}
        >
          <span style={{ width: `${(done / total) * 100}%` }} />
        </div>
      </div>
      <div className="progress-actions">
        <button type="button" className="btn btn-ghost btn-small" onClick={downloadExport}>
          <Download size={14} aria-hidden="true" />
          Export progress
        </button>
        <button type="button" className="btn btn-ghost btn-small" onClick={() => fileInput.current?.click()}>
          <Upload size={14} aria-hidden="true" />
          Import progress
        </button>
        <input
          ref={fileInput}
          id={`${id}-file`}
          type="file"
          accept="application/json,.json"
          className="visually-hidden"
          tabIndex={-1}
          aria-label="Progress file to import"
          data-testid="import-file"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) void readFile(file)
            e.target.value = ''
          }}
        />
      </div>

      <div aria-live="polite">
        {importState.step === 'confirm' && (
          <div className="import-confirm" data-testid="import-confirm">
            <p>
              Replace your progress with <code>{importState.fileName}</code>? It has{' '}
              <strong>{doneCount(importState.data)}</strong> lessons done; this browser has <strong>{done}</strong>.
              Everything saved here now is replaced, so export first if you want to keep it.
            </p>
            <div className="import-confirm-actions">
              <button
                type="button"
                className="btn btn-submit btn-small"
                onClick={() => {
                  progress.replace(importState.data)
                  setImportState({ step: 'done', lessonsDone: doneCount(importState.data) })
                }}
              >
                Replace progress
              </button>
              <button type="button" className="btn btn-ghost btn-small" onClick={() => setImportState({ step: 'idle' })}>
                Cancel
              </button>
            </div>
          </div>
        )}
        {importState.step === 'error' && (
          <p className="import-message import-error" role="alert">
            {importState.message} Nothing was changed.
          </p>
        )}
        {importState.step === 'done' && (
          <p className="import-message">
            Progress imported: {importState.lessonsDone} lesson{importState.lessonsDone === 1 ? '' : 's'} done.
          </p>
        )}
      </div>
    </section>
  )
}
