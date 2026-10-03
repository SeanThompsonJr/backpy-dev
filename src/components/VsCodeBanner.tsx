import { useId, useState } from 'react'
import { ExternalLink, FileCode, FolderOpen } from 'lucide-react'
import type { LinkedFile } from '../runtime/vscode-folder'

export interface SyncedFile extends LinkedFile {
  /** When a save from VS Code last reached the browser */
  updatedAt?: Date
  /** e.g. the file was deleted while linked */
  error?: string
}

interface Props {
  link: SyncedFile
  /** The picked folder's full path on disk, once Sean has pasted it */
  folderPath?: string
  /** Returns an error message, or undefined once the path is saved */
  onSavePath: (pasted: string) => string | undefined
  onOpen: () => void
  onChangeFolder: () => void
  onStop: () => void
}

/** Shown above the editor while an exercise is being edited in VS Code. */
export function VsCodeBanner({ link, folderPath, onSavePath, onOpen, onChangeFolder, onStop }: Props) {
  const [pasted, setPasted] = useState('')
  const [pathError, setPathError] = useState<string>()
  const id = useId()

  return (
    <div className="vscode-banner" data-testid="vscode-banner">
      <FileCode size={18} aria-hidden="true" className="vscode-banner-icon" />
      <div className="vscode-banner-body">
        <p>
          <strong>Editing in VS Code:</strong> <code>{link.path}</code>
        </p>
        <p className="vscode-banner-help">
          In folder <code>{link.folderName}</code>.{' '}
          <button type="button" className="link-button link-button-inline" onClick={onChangeFolder}>
            <FolderOpen size={14} aria-hidden="true" />
            Change folder
          </button>
        </p>

        {folderPath ? (
          <p className="vscode-banner-help">
            Save in VS Code and your code shows up here within a second. Run and Submit always use the saved file.
          </p>
        ) : (
          <form
            className="vscode-path-form"
            onSubmit={(e) => {
              e.preventDefault()
              const error = onSavePath(pasted)
              setPathError(error)
              if (!error) onOpen()
            }}
          >
            <label htmlFor={`${id}-path`}>
              To open files in VS Code with one click, paste where <code>{link.folderName}</code> is on your computer.
              You only do this once.
            </label>
            <p id={`${id}-tip`} className="vscode-banner-help">
              In File Explorer, hold Shift, right-click the <code>{link.folderName}</code> folder, and choose Copy as path.
            </p>
            <div className="vscode-path-row">
              <input
                id={`${id}-path`}
                type="text"
                value={pasted}
                onChange={(e) => setPasted(e.target.value)}
                placeholder={`C:\\Users\\you\\Documents\\${link.folderName}`}
                aria-describedby={`${id}-tip${pathError ? ` ${id}-error` : ''}`}
                aria-invalid={!!pathError}
                spellCheck={false}
              />
              <button type="submit" className="btn btn-ghost btn-small">
                Save and open
              </button>
            </div>
            {pathError && (
              <p id={`${id}-error`} className="vscode-banner-error" role="alert">
                {pathError}
              </p>
            )}
          </form>
        )}

        {link.updatedAt && !link.error && (
          <p className="vscode-banner-help" role="status">
            Last save received at {link.updatedAt.toLocaleTimeString()}.
          </p>
        )}
        {link.error && (
          <p className="vscode-banner-error" role="alert">
            {link.error}
          </p>
        )}
      </div>
      <div className="vscode-banner-actions">
        {folderPath && (
          <button type="button" className="btn btn-ghost btn-small" onClick={onOpen}>
            <ExternalLink size={14} aria-hidden="true" />
            Open in VS Code
          </button>
        )}
        <button type="button" className="btn btn-ghost btn-small" onClick={onStop}>
          Stop
        </button>
      </div>
    </div>
  )
}
