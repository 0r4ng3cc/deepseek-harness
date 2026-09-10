import React from 'react'
import { Box, Text, useTerminalSize } from '../../ui.js'
import { POINTER } from '../../cc/figures.js'
import { stringWidth } from '../../ink/stringWidth.js'
import { wrapWidth } from '../../sessions/format.js'
import { useTooltip } from '../Tooltip.js'
import type { ClickEvent } from '../../ink/events/click-event.js'

type Props = {
  text: string
  /** Adds the top margin between turns (CC: addMargin). */
  addMargin: boolean
  /** Message-selection mode highlight. */
  isSelected?: boolean
  onClick?: (event: ClickEvent) => void
}

/**
 * User prompt bubble: `❯ text` in white on a quiet dark surface, so the
 * user's turn reads as a distinct message without tinting the whole
 * transcript.
 */
export function UserPromptMessage({
  text,
  addMargin,
  isSelected = false,
  onClick,
}: Props): React.ReactNode {
  const { columns } = useTerminalSize()
  const promptPrefix = `${POINTER} `
  const prefixWidth = stringWidth(promptPrefix)
  // Wrap here instead of letting Ink wrap the whole Text node. Ink starts an
  // automatic continuation at column zero, while a prompt needs a hanging
  // indent for both explicit newlines and width-based visual lines.
  // Leave a small safety margin for the ScrollBox edge/scrollbar. The Text
  // nodes below are explicitly wrapped, so they must never be wrapped again by
  // Ink; a second wrap would move the continuation back to column zero.
  const lines = wrapWidth(text, Math.max(1, columns - prefixWidth - 3))
  const continuationIndent = ' '.repeat(prefixWidth)
  // Hover tooltip: a message that wrapped/truncated onto several visual
  // lines pops its full original text in one floating card (the pointer
  // row only shows one visual line at a time).
  const promptTooltip = useTooltip(text)
  const tooltipActive = lines.length > 1

  return (
    <Box
      flexDirection="column"
      marginTop={addMargin ? 1 : 0}
      backgroundColor={isSelected ? 'messageActionsBackground' : 'userMessageBackground'}
      paddingRight={1}
      onClick={onClick}
      {...(tooltipActive ? promptTooltip : {})}
    >
      {lines.map((line, index) => (
        <Text key={index} color="text" bold wrap="truncate-end">
          {index === 0 ? `${POINTER} ` : continuationIndent}
          {line}
        </Text>
      ))}
    </Box>
  )
}
