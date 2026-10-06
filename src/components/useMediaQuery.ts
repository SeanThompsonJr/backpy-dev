// Media queries the lesson page lays itself out by. Kept in step with the CSS breakpoints.
import { useSyncExternalStore } from 'react'

/** Below this width the page stacks: lesson text, then the work, then the quiz (lesson.css). */
export const NARROW_SCREEN = '(max-width: 899px)'
/** Phones and tablets: no mouse, and no terminal or VS Code for "On your machine" exercises. */
export const TOUCH_ONLY = '(hover: none) and (pointer: coarse)'

const query = (media: string) => (typeof window.matchMedia === 'function' ? window.matchMedia(media) : undefined)

export function useMediaQuery(media: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const list = query(media)
      list?.addEventListener('change', onChange)
      return () => list?.removeEventListener('change', onChange)
    },
    () => query(media)?.matches ?? false,
  )
}
