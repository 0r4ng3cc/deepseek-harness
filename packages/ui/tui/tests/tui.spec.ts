/** The TUI bundle's declared profile patch. */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as yaml from 'js-yaml'
import { describe, expect, it } from 'vitest'
import { entryListSchema } from '@deepseek-ai/cordis-plugin-include'

describe('dsh-tui bundle', () => {
  it('declares a startup-gated tui row over dsh-base without a published invariant', () => {
    const root = fileURLToPath(new URL('..', import.meta.url))
    const manifest = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8')) as {
      exports?: Record<string, unknown>
      dsh?: { bundle?: { patch?: string } }
    }
    expect(manifest.dsh?.bundle?.patch).toBe('./cordis.patch.yml')
    expect(manifest.exports?.['./invariant']).toBeUndefined()
    const patches = yaml.load(
      readFileSync(resolve(root, manifest.dsh!.bundle!.patch!), 'utf8'),
      { schema: entryListSchema },
    ) as Array<{
      id?: string
      disabled?: boolean
      insert?: Array<{
        config?: { provider?: string; sessionId?: unknown }
        id?: string
        inject?: string[]
        name?: string
      }>
    }>
    expect(patches.find(patch => patch.id === 'hmr')).toBeUndefined()
    expect(patches.find(patch => patch.id === 'command-goal')).toMatchObject({ disabled: true })
    const rows = patches.flatMap(patch => patch.insert ?? [])
    expect(rows.find(row => row.id === 'dsh-tui')).toMatchObject({
      name: '@x1a0f3n9/dsh-tui',
      inject: ['workspaceRegistry', 'agents', 'tuiWorkspaces', 'tuiScenes', 'tuiDialogs', 'tuiStatus', 'tuiShortcuts', 'tuiRenderers', 'tuiThemes'],
      config: { provider: 'deepseek-official' },
    })
  })
})
