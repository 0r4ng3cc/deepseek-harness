import React from 'react'
import { t } from '../i18n.js'
import { formatTokens } from '../cc/format.js'
import { Box, Text, useAnimationFrame, useTerminalSize } from '../ui.js'
import { ProgressBar } from './design-system/ProgressBar.js'
import { compactingBarRatio } from './compactingProgress.js'

/**
 * In-flight `/compact` overlay (Claude's "Compacting conversation" block):
 * title, block progress bar, token readout. Percent is omitted — the engine
 * has no live compact progress.
 */
export function CompactingOverlay({
  tokens,
}: {
  tokens: number
}): React.ReactNode {
  const { columns } = useTerminalSize()
  const [ref, time] = useAnimationFrame(80)
  const clockStart = React.useRef<number | null>(null)
  if (clockStart.current === null) clockStart.current = time
  const ratio = compactingBarRatio(Math.max(0, time - clockStart.current))
  const barWidth = Math.max(8, Math.min(32, columns - 4))
  return (
    <Box ref={ref} flexDirection="column" marginTop={1} width="100%">
      <Text color="claude">{t('compact-progress-title')}</Text>
      <ProgressBar ratio={ratio} width={barWidth} fillColor="claude" emptyColor="inactive" />
      <Text dimColor>{t('compact-progress-tokens', { tokens: formatTokens(tokens) })}</Text>
    </Box>
  )
}
