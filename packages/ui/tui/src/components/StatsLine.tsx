import type { Channel } from '../dsh-adapter/channel.js'
import { t } from '../i18n.js'

/** 解码速度：≥10 取整，低于 10 保留一位小数。 */
function formatTps(tps: number): string {
  const clamped = Math.max(0, tps)
  return clamped >= 10 ? String(Math.round(clamped)) : String(Math.round(clamped * 10) / 10)
}

/**
 * 会话解码速度（`132 tok/s`）——底栏只留这一项实时指标；轮/步、LLM 与
 * 首 token 耗时留在 channel 的 sessionStats 里，需要时再取。没有跑过
 * 回合或没有解码样本时返回空串。
 * @param channel - 当前会话 channel。
 * @returns 速度串，或空串。
 */
export function formatRunStats(channel: Channel): string {
  const stats = channel.sessionStats
  if (stats.steps <= 0 || stats.decodeMs <= 0) return ''
  return t('stats-tps', { tps: formatTps(stats.decodeTokens / (stats.decodeMs / 1000)) })
}
