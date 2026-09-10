import { c as _c } from 'react/compiler-runtime'
import React, { type ReactNode, type Ref } from 'react'
import type { Except } from 'type-fest'
import type { DOMElement } from '../dom.js'
import type { ClickEvent } from '../events/click-event.js'
import type { ContextMenuEvent } from '../events/context-menu-event.js'
import type { DragEvent } from '../events/drag-event.js'
import type { FocusEvent } from '../events/focus-event.js'
import type { KeyboardEvent } from '../events/keyboard-event.js'
import type { PointerEvent } from '../events/pointer-event.js'
import type { WheelEvent } from '../events/wheel-event.js'
import type { Styles } from '../styles.js'
import * as warn from '../warn.js'
export type Props = Except<Styles, 'textWrap'> & {
  children?: ReactNode
  ref?: Ref<DOMElement>
  /**
   * Tab order index. Nodes with `tabIndex >= 0` participate in
   * Tab/Shift+Tab cycling; `-1` means programmatically focusable only.
   */
  tabIndex?: number
  /**
   * Focus this element when it mounts. Like the HTML `autofocus`
   * attribute — the FocusManager calls `focus(node)` during the
   * reconciler's `commitMount` phase.
   */
  autoFocus?: boolean
  /**
   * Fired on left-button click (press + release without drag). Only works
   * inside `<AlternateScreen>` where mouse tracking is enabled — no-op
   * otherwise. The event bubbles from the deepest hit Box up through
   * ancestors; call `event.stopImmediatePropagation()` to stop bubbling.
   */
  onClick?: (event: ClickEvent) => void
  /**
   * Fired on right-button press (SGR button 2). Only works inside
   * `<AlternateScreen>` where mouse tracking is enabled — no-op
   * otherwise. The event bubbles from the deepest hit Box up through
   * ancestors; call `event.stopImmediatePropagation()` to stop bubbling.
   * Carries absolute `col`/`row` so a handler can anchor a popup menu at
   * the pointer.
   */
  onContextMenu?: (event: ContextMenuEvent) => void
  /**
   * Drag protocol (DOM HTML5 drag semantics subset). Fired when the
   * pointer FIRST MOVES after an unmodified left-button press inside
   * this Box (DOM fires dragstart on first move, not on press) — only
   * inside `<AlternateScreen>` with mouse tracking enabled, and only
   * when no modifier (shift/alt/ctrl) was held at press. `onDragMove`
   * fires on every further motion (bubbles from this Box up through
   * ancestors), `onDragEnd` on release or when the session is
   * interrupted (focus loss / screen swap). A press+release without
   * movement fires NO drag events and still triggers `onClick`.
   */
  onDragStart?: (event: DragEvent) => void
  /** Fired on each pointer motion after dragstart. See onDragStart. */
  onDragMove?: (event: DragEvent) => void
  /** Fired on release after dragstart. See onDragStart. */
  onDragEnd?: (event: DragEvent) => void
  onFocus?: (event: FocusEvent) => void
  onFocusCapture?: (event: FocusEvent) => void
  onBlur?: (event: FocusEvent) => void
  onBlurCapture?: (event: FocusEvent) => void
  onKeyDown?: (event: KeyboardEvent) => void
  onKeyDownCapture?: (event: KeyboardEvent) => void
  /**
   * Fired when the mouse moves into this Box's rendered rect. Like DOM
   * `mouseenter`, does NOT bubble — moving between children does not
   * re-fire on the parent. Only works inside `<AlternateScreen>` where
   * mode-1003 mouse tracking is enabled.
   */
  onMouseEnter?: (event: PointerEvent) => void
  /** Fired when the mouse moves out of this Box's rendered rect. */
  onMouseLeave?: (event: PointerEvent) => void
  /**
   * Fired when a wheel event occurs over this Box's rendered rect (the
   * position-routed path: dispatchWheel hit-tests the deepest node whose
   * ancestor chain carries an onWheel handler — ScrollBox receives its
   * scrolls this way). `deltaY`/`deltaX` are terminal rows/columns per
   * wheel notch, positive = scroll down/right.
   */
  onWheel?: (event: WheelEvent) => void
}

/**
 * `<Box>` is an essential Ink component to build your layout. It's like `<div style="display: flex">` in the browser.
 */
function Box(t0: Props) {
  const $ = _c(51)
  let autoFocus: Props['autoFocus']
  let children: Props['children']
  let flexDirection: Props['flexDirection']
  let flexGrow: Props['flexGrow']
  let flexShrink: Props['flexShrink']
  let flexWrap: Props['flexWrap']
  let onBlur: Props['onBlur']
  let onBlurCapture: Props['onBlurCapture']
  let onClick: Props['onClick']
  let onContextMenu: Props['onContextMenu']
  let onDragStart: Props['onDragStart']
  let onDragMove: Props['onDragMove']
  let onDragEnd: Props['onDragEnd']
  let onFocus: Props['onFocus']
  let onFocusCapture: Props['onFocusCapture']
  let onKeyDown: Props['onKeyDown']
  let onKeyDownCapture: Props['onKeyDownCapture']
  let onMouseEnter: Props['onMouseEnter']
  let onMouseLeave: Props['onMouseLeave']
  let onWheel: Props['onWheel']
  let ref: Props['ref']
  let style: Styles
  let tabIndex: Props['tabIndex']
  if ($[0] !== t0) {
    const {
      children: t1,
      flexWrap: t2,
      flexDirection: t3,
      flexGrow: t4,
      flexShrink: t5,
      ref: t6,
      tabIndex: t7,
      autoFocus: t8,
      onClick: t9,
      onFocus: t10,
      onFocusCapture: t11,
      onBlur: t12,
      onBlurCapture: t13,
      onMouseEnter: t14,
      onMouseLeave: t15,
      onKeyDown: t16,
      onKeyDownCapture: t17,
      onContextMenu: t18,
      onDragStart: t20,
      onDragMove: t21,
      onDragEnd: t22,
      onWheel: t24,
      ...t23
    } = t0
    children = t1
    ref = t6
    tabIndex = t7
    autoFocus = t8
    onClick = t9
    onFocus = t10
    onFocusCapture = t11
    onBlur = t12
    onBlurCapture = t13
    onMouseEnter = t14
    onMouseLeave = t15
    onKeyDown = t16
    onKeyDownCapture = t17
    onContextMenu = t18
    onDragStart = t20
    onDragMove = t21
    onDragEnd = t22
    onWheel = t24
    style = t23
    flexWrap = t2 === undefined ? 'nowrap' : t2
    flexDirection = t3 === undefined ? 'row' : t3
    flexGrow = t4 === undefined ? 0 : t4
    flexShrink = t5 === undefined ? 1 : t5
    const layoutStyle = style
    warn.ifNotInteger(layoutStyle.margin, 'margin')
    warn.ifNotInteger(layoutStyle.marginX, 'marginX')
    warn.ifNotInteger(layoutStyle.marginY, 'marginY')
    warn.ifNotInteger(layoutStyle.marginTop, 'marginTop')
    warn.ifNotInteger(layoutStyle.marginBottom, 'marginBottom')
    warn.ifNotInteger(layoutStyle.marginLeft, 'marginLeft')
    warn.ifNotInteger(layoutStyle.marginRight, 'marginRight')
    warn.ifNotInteger(layoutStyle.padding, 'padding')
    warn.ifNotInteger(layoutStyle.paddingX, 'paddingX')
    warn.ifNotInteger(layoutStyle.paddingY, 'paddingY')
    warn.ifNotInteger(layoutStyle.paddingTop, 'paddingTop')
    warn.ifNotInteger(layoutStyle.paddingBottom, 'paddingBottom')
    warn.ifNotInteger(layoutStyle.paddingLeft, 'paddingLeft')
    warn.ifNotInteger(layoutStyle.paddingRight, 'paddingRight')
    warn.ifNotInteger(layoutStyle.gap, 'gap')
    warn.ifNotInteger(layoutStyle.columnGap, 'columnGap')
    warn.ifNotInteger(layoutStyle.rowGap, 'rowGap')
    $[0] = t0
    $[1] = autoFocus
    $[2] = children
    $[3] = flexDirection
    $[4] = flexGrow
    $[5] = flexShrink
    $[6] = flexWrap
    $[7] = onBlur
    $[8] = onBlurCapture
    $[9] = onClick
    $[10] = onFocus
    $[11] = onFocusCapture
    $[12] = onKeyDown
    $[13] = onKeyDownCapture
    $[14] = onMouseEnter
    $[15] = onMouseLeave
    $[16] = onContextMenu
    $[44] = onDragStart
    $[45] = onDragMove
    $[46] = onDragEnd
    $[50] = onWheel
    $[17] = ref
    $[18] = style
    $[19] = tabIndex
  } else {
    autoFocus = $[1] as Props['autoFocus']
    children = $[2] as Props['children']
    flexDirection = $[3] as Props['flexDirection']
    flexGrow = $[4] as Props['flexGrow']
    flexShrink = $[5] as Props['flexShrink']
    flexWrap = $[6] as Props['flexWrap']
    onBlur = $[7] as Props['onBlur']
    onBlurCapture = $[8] as Props['onBlurCapture']
    onClick = $[9] as Props['onClick']
    onFocus = $[10] as Props['onFocus']
    onFocusCapture = $[11] as Props['onFocusCapture']
    onKeyDown = $[12] as Props['onKeyDown']
    onKeyDownCapture = $[13] as Props['onKeyDownCapture']
    onMouseEnter = $[14] as Props['onMouseEnter']
    onMouseLeave = $[15] as Props['onMouseLeave']
    onContextMenu = $[16] as Props['onContextMenu']
    onDragStart = $[44] as Props['onDragStart']
    onDragMove = $[45] as Props['onDragMove']
    onDragEnd = $[46] as Props['onDragEnd']
    onWheel = $[50] as Props['onWheel']
    ref = $[17] as Props['ref']
    style = $[18] as Styles
    tabIndex = $[19] as Props['tabIndex']
  }
  const layoutStyle = style
  const t1 = layoutStyle.overflowX ?? layoutStyle.overflow ?? 'visible'
  const t2 = layoutStyle.overflowY ?? layoutStyle.overflow ?? 'visible'
  let t3: Styles
  if (
    $[20] !== flexDirection
    || $[21] !== flexGrow
    || $[22] !== flexShrink
    || $[23] !== flexWrap
    || $[24] !== style
    || $[25] !== t1
    || $[26] !== t2
  ) {
    t3 = {
      flexWrap,
      flexDirection,
      flexGrow,
      flexShrink,
      ...style,
      overflowX: t1,
      overflowY: t2,
    }
    $[20] = flexDirection
    $[21] = flexGrow
    $[22] = flexShrink
    $[23] = flexWrap
    $[24] = style
    $[25] = t1
    $[26] = t2
    $[27] = t3
  } else {
    t3 = $[27] as Styles
  }
  let t4: React.ReactNode
  if (
    $[28] !== autoFocus
    || $[29] !== children
    || $[30] !== onBlur
    || $[31] !== onBlurCapture
    || $[32] !== onClick
    || $[33] !== onContextMenu
    || $[47] !== onDragStart
    || $[48] !== onDragMove
    || $[49] !== onDragEnd
    || $[34] !== onFocus
    || $[35] !== onFocusCapture
    || $[36] !== onKeyDown
    || $[37] !== onKeyDownCapture
    || $[38] !== onMouseEnter
    || $[39] !== onMouseLeave
    || $[40] !== ref
    || $[41] !== t3
    || $[42] !== tabIndex
    || $[50] !== onWheel
  ) {
    t4 = (
      <ink-box
        ref={ref}
        tabIndex={tabIndex}
        autoFocus={autoFocus}
        onClick={onClick}
        onContextMenu={onContextMenu}
        onDragStart={onDragStart}
        onDragMove={onDragMove}
        onDragEnd={onDragEnd}
        onWheel={onWheel}
        onFocus={onFocus}
        onFocusCapture={onFocusCapture}
        onBlur={onBlur}
        onBlurCapture={onBlurCapture}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onKeyDown={onKeyDown}
        onKeyDownCapture={onKeyDownCapture}
        style={t3}
      >
        {children}
      </ink-box>
    )
    $[28] = autoFocus
    $[29] = children
    $[30] = onBlur
    $[31] = onBlurCapture
    $[32] = onClick
    $[33] = onContextMenu
    $[47] = onDragStart
    $[48] = onDragMove
    $[49] = onDragEnd
    $[34] = onFocus
    $[35] = onFocusCapture
    $[36] = onKeyDown
    $[37] = onKeyDownCapture
    $[38] = onMouseEnter
    $[39] = onMouseLeave
    $[40] = ref
    $[41] = t3
    $[42] = tabIndex
    $[43] = t4
  } else {
    t4 = $[43]
  }
  return t4
}
export default Box
