/**
 * Typing shims for the ported Ink core and dsh-tui additions.
 *
 * This file is a MODULE (top-level import) so every `declare module` block is
 * a module augmentation that merges with the real declarations — a global
 * script file would shadow them instead.
 */
import type { Ref } from 'react'
// Aliased because an unqualified name inside a `declare module 'react'` block
// resolves to React's own export first: DOMElement, DragEvent, FocusEvent,
// KeyboardEvent, PointerEvent and WheelEvent all exist there and would shadow
// these.
import type { DOMElement as InkDOMElement } from '../ink/dom.js'
import type { ClickEvent as InkClickEvent } from '../ink/events/click-event.js'
import type { ContextMenuEvent as InkContextMenuEvent } from '../ink/events/context-menu-event.js'
import type { DragEvent as InkDragEvent } from '../ink/events/drag-event.js'
import type { FocusEvent as InkFocusEvent } from '../ink/events/focus-event.js'
import type { KeyboardEvent as InkKeyboardEvent } from '../ink/events/keyboard-event.js'
import type { PointerEvent as InkPointerEvent } from '../ink/events/pointer-event.js'
import type { WheelEvent as InkWheelEvent } from '../ink/events/wheel-event.js'

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
        ref?: Ref<InkDOMElement>
        tabIndex?: number
        autoFocus?: boolean
        onClick?: (event: InkClickEvent) => void
        onContextMenu?: (event: InkContextMenuEvent) => void
        onDragStart?: (event: InkDragEvent) => void
        onDragMove?: (event: InkDragEvent) => void
        onDragEnd?: (event: InkDragEvent) => void
        onWheel?: (event: InkWheelEvent) => void
        onFocus?: (event: InkFocusEvent) => void
        onFocusCapture?: (event: InkFocusEvent) => void
        onBlur?: (event: InkFocusEvent) => void
        onBlurCapture?: (event: InkFocusEvent) => void
        onMouseEnter?: (event: InkPointerEvent) => void
        onMouseLeave?: (event: InkPointerEvent) => void
        onKeyDown?: (event: InkKeyboardEvent) => void
        onKeyDownCapture?: (event: InkKeyboardEvent) => void
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
