import { stringWidth } from './stringWidth.js'

/**
 * Slice a string to at most `maxWidth` terminal cells, walking by code
 * point so CJK wide characters never split mid-glyph. Assumes no ANSI in
 * the input (callers pass plain text).
 */
export function truncateToWidth(text: string, maxWidth: number): string {
  let width = 0
  let out = ''
  for (const char of text) {
    const charWidth = stringWidth(char)
    if (width + charWidth > maxWidth) break
    width += charWidth
    out += char
  }
  return out
}

/**
 * 斜杠菜单名字列的显示文本：超过列宽时尾部收成省略号，避免把说明挤出
 * 行（Claude 长命令名同样收进 40% 名字列）。
 */
export function foldCommandName(name: string, nameWidth: number): string {
  if (nameWidth <= 0) return ''
  if (stringWidth(name) <= nameWidth) return name
  return truncateToWidth(name, Math.max(0, nameWidth - 1)) + '…'
}
