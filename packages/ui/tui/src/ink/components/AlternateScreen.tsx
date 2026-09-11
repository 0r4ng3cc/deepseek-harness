import { c as _c } from 'react/compiler-runtime'
import React, { type PropsWithChildren, useContext, useInsertionEffect } from 'react'
import instances from '../instances.js'
import { logMouseDebug } from '../../utils/debug.js'
import { DISABLE_MOUSE_TRACKING, ENABLE_MOUSE_TRACKING, ENTER_ALT_SCREEN, EXIT_ALT_SCREEN } from '../termio/dec.js'
import { TerminalWriteContext } from '../useTerminalNotification.js'
import Box from './Box.js'
import { TerminalSizeContext } from './TerminalSizeContext.js'
type Props = PropsWithChildren<{
  /** Enable SGR mouse tracking (wheel + click/drag). Default true. */
  mouseTracking?: boolean
}>

/**
 * Run children in the terminal's alternate screen buffer, constrained to
 * the viewport height. While mounted:
 *
 * - Enters the alt screen (DEC 1049), clears it, homes the cursor
 * - Constrains its own height to the terminal row count, so overflow must
 *   be handled via `overflow: scroll` / flexbox (no native scrollback)
 * - Optionally enables SGR mouse tracking (wheel + click/drag) — events
 *   surface as `ParsedKey` (wheel) and update the Ink instance's
 *   selection state (click/drag)
 *
 * On unmount, disables mouse tracking and exits the alt screen, restoring
 * the main screen's content. Safe for use in ctrl-o transcript overlays
 * and similar temporary fullscreen views — the main screen is preserved.
 *
 * Notifies the Ink instance via `setAltScreenActive()` so the renderer
 * keeps the cursor inside the viewport (preventing the cursor-restore LF
 * from scrolling content) and so signal-exit cleanup can exit the alt
 * screen if the component's own unmount doesn't run.
 */
export function AlternateScreen(t0: Props) {
  const $ = _c(7)
  const {
    children,
    mouseTracking: t1,
  } = t0
  const mouseTracking = t1 === undefined ? true : t1
  const size = useContext(TerminalSizeContext)
  const writeRaw = useContext(TerminalWriteContext)
  let t2
  let t3
  if ($[0] !== mouseTracking || $[1] !== writeRaw) {
    t2 = () => {
      // Same fallback as Chat's reanchor plumbing: embedders and test
      // harnesses render with a stdout that is not process.stdout, so the
      // strict key lookup would miss the only live instance and the
      // alt-screen flag would never flip — silently killing click/hover
      // dispatch (both are gated on altScreenActive). The "any instance"
      // fallback is deliberately narrowed to the SINGLE-instance case:
      // with several live Ink instances (multi-app embedding, tests
      // running in parallel) guessing the first one would flip the wrong
      // app's alt-screen state.
      const ink = instances.get(process.stdout) ?? (instances.size === 1 ? instances.values().next().value : undefined)
      logMouseDebug('alt-screen enter', { mouseTracking, inkFound: ink !== undefined, writeRaw: !!writeRaw, stack: new Error().stack?.split('\n').slice(2, 5).join(' | ') })
      if (!writeRaw) {
        return
      }
      writeRaw(ENTER_ALT_SCREEN + '\x1B[2J\x1B[H' + (mouseTracking ? ENABLE_MOUSE_TRACKING : ''))
      ink?.setAltScreenActive(true, mouseTracking)
      return () => {
        logMouseDebug('alt-screen exit', { stack: new Error().stack?.split('\n').slice(2, 5).join(' | ') })
        ink?.setAltScreenActive(false)
        ink?.clearTextSelection()
        writeRaw((mouseTracking ? DISABLE_MOUSE_TRACKING : '') + EXIT_ALT_SCREEN)
      }
    }
    t3 = [writeRaw, mouseTracking]
    $[0] = mouseTracking
    $[1] = writeRaw
    $[2] = t2
    $[3] = t3
  } else {
    t2 = $[2]
    t3 = $[3]
  }
  useInsertionEffect(t2 as React.EffectCallback, t3 as React.DependencyList)
  const t4 = size?.rows ?? 24
  let t5
  if ($[4] !== children || $[5] !== t4) {
    t5 = <Box flexDirection="column" height={t4} width="100%" flexShrink={0}>{children}</Box>
    $[4] = children
    $[5] = t4
    $[6] = t5
  } else {
    t5 = $[6]
  }
  return t5 as React.ReactNode
}
