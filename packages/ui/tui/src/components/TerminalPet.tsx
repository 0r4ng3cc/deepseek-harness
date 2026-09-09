import React from 'react'
import { useTerminalSize } from '../ui.js'
import { isMinimalMode } from '../minimalMode.js'
import type { Channel } from '../dsh-adapter/channel.js'
import { PetSprite, type PetAnimationName } from './PetSprite.js'

const PET_MIN_COLUMNS = 48
const PET_MIN_ROWS = 20
const TRANSIENT_STATE_MS = 1500

export type PetState =
  | 'startup'
  | 'input'
  | 'thinking'
  | 'loading'
  | 'running'
  | 'success'
  | 'failed'

const PET_ANIMATION_BY_STATE: Record<PetState, PetAnimationName> = {
  startup: 'waving',
  input: 'idle',
  thinking: 'review',
  loading: 'waiting',
  running: 'running',
  success: 'jumping',
  failed: 'failed',
}

/** 宠物动画只反映会话状态；布局由 LogoHeader 负责，避免浮层覆盖输入区。 */
export function useTerminalPetAnimation(channel: Channel): PetAnimationName {
  const [startup, setStartup] = React.useState(true)
  const [transientState, setTransientState] = React.useState<PetState | undefined>(undefined)
  const previousWorkingRef = React.useRef(channel.working)
  const transientTimerRef = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  React.useEffect(() => {
    const timer = setTimeout(() => setStartup(false), 2400)
    return () => clearTimeout(timer)
  }, [])

  React.useEffect(() => {
    const wasWorking = previousWorkingRef.current
    previousWorkingRef.current = channel.working
    if (!wasWorking || channel.working) return

    const lastRow = channel.rows.at(-1)
    const failed = channel.cancelPending || lastRow?.kind === 'interrupt' || lastRow?.tool?.status === 'error'
    setTransientState(failed ? 'failed' : 'success')
    if (transientTimerRef.current !== undefined) clearTimeout(transientTimerRef.current)
    transientTimerRef.current = setTimeout(() => {
      transientTimerRef.current = undefined
      setTransientState(undefined)
    }, TRANSIENT_STATE_MS)
  }, [channel.working, channel.cancelPending, channel.rows.length])

  React.useEffect(() => () => {
    if (transientTimerRef.current !== undefined) clearTimeout(transientTimerRef.current)
  }, [])

  const state = transientState ?? resolvePetState(channel, startup)
  return PET_ANIMATION_BY_STATE[state]
}

type PetChannelSnapshot = Pick<
  Channel,
  'status' | 'working' | 'cancelPending' | 'spinnerMode' | 'activeToolCount'
>

/** 把 DSH 会话阶段映射到 terminal-pet-cli 的七种动画状态。 */
export function resolvePetState(snapshot: PetChannelSnapshot, startup: boolean): PetState {
  if (startup || snapshot.status === 'starting') return 'startup'
  if (snapshot.status === 'disposed') return 'failed'
  if (!snapshot.working) return 'input'
  if (snapshot.cancelPending) return 'failed'
  if (snapshot.spinnerMode === 'thinking') return 'thinking'
  if (snapshot.spinnerMode === 'requesting') return 'loading'
  if (snapshot.activeToolCount > 0 || snapshot.spinnerMode === 'tool-use') return 'running'
  return 'running'
}

/**
 * 终端鲸鱼娘：复用 terminal-pet-cli 的 GIF 状态与 half-block 渲染，
 * 但在 Ink 内以透明像素段绘制，不启动第二个 TTY 或 Python 进程。
 */
export function TerminalPet({ channel }: { channel: Channel }): React.ReactNode {
  const { columns, rows } = useTerminalSize()
  const hidden = isMinimalMode() || !channel.whale || columns < PET_MIN_COLUMNS || rows < PET_MIN_ROWS
  const animationName = useTerminalPetAnimation(channel)

  if (hidden) return null

  return (
    <PetSprite
      animation={animationName}
      intervalMs={100}
    />
  )
}
