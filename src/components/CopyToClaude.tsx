import { useEffect, useRef, useState } from 'react'
import { Check, ClipboardCopy } from 'lucide-react'

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // Older or locked-down browsers: fall back to a hidden selection.
    const area = document.createElement('textarea')
    area.value = text
    area.setAttribute('readonly', '')
    area.style.position = 'fixed'
    area.style.opacity = '0'
    document.body.appendChild(area)
    area.select()
    const ok = document.execCommand('copy')
    area.remove()
    return ok
  }
}

interface Props {
  /** Built at click time, so it always has the latest code and answers */
  getPrompt: () => string
  /** The rail's tall, narrow button style */
  variant?: 'button' | 'rail'
}

/** Copies a tutoring prompt for Claude. If copying is blocked, shows the prompt to copy by hand. */
export function CopyToClaude({ getPrompt, variant = 'button' }: Props) {
  const [state, setState] = useState<'idle' | 'copied' | { failed: string }>('idle')
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])

  const copy = async () => {
    const prompt = getPrompt()
    if (await copyText(prompt)) {
      setState('copied')
      clearTimeout(timer.current)
      timer.current = setTimeout(() => setState('idle'), 4000)
    } else {
      setState({ failed: prompt })
    }
  }

  const copied = state === 'copied'
  return (
    <>
      <button
        type="button"
        className={variant === 'rail' ? 'rail-button' : 'btn btn-ghost btn-small copy-claude'}
        onClick={copy}
        aria-label={variant === 'rail' ? 'Copy for Claude' : 'Copy to Claude'}
        title="Copies the lesson, your code, your last error and your explain-back answer, with your tutoring rules"
        data-testid={variant === 'rail' ? 'rail-copy-claude' : 'copy-claude'}
      >
        {copied ? (
          <Check size={variant === 'rail' ? 18 : 14} aria-hidden="true" />
        ) : (
          <ClipboardCopy size={variant === 'rail' ? 18 : 14} aria-hidden="true" />
        )}
        <span className={variant === 'rail' ? undefined : 'work-head-label'}>
          {copied ? 'Copied' : variant === 'rail' ? 'Copy for Claude' : 'Copy to Claude'}
        </span>
      </button>
      <span className="visually-hidden" aria-live="polite">
        {copied ? 'Copied. Paste it into Claude.' : ''}
      </span>
      {typeof state === 'object' && (
        <div className="copy-claude-fallback" role="dialog" aria-label="Copy this prompt">
          <p>Your browser blocked copying. Select all of this and copy it yourself:</p>
          <textarea readOnly value={state.failed} rows={8} onFocus={(e) => e.target.select()} />
          <button type="button" className="btn btn-ghost btn-small" onClick={() => setState('idle')}>
            Close
          </button>
        </div>
      )}
    </>
  )
}
