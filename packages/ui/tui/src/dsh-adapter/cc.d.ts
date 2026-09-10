/**
 * Typing shims for the ported Ink core and dsh-tui additions.
 *
 * This file is a MODULE (top-level import) so every `declare module` block is
 * a module augmentation that merges with the real declarations — a global
 * script file would shadow them instead.
 */
import type {} from 'react'

// The published Claude Code source was transformed by the React Compiler:
// components are `function X(t0)` and import the compiler runtime's `c`
// helper (an effect-slot array). @types/react does not declare the
// compiler-runtime subpath.
declare module 'react/compiler-runtime' {
  export function c(size: number): unknown[]
}

// The fork renders custom DOM element names for its reconciler; the original
// source's global.d.ts (which declared them) is not part of the published
// Claude Code source.
declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'ink-box': {
        ref?: ((el: {
          scrollTop?: number
          onStickyRestore?: () => void
        } | null) => void) | { current: unknown }
        tabIndex?: number
        autoFocus?: boolean
        onClick?: (event: unknown) => void
        onContextMenu?: (event: unknown) => void
        onDragStart?: (event: unknown) => void
        onDragMove?: (event: unknown) => void
        onDragEnd?: (event: unknown) => void
        onWheel?: (event: { deltaY: number; deltaX: number }) => void
        onFocus?: (event: unknown) => void
        onFocusCapture?: (event: unknown) => void
        onBlur?: (event: unknown) => void
        onBlurCapture?: (event: unknown) => void
        onMouseEnter?: (event: unknown) => void
        onMouseLeave?: (event: unknown) => void
        onKeyDown?: (event: unknown) => void
        onKeyDownCapture?: (event: unknown) => void
        style?: unknown
        children?: React.ReactNode
      }
      'ink-text': unknown
      'ink-link': unknown
      'ink-raw': unknown
      'ink-raw-ansi': unknown
    }
  }
}

// The ported core probes Bun's fast string-width/wrap implementations at
// module scope; dsh-tui runs on Node, where the probes must stay inert.
interface BunRuntime {
  wrapAnsi?: (input: string, columns: number, options?: {
    hard?: boolean
    wordWrap?: boolean
    trim?: boolean
  }) => string
  stringWidth?: (input: string, options?: { ambiguousIsNarrow?: boolean }) => number
}

declare global {
  const Bun: BunRuntime | undefined
}

// `session/title` records are appended by the optional dsh-session-title
// plugin; declare the record here so the channel can render it without that
// dependency (mirrors the plugin's own merge-extensible augmentation).
declare module '@deepseek-ai/dsh-session' {
  interface SessionEventMap {
    'session/title': { title: string }
  }
}
