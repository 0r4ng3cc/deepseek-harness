// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { SessionFace } from '@x1a0f3n9/dsh-api-session-controller/client'
import { TimelineActions } from '../src/client/actions.tsx'

afterEach(cleanup)

const copy = (key: string): string => key

function sessionFace(overrides: Partial<SessionFace> = {}): SessionFace {
  return {
    command: vi.fn().mockResolvedValue({ ok: true, value: { matched: true } }),
    prompt: vi.fn().mockResolvedValue({ ok: true, value: { accepted: true } }),
    readAttachment: vi.fn(),
    ...overrides,
  } as unknown as SessionFace
}

describe('TimelineActions', () => {
  it('requires acknowledgement before permanently deleting an assistant tail', async () => {
    const session = sessionFace()
    render(<TimelineActions kind="assistant" seq={7} session={session} t={copy} />)

    fireEvent.click(screen.getByRole('button', { name: 'button.delete.aria' }))
    const confirm = screen.getByRole('button', { name: 'confirm.delete.confirm' })
    expect(confirm).toHaveProperty('disabled', true)

    fireEvent.click(screen.getByRole('checkbox'))
    expect(confirm).toHaveProperty('disabled', false)
    fireEvent.click(confirm)

    await waitFor(() => expect(session.command).toHaveBeenCalledWith('/rewind @7 chat'))
    expect(session.prompt).not.toHaveBeenCalled()
  })

  it('reads durable images before truncating and resubmitting a user question', async () => {
    const session = sessionFace({
      readAttachment: vi.fn().mockResolvedValue({
        ok: true,
        value: {
          attachment: { mediaType: 'image/png', name: 'diagram.png' },
          data: new Uint8Array([65, 66]),
        },
      }),
    })
    render(
      <TimelineActions
        kind="user"
        seq={12}
        content={[
          { type: 'text', text: 'Explain this.' },
          { type: 'image', attachment: { attachmentId: 'attachment-1' } },
        ]}
        session={session}
        t={copy}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'button.regenerate.aria' }))
    fireEvent.click(screen.getByRole('checkbox'))
    fireEvent.click(screen.getByRole('button', { name: 'confirm.regenerate.confirm' }))

    await waitFor(() => expect(session.prompt).toHaveBeenCalledWith([
      { type: 'text', text: 'Explain this.' },
      { type: 'image', mediaType: 'image/png', data: 'QUI=', name: 'diagram.png' },
    ], 'queue'))
    expect(session.command).toHaveBeenCalledWith('/rewind @12 chat')
    const command = vi.mocked(session.command)
    const prompt = vi.mocked(session.prompt)
    expect(command.mock.invocationCallOrder[0]!).toBeLessThan(prompt.mock.invocationCallOrder[0]!)
  })
})
