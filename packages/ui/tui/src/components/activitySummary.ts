/**
 * 落定思考+工具段的活动摘要：把连续已完成的 reasoning/tool 行收成
 * Claude 风格的一行（Thought for …, read N, ran N）。运行中的工具与
 * 流式思考不参与折叠，避免进度看不见。
 *
 * 只做展示折叠，不改 channel 行模型。
 */
import type { ChatRow } from '../dsh-adapter/channel.js'
import { formatDuration } from '../cc/format.js'
import { t } from '../i18n.js'

/** 摘要里按动词归类的工具计数。 */
export interface ActivityCounts {
  thoughtMs: number
  search: number
  read: number
  shell: number
  edit: number
  other: number
}

/** 一段可收成一行的连续落定活动。 */
export interface ActivityCluster {
  anchorId: number
  memberIds: readonly number[]
  counts: ActivityCounts
}

function classifyTool(name: string): keyof Pick<ActivityCounts, 'search' | 'read' | 'shell' | 'edit' | 'other'> {
  switch (name) {
    case 'grep':
    case 'glob':
    case 'web_search':
    case 'web_fetch':
      return 'search'
    case 'read':
      return 'read'
    case 'bash':
    case 'powershell':
    case 'shell':
      return 'shell'
    case 'write':
    case 'edit':
    case 'str_replace_editor':
    case 'str_replace':
      return 'edit'
    default:
      return 'other'
  }
}

function emptyCounts(): ActivityCounts {
  return { thoughtMs: 0, search: 0, read: 0, shell: 0, edit: 0, other: 0 }
}

function isSettledTool(row: ChatRow): boolean {
  return row.kind === 'tool' && row.tool !== undefined && row.tool.status !== 'running'
}

function takeSettledTools(
  rows: readonly ChatRow[],
  from: number,
  memberIds: number[],
  counts: ActivityCounts,
): { index: number; tools: number } {
  let i = from
  let tools = 0
  while (i < rows.length) {
    const row = rows[i]
    if (row === undefined || !isSettledTool(row) || row.tool === undefined) break
    memberIds.push(row.id)
    counts[classifyTool(row.tool.name)] += 1
    tools += 1
    i += 1
  }
  return { index: i, tools }
}

/**
 * 找出可折叠的连续落定活动段。新的思考行开启下一段，这样每一步
 * 模型调用各自一行，而不是整轮糊在一起。孤立思考不收。
 * @param rows - 过滤后的转录行。
 * @returns 按出现顺序的活动段。
 */
export function findActivityClusters(rows: readonly ChatRow[]): ActivityCluster[] {
  const clusters: ActivityCluster[] = []
  let i = 0
  while (i < rows.length) {
    const head = rows[i]
    if (head === undefined) {
      i += 1
      continue
    }
    if (head.kind === 'reasoning' && head.streaming !== true) {
      const memberIds = [head.id]
      const counts = emptyCounts()
      counts.thoughtMs = head.durationMs ?? 0
      i += 1
      const taken = takeSettledTools(rows, i, memberIds, counts)
      i = taken.index
      if (taken.tools > 0) {
        clusters.push({ anchorId: head.id, memberIds, counts })
      }
      continue
    }
    if (isSettledTool(head)) {
      const memberIds: number[] = []
      const counts = emptyCounts()
      const taken = takeSettledTools(rows, i, memberIds, counts)
      i = taken.index
      const anchor = memberIds[0]
      if (taken.tools > 0 && anchor !== undefined) {
        clusters.push({ anchorId: anchor, memberIds, counts })
      }
      continue
    }
    i += 1
  }
  return clusters
}

const EMPTY_SUMMARIES: ReadonlyMap<number, ActivityCounts> = new Map()
const EMPTY_ANCHORS: ReadonlySet<number> = new Set()

/**
 * 把未展开的活动段收成锚点行，其余成员从列表拿掉。
 * `expanded`（Ctrl+O）或锚点在 `openAnchors` 里时整段保持卡片。
 * `keepIds` 覆盖选中/强制挂载的成员，避免搜索或选择落到被藏行上。
 * @param rows - 思考过滤之后的行。
 * @param expanded - 全局转录展开。
 * @param openAnchors - 用户点开的活动段锚点。
 * @param keepIds - 必须保持可见的行 id。
 * @returns 折叠后的行、锚点计数，以及全部活动段锚点。
 */
export function collapseActivityRows(
  rows: readonly ChatRow[],
  expanded: boolean,
  openAnchors: ReadonlySet<number>,
  keepIds: ReadonlySet<number>,
): {
  rows: readonly ChatRow[]
  summaries: ReadonlyMap<number, ActivityCounts>
  anchors: ReadonlySet<number>
} {
  const clusters = findActivityClusters(rows)
  if (clusters.length === 0) return { rows, summaries: EMPTY_SUMMARIES, anchors: EMPTY_ANCHORS }
  const anchors = new Set(clusters.map(cluster => cluster.anchorId))
  if (expanded) return { rows, summaries: EMPTY_SUMMARIES, anchors }

  const hidden = new Set<number>()
  const summaries = new Map<number, ActivityCounts>()
  for (const cluster of clusters) {
    let keep = openAnchors.has(cluster.anchorId)
    if (!keep) {
      for (const id of cluster.memberIds) {
        if (keepIds.has(id)) {
          keep = true
          break
        }
      }
    }
    if (keep) continue
    summaries.set(cluster.anchorId, cluster.counts)
    for (const id of cluster.memberIds) {
      if (id !== cluster.anchorId) hidden.add(id)
    }
  }
  if (summaries.size === 0) return { rows, summaries: EMPTY_SUMMARIES, anchors }
  if (hidden.size === 0) return { rows, summaries, anchors }
  return { rows: rows.filter(row => !hidden.has(row.id)), summaries, anchors }
}

/**
 * 把计数拼成一行斜体摘要。
 * @param counts - 段内思考时长与工具动词计数。
 * @returns 已本地化的摘要；没有任何片段时为空串。
 */
export function formatActivitySummary(counts: ActivityCounts): string {
  const parts: string[] = []
  if (counts.thoughtMs >= 1000) {
    parts.push(t('thinking-thought-for', { duration: formatDuration(counts.thoughtMs) }))
  }
  if (counts.search > 0) parts.push(t('activity-searched', { count: counts.search }))
  if (counts.read > 0) parts.push(t('activity-read', { count: counts.read }))
  if (counts.edit > 0) parts.push(t('activity-edited', { count: counts.edit }))
  if (counts.shell > 0) parts.push(t('activity-ran', { count: counts.shell }))
  if (counts.other > 0) parts.push(t('activity-used', { count: counts.other }))
  return parts.join(t('activity-join'))
}
