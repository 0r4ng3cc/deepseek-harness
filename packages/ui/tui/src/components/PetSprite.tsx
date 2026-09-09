import React from 'react'
import { Box, useAnimationFrame } from '../ui.js'
import type { Props as BoxProps } from './design-system/ThemedBox.js'
import { RawAnsi } from '../ink/components/RawAnsi.js'
import { PET_ANIMATIONS, PET_FRAME_HEIGHT, PET_FRAME_WIDTH, type PetFrame } from './petFrames.js'

/** 透明像素阈值与 deepseek-whale-girl 的 terminal-pet-cli 保持一致。 */
const ALPHA_THRESHOLD = 48
export const PET_LINE_HEIGHT = Math.ceil(PET_FRAME_HEIGHT / 2)

type PreparedFrame = {
  readonly lines: string[]
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
  // RawAnsi 直接写入终端屏幕缓冲；透明单元也必须清掉上一个单元的
  // SGR，否则普通空格会继承前景/背景色，形成右侧拖影。
  const reset = '\x1b[0m'
  if (!upperVisible && !lowerVisible) return `${reset} `

  const upper = upperVisible
    ? colorCode(38, rgba[upperOffset]!, rgba[upperOffset + 1]!, rgba[upperOffset + 2]!)
    : ''
  // 下半块单独可见时使用前景色；只有上下半块同时存在时才使用背景色。
  // 这样不会把上一列的背景色带到透明区域，也和 terminal-pet-cli 一致。
  if (!upperVisible) {
    return `${reset}${colorCode(38, rgba[lowerOffset!]!, rgba[lowerOffset! + 1]!, rgba[lowerOffset! + 2]!)}▄`
  }
  const lower = lowerVisible
    ? colorCode(48, rgba[lowerOffset!]!, rgba[lowerOffset! + 1]!, rgba[lowerOffset! + 2]!)
    : ''
  return `${reset}${upper}${lower}▀`
}

/** 预处理一个 RGBA 帧，输出固定宽度的普通行，保证随 ScrollBox 正常滚动。 */
function prepareFrame(frame: PetFrame): PreparedFrame {
  const cached = preparedFrames.get(frame)
  if (cached !== undefined) return cached

  const rgba = Buffer.from(frame.rgbaBase64, 'base64')
  const expectedBytes = PET_FRAME_WIDTH * PET_FRAME_HEIGHT * 4
  if (rgba.length !== expectedBytes) {
    throw new Error(`宠物帧大小异常：期望 ${expectedBytes} bytes，实际 ${rgba.length} bytes`)
  }

  const lines: string[] = []
  for (let y = 0; y < PET_FRAME_HEIGHT; y += 2) {
    let line = ''
    for (let x = 0; x < PET_FRAME_WIDTH; x += 1) {
      const upperOffset = (y * PET_FRAME_WIDTH + x) * 4
      const lowerOffset = y + 1 < PET_FRAME_HEIGHT
        ? ((y + 1) * PET_FRAME_WIDTH + x) * 4
        : undefined
      line += cellText(rgba, upperOffset, lowerOffset)
    }
    lines.push(`${line}\x1b[0m`)
  }

  const prepared = { lines }
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

export type PetAnimationName = keyof typeof PET_ANIMATIONS
type PetBoxProps = Omit<BoxProps, 'ref'>

/**
 * 在 Ink 布局中绘制一只鲸鱼娘；透明像素不会覆盖下面的终端内容。
 * 固定宽高让帧切换保持稳定，顶部品牌区与其他 inline 容器可复用同一实现。
 */
export function PetSprite({
  animation,
  intervalMs = 100,
  boxProps,
}: {
  animation: PetAnimationName
  intervalMs?: number | null
  boxProps?: PetBoxProps
}): React.ReactNode {
  const [viewportRef, time] = useAnimationFrame(intervalMs)
  const frame = frameAt(PET_ANIMATIONS[animation], time)
  const prepared = prepareFrame(frame)

  return (
    <Box
      {...boxProps}
      ref={viewportRef}
      width={PET_FRAME_WIDTH}
      height={PET_LINE_HEIGHT}
      flexShrink={0}
      overflow="hidden"
    >
      <RawAnsi lines={prepared.lines} width={PET_FRAME_WIDTH} />
    </Box>
  )
}
