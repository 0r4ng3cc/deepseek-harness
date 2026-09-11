import React from 'react'
import { Box, Text } from '../../ui.js'
import { formatDuration } from '../../cc/format.js'
import { TEARDROP_ASTERISK } from '../../cc/figures.js'

/**
 * Claude 风格的回合完成行。完成时间由事件时间格式化，而不是读取渲染
 * 时钟，这样历史会话恢复后仍然显示原回合的真实结束时刻。
 */
export function TurnSummaryMessage({
  durationMs,
  completedAt,
  addMargin,
}: {
  durationMs: number
  completedAt: number
  addMargin: boolean
}): React.ReactNode {
  const date = new Date(completedAt)
  const hour = date.getHours() % 12 || 12
  const minute = String(date.getMinutes()).padStart(2, '0')
  const meridiem = date.getHours() >= 12 ? 'PM' : 'AM'

  return (
    <Box marginTop={addMargin ? 1 : 0} width="100%">
      <Text dimColor italic>
        {`${TEARDROP_ASTERISK} Cogitated for ${formatDuration(durationMs)} · done ${hour}:${minute} ${meridiem}`}
      </Text>
    </Box>
  )
}
