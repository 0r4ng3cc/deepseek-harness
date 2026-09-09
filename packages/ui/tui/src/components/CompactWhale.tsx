import React from 'react'
import { Box, Text } from '../ui.js'

/**
 * Compact header whale: DeepSeek official mark rasterized to half-blocks at
 * 24×18 pixels → 24 terminal columns × 9 rows.
 */

export const COMPACT_WHALE_COLUMNS = 24
export const COMPACT_WHALE_ROWS = 9

export type CompactPose = 'idle' | 'blink' | 'tailLeft' | 'tailRight' | 'spout' | 'sleep' | 'run' | 'fail'

export type WhaleIntroId = 'classic' | 'heart' | 'sleep'

export const WHALE_INTRO_IDS: readonly WhaleIntroId[] = ['classic', 'heart', 'sleep']

export interface OpeningStep {
  readonly pose: CompactPose
  readonly ms: number
}

/** Session pet names CompactWhale can map; kept local so dsh-TUI need not ship PetSprite. */
export type PetAnimationName =
  | 'failed'
  | 'idle'
  | 'jumping'
  | 'review'
  | 'running-left'
  | 'running-right'
  | 'running'
  | 'waiting'
  | 'waving'

type Rgb = readonly [number, number, number]

/** DeepSeek brand fill from the official favicon. */
const BRAND: Rgb = [77, 107, 254]

const fg = (rgb: Rgb): string => `\x1b[38;2;${rgb[0]};${rgb[1]};${rgb[2]}m`
const bg = (rgb: Rgb): string => `\x1b[48;2;${rgb[0]};${rgb[1]};${rgb[2]}m`
const RESET = '\x1b[0m'

/** Official mark, 1 = brand fill, 0 = transparent. 24×18 pixels. */
const MARK: readonly string[] = [
  '000000000000000010000000',
  '000001111111100011000000',
  '000111111111100011100111',
  '001111111111110011111111',
  '011111111111111011111110',
  '011111111111111101111110',
  '111111111111111111111000',
  '110000111111111111110000',
  '111000001111110111110000',
  '111000000111110111110000',
  '111000000011111111100000',
  '011100000011111111100000',
  '011100000001111111100000',
  '001110001100111111000000',
  '001111001110011111000000',
  '000111111111111111100000',
  '000001111111111011100000',
  '000000011111100000000000',
]

function shift(rows: readonly string[], dx: number): string[] {
  const width = rows[0]?.length ?? 0
  return rows.map((row) => {
    if (dx === 0) return row
    if (dx > 0) return '0'.repeat(dx) + row.slice(0, Math.max(0, width - dx))
    const n = -dx
    return row.slice(n) + '0'.repeat(n)
  })
}

function withDot(rows: readonly string[], x: number, y: number): string[] {
  const next = rows.map(row => row.split(''))
  if (y >= 0 && y < next.length && x >= 0 && x < (next[0]?.length ?? 0)) {
    next[y]![x] = '1'
  }
  return next.map(row => row.join(''))
}

const SPRITES: Record<CompactPose, readonly string[]> = {
  idle: MARK,
  blink: MARK,
  tailLeft: shift(MARK, -1),
  tailRight: shift(MARK, 1),
  spout: withDot(MARK, 12, 0),
  sleep: MARK,
  run: shift(MARK, 1),
  fail: MARK,
}

function renderSpriteRows(rows: readonly string[]): string[] {
  const out: string[] = []
  for (let r = 0; r < rows.length; r += 2) {
    const upper = rows[r] ?? ''
    const lower = rows[r + 1] ?? ''
    let line = ''
    let current = ''
    const width = Math.max(upper.length, lower.length)
    for (let x = 0; x < width; x++) {
      const up = upper[x] === '1' ? BRAND : undefined
      const lo = lower[x] === '1' ? BRAND : undefined
      let seq = ''
      let ch = ' '
      if (up !== undefined && lo !== undefined) {
        seq = fg(up) + bg(lo)
        ch = '▀'
      } else if (up !== undefined) {
        seq = fg(up)
        ch = '▀'
      } else if (lo !== undefined) {
        seq = fg(lo)
        ch = '▄'
      }
      if (seq !== current) {
        line += seq === '' ? RESET : seq
        current = seq
      }
      line += ch
    }
    if (!line.endsWith(RESET)) line += RESET
    out.push(line)
  }
  return out
}

const RENDERED: Record<CompactPose, readonly string[]> = {
  idle: renderSpriteRows(SPRITES.idle),
  blink: renderSpriteRows(SPRITES.blink),
  tailLeft: renderSpriteRows(SPRITES.tailLeft),
  tailRight: renderSpriteRows(SPRITES.tailRight),
  spout: renderSpriteRows(SPRITES.spout),
  sleep: renderSpriteRows(SPRITES.sleep),
  run: renderSpriteRows(SPRITES.run),
  fail: renderSpriteRows(SPRITES.fail),
}

/** Intro cadence stays under ~1.2s, then the header freezes on idle. */
export const OPENING_SEQUENCES: Record<WhaleIntroId, readonly OpeningStep[]> = {
  classic: [
    { pose: 'idle', ms: 280 },
    { pose: 'blink', ms: 160 },
    { pose: 'idle', ms: 180 },
    { pose: 'tailRight', ms: 140 },
    { pose: 'tailLeft', ms: 140 },
    { pose: 'tailRight', ms: 140 },
    { pose: 'idle', ms: 160 },
  ],
  heart: [
    { pose: 'idle', ms: 240 },
    { pose: 'spout', ms: 240 },
    { pose: 'idle', ms: 180 },
    { pose: 'spout', ms: 240 },
    { pose: 'idle', ms: 180 },
  ],
  sleep: [
    { pose: 'idle', ms: 260 },
    { pose: 'sleep', ms: 340 },
    { pose: 'idle', ms: 220 },
    { pose: 'sleep', ms: 340 },
  ],
}

/**
 * Roll one intro id uniformly at random.
 * @param random - Test seam; values in `[0, 1)`.
 * @returns The rolled intro id and its pose sequence.
 */
export function pickOpeningSequence(
  random: () => number = Math.random,
): { id: WhaleIntroId; sequence: readonly OpeningStep[] } {
  const roll = random()
  const index = Math.min(WHALE_INTRO_IDS.length - 1, Math.max(0, Math.floor(roll * WHALE_INTRO_IDS.length)))
  const id = WHALE_INTRO_IDS[index] ?? 'classic'
  return { id, sequence: OPENING_SEQUENCES[id] }
}

const POSE_FROM_PET: Record<PetAnimationName, CompactPose> = {
  idle: 'idle',
  waving: 'tailRight',
  jumping: 'spout',
  waiting: 'sleep',
  review: 'blink',
  running: 'run',
  'running-left': 'run',
  'running-right': 'run',
  failed: 'fail',
}

/**
 * Map a session pet animation onto a compact-whale pose.
 * @param animation - Session-driven pet animation name.
 * @returns The matching compact pose.
 */
export function poseFromPetAnimation(animation: PetAnimationName | undefined): CompactPose {
  if (animation === undefined) return 'idle'
  return POSE_FROM_PET[animation]
}

/**
 * One compact whale pose as an Ink box of fixed 24×9 cells.
 * @param pose - Sprite pose to draw.
 * @returns The rendered whale.
 */
export function CompactWhale({ pose = 'idle' }: { pose?: CompactPose }): React.ReactNode {
  const rows = RENDERED[pose] ?? RENDERED.idle
  return (
    <Box flexDirection="column" flexShrink={0} width={COMPACT_WHALE_COLUMNS} height={COMPACT_WHALE_ROWS}>
      {rows.map((row, index) => (
        <Text key={index} wrap="truncate-end">
          {row}
        </Text>
      ))}
    </Box>
  )
}

/** Sprite box used by header-size probes. */
export function compactWhaleSpriteSize(pose: CompactPose = 'idle'): { columns: number; pixelRows: number; terminalRows: number } {
  const sprite = SPRITES[pose]
  return {
    columns: sprite[0]?.length ?? 0,
    pixelRows: sprite.length,
    terminalRows: RENDERED[pose].length,
  }
}
