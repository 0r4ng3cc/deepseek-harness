import React from 'react'
import { getLang, t as tr, tOr } from '../i18n.js'
import { pickRandomTip, type Tip } from '../tips.js'
import { upstreamDriftSummary, UPSTREAM_VALIDATED_VERSION, type UpstreamDriftSummary } from '../dsh-adapter/contract.js'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Box, Text, useAnimationFrame, useTerminalSize } from '../ui.js'
import { getTheme } from '../theme.js'
import { useTheme } from './design-system/ThemeProvider.js'
import { parseRGB } from './Spinner/spinnerUtils.js'
import { BRAND, FLASH, ICE, sweep } from './shimmer.js'
import { OPENING_SEQUENCES, pickOpeningSequence, type OpeningStep, type WhaleIntroId } from './whaleFrames.js'
import { PetSprite, type PetAnimationName } from './PetSprite.js'

/**
 * Header badge version, read from the installed package.json so the display
 * never drifts from the published version. Falls back to a literal when the
 * package metadata is unreadable (unusual layouts).
 */
const VERSION = (() => {
  const moduleDir = dirname(fileURLToPath(import.meta.url))
  // tsc 输出保留 components 目录，bundle 输出把组件压到 types 根目录，
  // 两种形态的 package.json 相对层级不同，按稳定顺序尝试即可。
  for (const packagePath of [
    join(moduleDir, '..', '..', '..', 'package.json'),
    join(moduleDir, '..', '..', 'package.json'),
  ]) {
    try {
      const version = (JSON.parse(readFileSync(packagePath, 'utf8')) as { version?: unknown }).version
      if (typeof version === 'string' && version !== '') return version
    } catch {
      // 继续尝试另一种构建目录；安装包缺失时使用保底版本。
    }
  }
  return '0.1.0'
})()

/** 终端过窄时只保留文字，避免宠物挤压模型和路径信息。 */
const WHALE_MIN_COLUMNS = 48
/** 15 行宠物帧加上标题和输入区后，常见 24 行终端仍保留宠物。 */
const WHALE_MIN_ROWS = 20

/** 不同开屏节奏使用不同动作，避免每次启动都像同一张静态贴图。 */
const PET_INTRO_ANIMATION: Record<WhaleIntroId, PetAnimationName> = {
  classic: 'waving',
  heart: 'jumping',
  sleep: 'waiting',
}

/** `max` → `Max` (effort levels arrive lower-case from the adapter). */
function capitalize(text: string): string {
  return text.length === 0 ? text : text[0].toUpperCase() + text.slice(1)
}

/**
 * 开屏沿用原有的节奏，但所有视觉元素都压缩到终端友好的信息栏：
 * 左侧是固定尺寸的鲸鱼娘，右侧是品牌、模型和目录；底部只留一行短提示。
 * 宠物状态由会话实时驱动，动画不会改变布局高度。
 */
export function LogoV2({
  model,
  effort,
  cwd,
  skipIntro = false,
  intro,
  tip,
  whale = true,
  drift,
  petAnimation,
}: {
  model: string
  effort?: string | undefined
  cwd: string
  /** Test seam: mount straight into the settled header (probes skip the intro). */
  skipIntro?: boolean
  /** Test seam: pin the intro animation instead of rolling one at startup. */
  intro?: WhaleIntroId
  /** Test seam: pin the startup tip line (probes need a deterministic tip). */
  tip?: Tip
  /** Show the compact whale-girl pet (settings `dsh-tui.whale`); off → text-only header. */
  whale?: boolean
  /** Test seam: pin/suppress the upstream-drift notice (`null` forces it off;
   * `undefined` — the production default — auto-detects the install). */
  drift?: UpstreamDriftSummary | null
  /** 会话状态对应的宠物动作；未提供时使用待机动作。 */
  petAnimation?: PetAnimationName
}): React.ReactNode {
  // One intro per logo mount: the production path rolls (startup splash
  // and each /deepseek replay roll independently), the `intro` seam pins
  // a specific animation for probes.
  const [introId] = React.useState<WhaleIntroId>(() => intro ?? pickOpeningSequence().id)
  const [sequence] = React.useState<readonly OpeningStep[]>(() => OPENING_SEQUENCES[introId])
  const [step, setStep] = React.useState(skipIntro ? sequence.length : 0)
  const settled = step >= sequence.length

  // 只在开屏期间刷新品牌 shimmer；稳定后取消订阅，避免空闲会话持续重绘。
  const [ref, time] = useAnimationFrame(settled ? null : 90)

  // Frame chain: dwell per sequence entry, then settle for good.
  React.useEffect(() => {
    if (settled) return
    const timer = setTimeout(() => {
      setStep(s => s + 1)
    }, sequence[step].ms)
    return () => {
      clearTimeout(timer)
    }
  }, [step, settled, sequence])

  const [themeName] = useTheme()
  const theme = getTheme(themeName)
  const { columns, rows } = useTerminalSize()

  const wordmarkRGB = parseRGB(theme.claude) ?? BRAND
  const wordmarkShimmerRGB = parseRGB(theme.claudeShimmer) ?? ICE
  const taglineRGB = parseRGB(theme.claudeBlue_FOR_SYSTEM_SPINNER) ?? ICE

  const showWhale = whale && columns >= WHALE_MIN_COLUMNS && rows >= WHALE_MIN_ROWS
  const t = settled ? 0 : time

  const tagline = tr('logo-tagline')
  // One random tip per mount: the settled header must not re-roll on every
  // repaint (language switch, terminal resize), or the line would flicker.
  // `tip` is a test seam; production always passes undefined and rolls.
  const [randomTip] = React.useState<Tip>(() => tip ?? pickRandomTip())
  // Upstream-drift notice, merged to one line: computed once per mount from
  // the same memoized contract data the adapter checks (undefined when the
  // install matches). `drift` is a test seam to pin or suppress it.
  const [driftLine] = React.useState<UpstreamDriftSummary | null | undefined>(() =>
    drift === undefined ? upstreamDriftSummary() : drift,
  )
  const activePetAnimation = settled ? petAnimation ?? 'idle' : PET_INTRO_ANIMATION[introId]
  const tipText = getLang() === 'zh' ? randomTip.zh : randomTip.en

  return (
    <Box ref={ref} flexDirection="column" marginTop={1}>
      <Box flexDirection="row" width="100%" alignItems="flex-start">
        {showWhale && (
          <PetSprite
            animation={activePetAnimation}
          />
        )}
        <Box flexDirection="column" flexShrink={1} marginLeft={showWhale ? 2 : 0}>
          <Text wrap="truncate-end">
            <Text bold color="claude">{sweep('✦ dsh', t, wordmarkRGB, wordmarkShimmerRGB, 60)}</Text>
            <Text dimColor>{'-TUI · v' + VERSION}</Text>
          </Text>
          <Text wrap="truncate-end">
            <Text color="claudeBlue_FOR_SYSTEM_SPINNER">{model}</Text>
            {effort !== undefined && <Text dimColor>{' · ' + capitalize(effort) + ' effort'}</Text>}
          </Text>
          <Text dimColor wrap="truncate-end">
            {'⌂ ' + cwd}
          </Text>
        </Box>
      </Box>
      <Box marginTop={1}>
        <Text wrap="truncate-end">
          <Text color="claudeBlue_FOR_SYSTEM_SPINNER">└─ {sweep(tagline, t, taglineRGB, FLASH, 60)}</Text>
          <Text dimColor>{' · ' + tr('logo-tip-prefix') + tipText + ' · /tips ' + tr('logo-tip-more')}</Text>
        </Text>
      </Box>
      {driftLine != null && (
        <Text color="warning" wrap="wrap">
          ⚠{' '}
          {tOr(
            `logo-drift-${driftLine.kind}`,
            `The dsh engine (${driftLine.versions.join(' / ')}) does not match the validated ${UPSTREAM_VALIDATED_VERSION}; reinstall via npm i -g @deepseek-ai/dsh@${UPSTREAM_VALIDATED_VERSION}.`,
            {
              installed: driftLine.versions.join(' / '),
              validated: UPSTREAM_VALIDATED_VERSION,
              primary: UPSTREAM_VALIDATED_VERSION,
            },
          )}
        </Text>
      )}
    </Box>
  )
}
