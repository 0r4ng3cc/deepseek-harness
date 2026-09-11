import React from 'react'
import { Box, Text } from '../ui.js'
import { stringWidth } from '../ink/stringWidth.js'
import { foldCommandName, truncateToWidth } from '../ink/truncateToWidth.js'
import type { LocalCommand } from '../commands.js'
import { localizedDescription } from '../commands.js'
import type { WheelEvent } from '../ink/events/wheel-event.js'
import { splitQueryMatch } from './SuggestionCard.js'

/**
 * `/` 命令补全列表，对齐 Claude Code 的 `PromptInputFooterSuggestions`：
 * 平铺的行，没有卡片边框/标题/页脚，也没有 `❯` 指针——选中行用
 * `suggestion` 色，其余整行 dim。名字里命中当前查询 token 的前缀保持
 * 正常亮度（bold 与 dim 在终端互斥，故提亮用非 dim）。
 *
 *   compact   Compact the conversation history
 *   compare   Compare selected messages and branches
 *
 * 鼠标能力保留：点击行 = 接受该项（与 Tab/Enter 同路径），滚轮 = 移动
 * 选中行（窗口跟随），悬停行有底色反馈。
 */
export function CommandSuggestions({
  commands,
  selectedIndex,
  columns,
  query = '',
  onPick,
  onWheelStep,
}: {
  commands: readonly (LocalCommand & { descriptionKey?: string })[]
  selectedIndex: number
  columns: number
  /** 原始 `/…` 输入；其最后一段 token 用于名字前缀高亮。 */
  query?: string
  /** 鼠标点击行（fullscreen）：上报过滤后列表的绝对索引（与键盘
   *  selectedIndex 同一索引空间），接受路径由 PromptInput 复用。 */
  onPick?: (index: number) => void
  /** 滚轮步进（fullscreen）：±1 移动选中行。 */
  onWheelStep?: (step: 1 | -1) => void
}): React.ReactNode {
  if (commands.length === 0) return null

  // 内容宽 = 总宽 − 两侧页边距；名字列上限 40%（与 Claude Code 同比例）。
  const usable = Math.max(0, columns - 4)
  const maxNameWidth = Math.floor(usable * 0.4)
  const nameWidth = Math.min(
    Math.max(...commands.map(c => stringWidth(c.name))) + 2,
    maxNameWidth,
  )

  const maxVisible = 5
  const startIndex = Math.max(
    0,
    Math.min(
      selectedIndex - Math.floor(maxVisible / 2),
      commands.length - maxVisible,
    ),
  )
  const visible = commands.slice(startIndex, startIndex + maxVisible)
  const queryToken = query.replace(/^\//, '').match(/[^ \t]*$/)?.[0] ?? ''
  const [hoveredRow, setHoveredRow] = React.useState(-1)
  const handleWheel = React.useCallback((e: WheelEvent) => {
    if (e.deltaY !== 0) onWheelStep?.(e.deltaY > 0 ? 1 : -1)
  }, [onWheelStep])

  return (
    // onWheel 直接挂 ink-box host：ThemedBox/Box 是 react-compiler 编译
    // 产物，只显式透传 onClick/hover/onKeyDown——onWheel 会落进 style
    // rest 被丢弃（ScrollBox 同因直接写 host 元素）。
    <ink-box
      style={{ flexDirection: 'column', width: '100%', flexShrink: 0 }}
      onWheel={onWheelStep !== undefined ? handleWheel : undefined}
    >
      {visible.map((command, index) => {
        const absoluteIndex = startIndex + index
        const isSelected = absoluteIndex === selectedIndex
        const tagText = command.tag ? `[${command.tag}] ` : ''
        const tagWidth = stringWidth(tagText)
        const descriptionWidth = Math.max(0, usable - 2 - nameWidth - tagWidth)
        const rawDescription = localizedDescription(command)
        const description =
          stringWidth(rawDescription) > descriptionWidth
            ? truncateToWidth(rawDescription, Math.max(0, descriptionWidth - 1)) + '…'
            : rawDescription
        const displayName = foldCommandName(command.name, nameWidth)
        const parts = splitQueryMatch(displayName, queryToken)
        const padAfter = Math.max(0, nameWidth - stringWidth(displayName))
        return (
          <Box
            key={command.name}
            flexDirection="row"
            width="100%"
            onClick={onPick === undefined ? undefined : () => { onPick(absoluteIndex) }}
            onMouseEnter={onPick === undefined ? undefined : () => { setHoveredRow(absoluteIndex) }}
            onMouseLeave={onPick === undefined
              ? undefined
              : () => { setHoveredRow(current => (current === absoluteIndex ? -1 : current)) }}
            backgroundColor={hoveredRow === absoluteIndex ? 'userMessageBackgroundHover' : undefined}
          >
            <Text wrap="truncate">
              {'  '}
              {isSelected ? (
                <Text color="suggestion">{`${displayName}${' '.repeat(padAfter)}`}</Text>
              ) : parts ? (
                // 嵌套 Text 会继承父级 dim（本 fork 的 dimColor 是颜色替换，
                // dim={false} 盖不掉），故高亮段必须与 dim 段平铺为兄弟。
                <>
                  <Text dimColor>{parts.before}</Text>
                  <Text>{parts.match}</Text>
                  <Text dimColor>{`${parts.after}${' '.repeat(padAfter)}`}</Text>
                </>
              ) : (
                <Text dimColor>{`${displayName}${' '.repeat(padAfter)}`}</Text>
              )}
              {tagText ? <Text dimColor>{tagText}</Text> : null}
              <Text color={isSelected ? 'suggestion' : undefined} dimColor={!isSelected}>
                {description}
              </Text>
            </Text>
          </Box>
        )
      })}
    </ink-box>
  )
}
