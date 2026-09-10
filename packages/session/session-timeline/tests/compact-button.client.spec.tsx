// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { SessionFace } from '@x1a0f3n9/dsh-api-session-controller/client'
import { CompactButton } from '../src/client/compact-button.tsx'

afterEach(cleanup)

const copy = (key: string): string => key

function sessionFace(overrides: Partial<SessionFace> = {}): SessionFace {
  return {
    command: vi.fn().mockResolvedValue({ ok: true, value: { matched: true } }),
    ...overrides,
  } as unknown as SessionFace
}

describe('CompactButton', () => {
  it('runs /compact on the current session', async () => {
    const session = sessionFace()
    render(<CompactButton session={session} t={copy} />)

    fireEvent.click(screen.getByRole('button', { name: 'button.compact.aria' }))

    await waitFor(() => expect(session.command).toHaveBeenCalledWith('/compact'))
  })

  it('stays disabled when no session is selected', () => {
    render(<CompactButton session={undefined} t={copy} />)
    expect(screen.getByRole('button', { name: 'button.compact.aria' })).toHaveProperty('disabled', true)
  })
})
