import { existsSync, readdirSync, writeFileSync } from 'node:fs'
import { basename, dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const here = dirname(fileURLToPath(import.meta.url))
const packageRoot = resolve(here, '..')
const assetsDir = join(packageRoot, 'assets', 'pet')
const outputFile = join(packageRoot, 'src', 'components', 'petFrames.ts')
// 只保留头部、鲸鳍耳和肩部，裁掉下半身与两侧鲸尾拖影。
// 32x30 经过半块字符渲染后约为 32x15 个终端单元，接近 2.1 头身的
// Q 版重心：脸部清楚，身体仍保持顶栏可接受的高度。内容只缩到 31 列，
// 最右侧固定留一列透明护栏，避免侧身帧的边缘像素变成拖影。
const CROP = { x: 45, y: 0, width: 105, height: 100 }
const WIDTH = 32
const CONTENT_WIDTH = WIDTH - 1
const HEIGHT = 30
const BYTES_PER_FRAME = WIDTH * HEIGHT * 4

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { ...options, encoding: null })
  if (result.error) throw new Error(`执行 ${command} 失败：${result.error.message}`)
  if (result.status !== 0) {
    const detail = result.stderr?.toString('utf8').trim() || `退出码 ${result.status}`
    throw new Error(`${command} 失败：${detail}`)
  }
  return result.stdout
}

function probeFrames(file) {
  const raw = run('ffprobe', [
    '-v', 'error',
    '-select_streams', 'v:0',
    '-show_entries', 'frame=best_effort_timestamp_time',
    '-show_entries', 'stream=duration',
    '-of', 'json',
    file,
  ])
  const parsed = JSON.parse(raw.toString('utf8'))
  const timestamps = Array.isArray(parsed.frames)
    ? parsed.frames.map(frame => Number(frame.best_effort_timestamp_time)).filter(Number.isFinite)
    : []
  const streamDuration = Number(parsed.streams?.[0]?.duration)
  const totalDuration = Number.isFinite(streamDuration) && streamDuration > 0
    ? streamDuration
    : (timestamps.at(-1) ?? 0) + 0.12
  const durations = timestamps.map((timestamp, index) => {
    const next = timestamps[index + 1] ?? totalDuration
    return Math.max(10, Math.round(Math.max(0.01, next - timestamp) * 1000))
  })
  return { frameCount: timestamps.length, durations }
}

function readAnimation(file) {
  const probe = probeFrames(file)
  const raw = run('ffmpeg', [
    '-v', 'error',
    '-i', file,
    '-vf', `crop=${CROP.width}:${CROP.height}:${CROP.x}:${CROP.y},scale=${CONTENT_WIDTH}:${HEIGHT}:flags=neighbor,pad=${WIDTH}:${HEIGHT}:0:0:color=black@0`,
    '-fps_mode', 'passthrough',
    '-f', 'rawvideo',
    '-pix_fmt', 'rgba',
    'pipe:1',
  ])
  if (raw.length % BYTES_PER_FRAME !== 0) {
    throw new Error(`帧数据长度异常：${file}（${raw.length} bytes）`)
  }
  const frameCount = raw.length / BYTES_PER_FRAME
  if (probe.frameCount !== 0 && probe.frameCount !== frameCount) {
    throw new Error(`GIF 帧数不一致：${file}（ffprobe=${probe.frameCount}，raw=${frameCount}）`)
  }
  const durations = probe.durations.length === frameCount
    ? probe.durations
    : Array.from({ length: frameCount }, () => 120)
  return Array.from({ length: frameCount }, (_, index) => ({
    durationMs: durations[index],
    rgbaBase64: raw.subarray(index * BYTES_PER_FRAME, (index + 1) * BYTES_PER_FRAME).toString('base64'),
  }))
}

if (!existsSync(assetsDir)) throw new Error(`找不到宠物素材目录：${assetsDir}`)

const files = readdirSync(assetsDir)
  .filter(file => file.endsWith('.gif'))
  .sort()
if (files.length === 0) throw new Error(`宠物素材目录没有 GIF：${assetsDir}`)

const animations = Object.fromEntries(files.map(file => [basename(file, '.gif'), readAnimation(join(assetsDir, file))]))
const output = `/**
 * 由 scripts/generate-pet-frames.mjs 从 deepseek-whale-girl GIF 生成的终端帧缓存。
 * 运行时只解码 RGBA，不依赖 Python、Pillow 或 ffmpeg。
 */
export const PET_FRAME_WIDTH = ${WIDTH}
export const PET_FRAME_HEIGHT = ${HEIGHT}

export interface PetFrame {
  readonly durationMs: number
  readonly rgbaBase64: string
}

export const PET_ANIMATIONS = ${JSON.stringify(animations, null, 2)} as const
`

writeFileSync(outputFile, output)
console.log(`已生成 ${outputFile}（${files.length} 个动画）`)
