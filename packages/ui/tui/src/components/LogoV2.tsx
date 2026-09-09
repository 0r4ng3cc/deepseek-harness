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
import {
  CompactWhale,
  OPENING_SEQUENCES,
  pickOpeningSequence,
  poseFromPetAnimation,
  type OpeningStep,
  type PetAnimationName,
  type WhaleIntroId,
} from './CompactWhale.js'

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

/** 终端过窄时只保留文字，避免小鲸挤压模型和路径信息。 */
const WHALE_MIN_COLUMNS = 64
/** 4 行小鲸加上标题后，常见 24 行终端仍保留标记。 */
const WHALE_MIN_ROWS = 18

/** `max` → `Max` (effort levels arrive lower-case from the adapter). */
function capitalize(text: string): string {
  return text.length === 0 ? text : text[0].toUpperCase() + text.slice(1)
}

/**
 * 开屏沿用原有的节奏，视觉压成 Claude Code 那种信息栏：
 * 左侧 11×4 字形小鲸，右侧品牌、模型、目录；底下只留一行短提示。
 * 会话状态只切换姿势，不改变布局高度。
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
  /** Show the compact whale mark (settings `dsh-tui.whale`); off → text-only header. */
  whale?: boolean
  /** Test seam: pin/suppress the upstream-drift notice (`null` forces it off;
   * `undefined` — the production default — auto-detects the install). */
  drift?: UpstreamDriftSummary | null
  /** 会话状态对应的小鲸姿势来源；未提供时使用待机姿势。 */
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
  const introPose = settled ? undefined : sequence[step]?.pose
  const whalePose = introPose ?? poseFromPetAnimation(petAnimation)
  const tipText = getLang() === 'zh' ? randomTip.zh : randomTip.en

  return (
    <Box ref={ref} flexDirection="column" marginTop={1}>
      <Box flexDirection="row" width="100%" alignItems="center">
        {showWhale && (
          <Box marginRight={2}>
            <CompactWhale pose={whalePose} />
          </Box>
        )}
        <Box flexDirection="column" flexShrink={1}>
          <Text wrap="truncate-end">
            <Text bold color="claude">{sweep('dsh', t, wordmarkRGB, wordmarkShimmerRGB, 60)}</Text>
            <Text dimColor>{'  v' + VERSION}</Text>
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
