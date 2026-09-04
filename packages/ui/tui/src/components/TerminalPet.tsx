import React from 'react'
import { Box, useAnimationFrame, useTerminalSize } from '../ui.js'
import { usePageInset } from './PageMargin.js'
import { RawAnsi } from '../ink/components/RawAnsi.js'
import { isMinimalMode } from '../minimalMode.js'
import type { Channel } from '../dsh-adapter/channel.js'
import { PET_ANIMATIONS, PET_FRAME_HEIGHT, PET_FRAME_WIDTH, type PetFrame } from './petFrames.js'

/** 透明像素阈值，和 terminal-pet-cli 的 alpha_threshold 保持一致。 */
const ALPHA_THRESHOLD = 48
const PET_LINE_HEIGHT = Math.ceil(PET_FRAME_HEIGHT / 2)
const PET_MIN_COLUMNS = 72
const PET_MIN_ROWS = 20
const PET_RIGHT_GAP = 2
const PET_BOTTOM_GAP = 5
const TRANSIENT_STATE_MS = 1500

export type PetState =
  | 'startup'
  | 'input'
  | 'thinking'
  | 'loading'
  | 'running'
  | 'success'
  | 'failed'

const PET_ANIMATION_BY_STATE: Record<PetState, keyof typeof PET_ANIMATIONS> = {
  startup: 'waving',
  input: 'idle',
  thinking: 'review',
  loading: 'waiting',
  running: 'running',
  success: 'jumping',
  failed: 'failed',
}

type PetChannelSnapshot = Pick<
  Channel,
  'status' | 'working' | 'cancelPending' | 'spinnerMode' | 'activeToolCount'
>

/** 把 DSH 会话阶段映射到 terminal-pet-cli 的七种动画状态。 */
export function resolvePetState(snapshot: PetChannelSnapshot, startup: boolean): PetState {
  if (startup || snapshot.status === 'starting') return 'startup'
  if (snapshot.status === 'disposed') return 'failed'
  if (!snapshot.working) return 'input'
  if (snapshot.cancelPending) return 'failed'
  if (snapshot.spinnerMode === 'thinking') return 'thinking'
  if (snapshot.spinnerMode === 'requesting') return 'loading'
  if (snapshot.activeToolCount > 0 || snapshot.spinnerMode === 'tool-use') return 'running'
  return 'running'
}

type RenderRun = {
  readonly x: number
  readonly y: number
  readonly width: number
  readonly text: string
}

type PreparedFrame = {
  readonly durationMs: number
  readonly runs: readonly RenderRun[]
}

const preparedFrames = new Map<PetFrame, PreparedFrame>()

function colorCode(channel: 38 | 48, red: number, green: number, blue: number): string {
  return `\x1b[${channel};2;${red};${green};${blue}m`
}

function cellText(
  rgba: Buffer,
  upperOffset: number,
  lowerOffset: number | undefined,
): string {
  const upperVisible = rgba[upperOffset + 3]! >= ALPHA_THRESHOLD
  const lowerVisible = lowerOffset !== undefined && rgba[lowerOffset + 3]! >= ALPHA_THRESHOLD
  if (!upperVisible && !lowerVisible) return ''

  const upper = upperVisible
    ? colorCode(38, rgba[upperOffset]!, rgba[upperOffset + 1]!, rgba[upperOffset + 2]!)
    : ''
  const lower = lowerVisible
    ? colorCode(48, rgba[lowerOffset!]!, rgba[lowerOffset! + 1]!, rgba[lowerOffset! + 2]!)
    : ''
  return `${upper}${lower}${upperVisible ? '▀' : '▄'}`
}

/** 预处理一个 RGBA 帧，只为不透明连续段创建 RawAnsi 绘制节点。 */
function prepareFrame(frame: PetFrame): PreparedFrame {
  const cached = preparedFrames.get(frame)
  if (cached !== undefined) return cached

  const rgba = Buffer.from(frame.rgbaBase64, 'base64')
  const expectedBytes = PET_FRAME_WIDTH * PET_FRAME_HEIGHT * 4
  if (rgba.length !== expectedBytes) {
    throw new Error(`宠物帧大小异常：期望 ${expectedBytes} bytes，实际 ${rgba.length} bytes`)
  }

  const runs: RenderRun[] = []
  for (let y = 0; y < PET_FRAME_HEIGHT; y += 2) {
    let runStart = -1
    let runText = ''
    for (let x = 0; x < PET_FRAME_WIDTH; x += 1) {
      const upperOffset = (y * PET_FRAME_WIDTH + x) * 4
      const lowerOffset = y + 1 < PET_FRAME_HEIGHT
        ? ((y + 1) * PET_FRAME_WIDTH + x) * 4
        : undefined
      const cell = cellText(rgba, upperOffset, lowerOffset)
      if (cell === '') {
        if (runStart >= 0) {
          runs.push({ x: runStart, y: y / 2, width: x - runStart, text: `${runText}\x1b[0m` })
          runStart = -1
          runText = ''
        }
        continue
      }
      if (runStart < 0) runStart = x
      runText += cell
    }
    if (runStart >= 0) {
      runs.push({
        x: runStart,
        y: y / 2,
        width: PET_FRAME_WIDTH - runStart,
        text: `${runText}\x1b[0m`,
      })
    }
  }

  const prepared = { durationMs: Math.max(10, frame.durationMs), runs }
  preparedFrames.set(frame, prepared)
  return prepared
}

function frameAt(frames: readonly PetFrame[], elapsed: number): PetFrame {
  if (frames.length === 0) throw new Error('宠物动画没有可播放的帧')
  const duration = frames.reduce((total, frame) => total + Math.max(10, frame.durationMs), 0)
  let offset = duration === 0 ? 0 : elapsed % duration
  for (const frame of frames) {
    const frameDuration = Math.max(10, frame.durationMs)
    if (offset < frameDuration) return frame
    offset -= frameDuration
  }
  return frames[frames.length - 1]!
}

/**
 * 终端鲸鱼娘：复用 terminal-pet-cli 的 GIF 状态与 half-block 渲染，
 * 但在 Ink 内以透明像素段绘制，不启动第二个 TTY 或 Python 进程。
 */
export function TerminalPet({ channel }: { channel: Channel }): React.ReactNode {
  const { columns, rows } = useTerminalSize()
  const { x: pageInsetX } = usePageInset()
  const [startup, setStartup] = React.useState(true)
  const [transientState, setTransientState] = React.useState<PetState | undefined>(undefined)
  const previousWorkingRef = React.useRef(channel.working)
  const transientTimerRef = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  React.useEffect(() => {
    const timer = setTimeout(() => setStartup(false), 2400)
    return () => clearTimeout(timer)
  }, [])

  React.useEffect(() => {
    const wasWorking = previousWorkingRef.current
    previousWorkingRef.current = channel.working
    if (!wasWorking || channel.working) return

    const lastRow = channel.rows.at(-1)
    const failed = channel.cancelPending || lastRow?.kind === 'interrupt' || lastRow?.tool?.status === 'error'
    setTransientState(failed ? 'failed' : 'success')
    if (transientTimerRef.current !== undefined) clearTimeout(transientTimerRef.current)
    transientTimerRef.current = setTimeout(() => {
      transientTimerRef.current = undefined
      setTransientState(undefined)
    }, TRANSIENT_STATE_MS)
  }, [channel.working, channel.cancelPending, channel.rows])

  React.useEffect(() => () => {
    if (transientTimerRef.current !== undefined) clearTimeout(transientTimerRef.current)
  }, [])

  const hidden = isMinimalMode() || !channel.whale || columns < PET_MIN_COLUMNS || rows < PET_MIN_ROWS
  const state = transientState ?? resolvePetState(channel, startup)
  const animationName = PET_ANIMATION_BY_STATE[state]
  const frames = PET_ANIMATIONS[animationName]
  const [viewportRef, time] = useAnimationFrame(hidden ? null : 100)
  const frame = frameAt(frames, time)
  const prepared = prepareFrame(frame)

  if (hidden) return null

  return (
    <Box
      ref={viewportRef}
      position="absolute"
      right={Math.max(PET_RIGHT_GAP, pageInsetX)}
      bottom={Math.max(PET_BOTTOM_GAP, 3)}
      width={PET_FRAME_WIDTH}
      height={PET_LINE_HEIGHT}
      flexShrink={0}
      overflow="hidden"
    >
      {prepared.runs.map(run => (
        <Box
          key={`${run.y}:${run.x}`}
          position="absolute"
          left={run.x}
          top={run.y}
          width={run.width}
          height={1}
          flexShrink={0}
        >
          <RawAnsi lines={[run.text]} width={run.width} />
        </Box>
      ))}
    </Box>
  )
}
