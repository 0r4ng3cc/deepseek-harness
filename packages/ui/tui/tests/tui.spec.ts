/** The TUI bundle's declared profile patch. */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as yaml from 'js-yaml'
import { afterEach, describe, expect, it } from 'vitest'
import { entryListSchema } from '@deepseek-ai/cordis-plugin-include'
import { isStandaloneRuntime, resolveTuiUpdateTarget } from '../src/update.ts'
import { anchorTop, seekSelectable, sessionAt } from '../src/sessions/view.ts'
import type { ChatRow } from '../src/dsh-adapter/channel.ts'
import {
  collapseActivityRows,
  findActivityClusters,
  formatActivitySummary,
} from '../src/components/activitySummary.ts'
import { getLang, setLang } from '../src/i18n.ts'
import { LOCAL_COMMANDS } from '../src/commands.ts'
import { foldCommandName } from '../src/ink/truncateToWidth.ts'
import { compactingBarRatio } from '../src/components/compactingProgress.ts'

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

describe('standalone /update', () => {
  const savedStandalone = process.env.DSH_TUI_STANDALONE
  const savedBinary = process.env.DSH_TUI_STANDALONE_BINARY
  const savedHome = process.env.DSH_HOME

  afterEach(() => {
    if (savedStandalone === undefined) delete process.env.DSH_TUI_STANDALONE
    else process.env.DSH_TUI_STANDALONE = savedStandalone
    if (savedBinary === undefined) delete process.env.DSH_TUI_STANDALONE_BINARY
    else process.env.DSH_TUI_STANDALONE_BINARY = savedBinary
    if (savedHome === undefined) delete process.env.DSH_HOME
    else process.env.DSH_HOME = savedHome
  })

  it('refuses GitHub binary replacement without contacting a registry', async () => {
    process.env.DSH_TUI_STANDALONE = '1'
    delete process.env.DSH_TUI_STANDALONE_BINARY
    delete process.env.DSH_HOME
    expect(isStandaloneRuntime()).toBe(true)
    await expect(resolveTuiUpdateTarget()).resolves.toEqual({ kind: 'unknown', isStandalone: true })
  })
})

describe('session browser empty list', () => {
  it('does not throw when the cursor has nowhere to land', () => {
    expect(seekSelectable([], 0, 1)).toBe(-1)
    expect(sessionAt([], 0)).toBeUndefined()
    expect(sessionAt([], -1)).toBeUndefined()
    expect(anchorTop([], -1, 20, 0)).toBe(0)
  })
})

function reasoningRow(id: number, durationMs?: number): ChatRow {
  return durationMs === undefined
    ? { id, kind: 'reasoning', text: 'think' }
    : { id, kind: 'reasoning', text: 'think', durationMs }
}

function toolRow(id: number, name: string, status: 'running' | 'ok' | 'error' = 'ok'): ChatRow {
  return {
    id,
    kind: 'tool',
    text: '',
    tool: { callId: String(id), name, argsText: '{}', status, startedAt: 0 },
  }
}

describe('activity summary', () => {
  const savedLang = getLang()
  afterEach(() => { setLang(savedLang) })

  it('groups a settled thinking step with the tools that follow', () => {
    const rows = [
      reasoningRow(1, 2000),
      toolRow(2, 'grep'),
      toolRow(3, 'read'),
      toolRow(4, 'bash'),
      { id: 5, kind: 'assistant' as const, text: 'done' },
    ]
    const clusters = findActivityClusters(rows)
    expect(clusters).toHaveLength(1)
    expect(clusters[0]).toMatchObject({
      anchorId: 1,
      memberIds: [1, 2, 3, 4],
      counts: { thoughtMs: 2000, search: 1, read: 1, shell: 1, edit: 0, other: 0 },
    })
  })

  it('leaves running tools and lone thinking rows alone', () => {
    expect(findActivityClusters([reasoningRow(1, 2000)])).toEqual([])
    expect(findActivityClusters([toolRow(1, 'bash', 'running')])).toEqual([])
  })

  it('starts a new cluster at the next thinking row', () => {
    const rows = [
      reasoningRow(1, 1000),
      toolRow(2, 'read'),
      reasoningRow(3, 4000),
      toolRow(4, 'bash'),
      toolRow(5, 'bash'),
    ]
    const clusters = findActivityClusters(rows)
    expect(clusters.map(cluster => cluster.memberIds)).toEqual([[1, 2], [3, 4, 5]])
  })

  it('hides clustered tool rows until the anchor is opened', () => {
    const rows = [reasoningRow(1, 2000), toolRow(2, 'read'), toolRow(3, 'bash')]
    const none = new Set<number>()
    const collapsed = collapseActivityRows(rows, false, none, none)
    expect(collapsed.rows.map(row => row.id)).toEqual([1])
    expect(collapsed.summaries.get(1)).toEqual({
      thoughtMs: 2000, search: 0, read: 1, shell: 1, edit: 0, other: 0,
    })
    expect(collapseActivityRows(rows, true, none, none).rows).toBe(rows)
    expect(collapseActivityRows(rows, false, new Set([1]), none).rows).toBe(rows)
    expect(collapseActivityRows(rows, false, none, new Set([3])).rows).toBe(rows)
  })

  it('formats the Claude-style activity line', () => {
    const counts = { thoughtMs: 2000, search: 1, read: 3, shell: 2, edit: 0, other: 0 }
    setLang('en')
    expect(formatActivitySummary(counts)).toBe(
      'Thought for 2s, searched for 1 pattern, read 3 files, ran 2 shell commands',
    )
    setLang('zh')
    expect(formatActivitySummary(counts)).toBe('思考了 2s，搜索了 1 次，读了 3 个文件，跑了 2 条命令')
  })
})

describe('slash command catalog', () => {
  it('exposes /undo as an alias of /rewind', () => {
    const undo = LOCAL_COMMANDS.find(command => command.name === 'undo')
    expect(undo).toMatchObject({
      name: 'undo',
      tag: 'alias of /rewind',
    })
  })

  it('folds a long command name into the name column', () => {
    expect(foldCommandName('snapshot-auto-cleanup', 12)).toBe('snapshot-au…')
    expect(foldCommandName('plan', 12)).toBe('plan')
  })
})

describe('compacting overlay', () => {
  it('eases toward 92% and never claims completion', () => {
    expect(compactingBarRatio(0)).toBe(0)
    expect(compactingBarRatio(12_000)).toBeCloseTo(0.92)
    expect(compactingBarRatio(24_000)).toBeCloseTo(0.92)
    const mid = compactingBarRatio(4_000)
    expect(mid).toBeGreaterThan(0)
    expect(mid).toBeLessThan(0.92)
  })
})
