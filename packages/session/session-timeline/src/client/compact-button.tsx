/** Composer compact control that runs `/compact` for the current session. */

import { useCallback, useRef, type MouseEvent, type ReactNode } from 'react'
import type { SessionFace } from '@x1a0f3n9/dsh-api-session-controller/client'
import { Tooltip } from '@x1a0f3n9/dsh-client-ui-primitives'
import type { RewindKey } from './locales.ts'
import { CLASS } from './styles.ts'

export type CompactButtonTranslate = (key: RewindKey, params?: Record<string, unknown>) => string

interface CompactButtonProps {
  readonly session: SessionFace | undefined
  readonly t: CompactButtonTranslate
}

/**
 * Render the composer compact button.
 * @param props - the live session face and locale copy.
 * @returns the compact control.
 */
export function CompactButton({ session, t }: CompactButtonProps): ReactNode {
  const busy = useRef(false)
  const keepFocus = useCallback((event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
  }, [])
  const onClick = useCallback(() => {
    if (session === undefined || busy.current) return
    busy.current = true
    void session.command('/compact').catch((error: unknown) => {
      console.error('dsh-session-timeline: compact failed', error)
    }).finally(() => { busy.current = false })
  }, [session])

  return (
    <Tooltip label={t('button.compact.title')} side="top">
      <button
        type="button"
        className={CLASS.button}
        aria-label={t('button.compact.aria')}
        disabled={session === undefined}
        onMouseDown={keepFocus}
        onClick={onClick}
      >
        <CompactIcon />
      </button>
    </Tooltip>
  )
}

/** Compact control glyph: two chevrons pointing toward the center. */
function CompactIcon(): ReactNode {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M4 6.5 8 3.5 12 6.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 9.5 8 12.5 12 9.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
