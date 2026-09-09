import React from 'react'
import { Box, Text } from '../ui.js'
import { t } from '../i18n.js'
import type { PendingMessage } from '../dsh-adapter/channel.js'
import { Pane } from './design-system/Pane.js'
import { ListItem } from './design-system/ListItem.js'
import { HintLine } from './design-system/HintLine.js'

/**
 * 运行中待发送队列：steer / followup。Enter 拉回编辑，Delete 丢弃。
 */
export function QueuePanel({
  pending,
  focusIndex,
  onPick,
}: {
  pending: readonly PendingMessage[]
  focusIndex: number
  onPick?: (index: number) => void
}): React.ReactNode {
  return (
    <Pane color="permission">
      <Box flexDirection="column">
        <Box marginBottom={1}>
          <Text color="remember" bold>{t('runpane-queue-title')}</Text>
        </Box>
        {pending.length === 0 ? (
          <Text dimColor>{t('runpane-queue-empty')}</Text>
        ) : pending.map((item, index) => (
          <ListItem
            key={item.id}
            isFocused={index === focusIndex}
            description={item.placement === 'steer' ? t('runpane-queue-steer') : t('runpane-queue-followup')}
            onClick={onPick === undefined ? undefined : () => onPick(index)}
          >
            {`${item.placement === 'steer' ? '⚡' : '⏳'} ${item.text}`}
          </ListItem>
        ))}
        <Text dimColor>
          <HintLine text={t('runpane-queue-hint')} />
        </Text>
      </Box>
    </Pane>
  )
}
