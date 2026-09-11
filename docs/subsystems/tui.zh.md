# 终端界面

[English](tui.md) | 中文

来自 [`dsh-tui`](../../packages/ui/tui) 的交互式终端表层。它是 `tui` profile 叠在 [`dsh-base`](../../packages/bundle/base/README.zh.md) 之上的模式组合包：Ink 渲染、plugin-host 扩展点，以及插件在交互流程落地前用来改写、消费或否决的 DecisionEvents 拦截点。[包 README](../../packages/ui/tui/README.zh.md) 负责组合、配置与限制；[TUI 留在 ui 组的设计笔记](../../.agents/notes/implemented/architecture/2026-09-11-tui-profile-bundle-in-ui-group.zh.md) 负责说明为何这层厚表层不是 `bundle/` 粘合包。

源码：[`packages/ui/tui/src/dsh-adapter/extension-events.ts`](../../packages/ui/tui/src/dsh-adapter/extension-events.ts)

## 决策事件

通道通过宿主介导的 DecisionEvents 注册表派发这些事件，而不是原始的 `ctx.emit`。串行决策（`tui/input`、`tui/rewind-prompt`、`tui/rewind-done`、`tui/session-switch`、`tui/compact`）会停住发起方的 UI 流程，直到第一个有效决策胜出；抛错或畸形的处理器会被记录，链路继续。并行通知 `tui/session-switched` 忽略一切返回值。面向插件的宿主服务（`ctx.tuiDialogs`、`ctx.tuiStatus`、`ctx.tuiScenes` 以及其他 `tui*` 键）留在包 README：host-face catalog 投影不渲染这些 Context merge。

<!-- BEGIN GENERATED cordis-surface (gen-cordis-catalog.ts) — do not edit between markers -->

<a id="cordis-surface"></a>

## Cordis API

Generated from source by `scripts/gen-cordis-catalog.ts` (verified fresh by `pnpm run verify-cordis-catalog` in doc-sync; regenerate with `pnpm run gen-cordis-catalog`) — the language sides differ only in locale-specific paired document paths. Signature blocks use a `ts cordis-catalog` fence and keep the original source JSDoc; dispatch modes are defined in the [primer](../cordis-primer.zh.md#dispatch-modes), and the framework-inherited `ctx` API lives in [cordis-api/inherited.md](../cordis-api/inherited.md).

<a id="tui-events"></a>

### `tui/*` events

<a id="tuicompact--serial"></a>

#### `tui/compact` — serial

Fired before manual `/compact` runs. A listener may abort compaction; the first valid decision wins.

```ts cordis-catalog
/**
 * Fired before manual `/compact` runs. A listener may abort compaction;
 * the first valid decision wins.
 * @param event - the live session about to compact.
 * @mode serial
 */
'tui/compact'(event: TuiCompactEvent): TuiCompactDecision | Promise<TuiCompactDecision>
```

Source: [`packages/ui/tui/src/dsh-adapter/extension-events.ts`](../../packages/ui/tui/src/dsh-adapter/extension-events.ts)

<a id="tuiinput--serial"></a>

#### `tui/input` — serial

Fired before user-typed text is delivered to the model. A listener may rewrite, consume, or drop the line; the first valid decision wins.

```ts cordis-catalog
/**
 * Fired before user-typed text is delivered to the model. A listener may
 * rewrite, consume, or drop the line; the first valid decision wins.
 * @param event - the pending input and its followup/steer delivery.
 * @mode serial
 */
'tui/input'(event: TuiInputEvent): TuiInputDecision | Promise<TuiInputDecision>
```

Source: [`packages/ui/tui/src/dsh-adapter/extension-events.ts`](../../packages/ui/tui/src/dsh-adapter/extension-events.ts)

<a id="tuirewind-done--serial"></a>

#### `tui/rewind-done` — serial

Fired after rewind completed and the forked session is live. The first non-empty string is toasted as the post-rewind summary.

```ts cordis-catalog
/**
 * Fired after rewind completed and the forked session is live. The first
 * non-empty string is toasted as the post-rewind summary.
 * @param event - the completed rewind, including mode and child session.
 * @mode serial
 */
'tui/rewind-done'(event: TuiRewindDoneEvent): string | undefined | Promise<string | undefined>
```

Source: [`packages/ui/tui/src/dsh-adapter/extension-events.ts`](../../packages/ui/tui/src/dsh-adapter/extension-events.ts)

<a id="tuirewind-prompt--serial"></a>

#### `tui/rewind-prompt` — serial

Fired when rewind confirms a message, before the fork. A listener may abort or offer extra rewind modes; the first valid decision wins.

```ts cordis-catalog
/**
 * Fired when rewind confirms a message, before the fork. A listener may
 * abort or offer extra rewind modes; the first valid decision wins.
 * @param event - the picked message text and session seq.
 * @mode serial
 */
'tui/rewind-prompt'(event: TuiRewindPromptEvent): TuiRewindPromptDecision | Promise<TuiRewindPromptDecision>
```

Source: [`packages/ui/tui/src/dsh-adapter/extension-events.ts`](../../packages/ui/tui/src/dsh-adapter/extension-events.ts)

<a id="tuisession-switch--serial"></a>

#### `tui/session-switch` — serial

Fired before `/new` or `/resume` replaces the live session. A listener may abort the switch; the first valid decision wins.

```ts cordis-catalog
/**
 * Fired before `/new` or `/resume` replaces the live session. A listener
 * may abort the switch; the first valid decision wins.
 * @param event - the pending switch kind and optional resume target.
 * @mode serial
 */
'tui/session-switch'(event: TuiSessionSwitchEvent): TuiSessionSwitchDecision | Promise<TuiSessionSwitchDecision>
```

Source: [`packages/ui/tui/src/dsh-adapter/extension-events.ts`](../../packages/ui/tui/src/dsh-adapter/extension-events.ts)

<a id="tuisession-switched--parallel"></a>

#### `tui/session-switched` — parallel

Notification after the live session changed. Listener errors are logged and never propagated; rebind per-session state here.

```ts cordis-catalog
/**
 * Notification after the live session changed. Listener errors are logged
 * and never propagated; rebind per-session state here.
 * @param event - the session that just went live and its predecessor.
 * @mode parallel
 */
'tui/session-switched'(event: TuiSessionSwitchedEvent): void | Promise<void>
```

Source: [`packages/ui/tui/src/dsh-adapter/extension-events.ts`](../../packages/ui/tui/src/dsh-adapter/extension-events.ts)
<!-- END GENERATED cordis-surface -->
