import React from 'react'
import { Box, Text } from '../ui.js'
import { t } from '../i18n.js'
import type { ChatRow } from '../dsh-adapter/channel.js'
import { Pane } from './design-system/Pane.js'
import { ListItem } from './design-system/ListItem.js'
import { HintLine } from './design-system/HintLine.js'

function toolRows(rows: readonly ChatRow[]): ChatRow[] {
  return rows.filter(row => row.kind === 'tool' && row.tool !== undefined)
}

/**
 * 本回合工具卡详情：名称、状态、参数/结果摘要。
 */
export function ToolsPanel({
  rows,
  focusIndex,
}: {
  rows: readonly ChatRow[]
  focusIndex: number
}): React.ReactNode {
  const tools = toolRows(rows)
  const focused = tools[focusIndex]
  const detail = focused?.tool
  return (
    <Pane color="permission">
      <Box flexDirection="column">
        <Box marginBottom={1}>
          <Text color="remember" bold>{t('runpane-tools-title')}</Text>
        </Box>
        {tools.length === 0 ? (
          <Text dimColor>{t('runpane-tools-empty')}</Text>
        ) : tools.map((row, index) => (
          <ListItem
            key={row.id}
            isFocused={index === focusIndex}
            description={row.tool?.status ?? ''}
          >
            {row.tool?.name ?? 'tool'}
          </ListItem>
        ))}
        {detail !== undefined && (
          <Box flexDirection="column" marginTop={1}>
            <Text dimColor wrap="truncate-end">{detail.argsText}</Text>
            {detail.resultText !== undefined && detail.resultText !== '' && (
              <Text wrap="truncate-end">{detail.resultText}</Text>
            )}
            {detail.errorText !== undefined && detail.errorText !== '' && (
              <Text color="error" wrap="truncate-end">{detail.errorText}</Text>
            )}
          </Box>
        )}
        <Text dimColor>
          <HintLine text={t('runpane-tools-hint')} />
        </Text>
      </Box>
    </Pane>
  )
}

export function countToolRows(rows: readonly ChatRow[]): number {
  return toolRows(rows).length
}
