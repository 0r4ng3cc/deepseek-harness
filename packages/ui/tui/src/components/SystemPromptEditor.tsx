import React from 'react'
import { Box, Text, useInput, useTerminalSize } from '../ui.js'
import { t } from '../i18n.js'
import { EditorButton } from './PromptEditor.js'
import { usePageInset } from './PageMargin.js'

/**
 * `/system` 全屏编辑：多行草稿，Enter 换行，Ctrl+Enter 保存，Esc 取消。
 */
export function SystemPromptEditor({
  initial,
  onSave,
  onCancel,
}: {
  initial: string
  onSave: (text: string) => void
  onCancel: () => void
}): React.ReactNode {
  const [value, setValue] = React.useState(initial)
  const [cursor, setCursor] = React.useState(initial.length)
  const { columns, rows } = useTerminalSize()
  const inset = usePageInset()
  const bodyRows = Math.max(6, rows + 2 * inset.y - 6)

  useInput((input, key) => {
    if (key.escape) {
      onCancel()
      return
    }
    if (key.ctrl && (key.return || input === '\n' || input === '\r')) {
      onSave(value)
      return
    }
    if (key.return) {
      setValue(v => v.slice(0, cursor) + '\n' + v.slice(cursor))
      setCursor(c => c + 1)
      return
    }
    if (key.backspace || key.delete) {
      if (cursor <= 0) return
      setValue(v => v.slice(0, cursor - 1) + v.slice(cursor))
      setCursor(c => Math.max(0, c - 1))
      return
    }
    if (key.leftArrow) {
      setCursor(c => Math.max(0, c - 1))
      return
    }
    if (key.rightArrow) {
      setCursor(c => Math.min(value.length, c + 1))
      return
    }
    if (input && !key.ctrl && !key.meta) {
      setValue(v => v.slice(0, cursor) + input + v.slice(cursor))
      setCursor(c => c + input.length)
    }
  })

  const lines = value.split('\n')
  let offset = 0
  let cursorLine = 0
  let cursorCol = 0
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? ''
    if (cursor <= offset + line.length) {
      cursorLine = i
      cursorCol = cursor - offset
      break
    }
    offset += line.length + 1
    cursorLine = i
    cursorCol = line.length
  }
  const start = Math.max(0, cursorLine - bodyRows + 1)
  const window = lines.slice(start, start + bodyRows)

  return (
    <Box
      position="absolute"
      top={-inset.y}
      left={-inset.x}
      width={columns + 2 * inset.x}
      height={rows + 2 * inset.y}
      flexDirection="column"
      flexShrink={0}
      overflow="hidden"
      opaque
      paddingX={1}
      paddingY={1}
    >
      <Text bold color="claude">{t('system-editor-title')}</Text>
      <Text dimColor>{t('system-editor-hint')}</Text>
      <Box flexDirection="column" flexGrow={1} marginTop={1} overflow="hidden">
        {window.map((line, index) => {
          const abs = start + index
          if (abs !== cursorLine) {
            return <Text key={abs} wrap="truncate-end">{line || ' '}</Text>
          }
          const left = line.slice(0, cursorCol)
          const ch = line.slice(cursorCol, cursorCol + 1) || ' '
          const right = line.slice(cursorCol + 1)
          return (
            <Text key={abs} wrap="truncate-end">
              {left}<Text inverse>{ch}</Text>{right}
            </Text>
          )
        })}
      </Box>
      <Box flexDirection="row" columnGap={1} marginTop={1}>
        <EditorButton
          label={t('system-editor-save')}
          hint="Ctrl+Enter"
          primary
          onClick={() => onSave(value)}
        />
        <EditorButton
          label={t('system-editor-cancel')}
          hint="Esc"
          onClick={onCancel}
        />
      </Box>
    </Box>
  )
}
