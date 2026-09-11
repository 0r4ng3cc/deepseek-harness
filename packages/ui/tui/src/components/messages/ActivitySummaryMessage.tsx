import React, { useState } from 'react'
import { Box, Text } from '../../ui.js'
import { isMinimalMode } from '../../minimalMode.js'
import type { ClickEvent } from '../../ink/events/click-event.js'

/**
 * 落定活动段的一行斜体摘要。点击展开回原来的思考行与工具卡。
 */
export function ActivitySummaryMessage({
  text,
  addMargin,
  isSelected = false,
  onClick,
}: {
  text: string
  addMargin: boolean
  isSelected?: boolean
  onClick?: (event: ClickEvent) => void
}): React.ReactNode {
  const [hovered, setHovered] = useState(false)
  const hoverProps = onClick !== undefined
    ? { onMouseEnter: () => { setHovered(true) }, onMouseLeave: () => { setHovered(false) } }
    : {}
  const mark = isMinimalMode() ? '*' : '  '
  return (
    <Box
      marginTop={addMargin ? 1 : 0}
      backgroundColor={isSelected ? 'messageActionsBackground' : undefined}
      onClick={onClick}
      {...hoverProps}
    >
      <Text italic dimColor={!hovered} color={hovered ? 'text' : undefined}>{`${mark} ${text}`}</Text>
    </Box>
  )
}
