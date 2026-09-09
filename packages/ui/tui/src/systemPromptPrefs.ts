/**
 * 用户自定义系统提示词，保存在 ~/.dsh-tui/system-prompt.txt。
 * `/system` 全屏编辑写入这里；空文件或缺失表示不追加自定义段。
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { DATA_DIR } from './utils/paths.js'

const FILE = 'system-prompt.txt'

/**
 * 读取自定义系统提示词。
 * @param dir - 偏好目录（测试可注入）。
 * @returns 去掉首尾空白后的文本；未设置时为空串。
 */
export function readSystemPromptPref(dir: string = DATA_DIR): string {
  try {
    return readFileSync(join(dir, FILE), 'utf8').trim()
  } catch {
    return ''
  }
}

/**
 * 写入自定义系统提示词。空串删除有效内容（写成空文件）。
 * @param text - 提示词正文。
 * @param dir - 偏好目录（测试可注入）。
 * @returns 是否写入成功。
 */
export function writeSystemPromptPref(text: string, dir: string = DATA_DIR): boolean {
  try {
    mkdirSync(dir, { recursive: true })
    writeFileSync(join(dir, FILE), text, 'utf8')
    return true
  } catch {
    return false
  }
}
