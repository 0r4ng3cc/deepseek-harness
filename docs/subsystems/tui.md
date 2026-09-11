# Terminal UI

English | [中文](tui.zh.md)

The interactive terminal surface from [`dsh-tui`](../../packages/ui/tui). It is the `tui` profile's mode bundle over [`dsh-base`](../../packages/bundle/base/README.md): Ink rendering, plugin-host seams, and the DecisionEvents intercepts that plugins use to rewrite, consume, or veto interactive flows before they land. The [package README](../../packages/ui/tui/README.md) owns composition, configuration, and limitations; the [TUI-in-ui-group Agent Note](../../.agents/notes/implemented/architecture/2026-09-11-tui-profile-bundle-in-ui-group.md) owns why this thick surface is not a `bundle/` glue package.

Source: [`packages/ui/tui/src/dsh-adapter/extension-events.ts`](../../packages/ui/tui/src/dsh-adapter/extension-events.ts)

## Decision events

The channel fires these events through the host-mediated DecisionEvents registry rather than raw `ctx.emit`. Serial decisions (`tui/input`, `tui/rewind-prompt`, `tui/rewind-done`, `tui/session-switch`, `tui/compact`) park the originating UI flow until the first valid decision wins; a throwing or malformed handler is logged and the chain continues. The parallel notification `tui/session-switched` ignores every return value. Plugin-facing host services (`ctx.tuiDialogs`, `ctx.tuiStatus`, `ctx.tuiScenes`, and the other `tui*` keys) stay on the package README: the host-face catalog projection does not render those Context merges.

<!-- BEGIN GENERATED cordis-surface (gen-cordis-catalog.ts) — do not edit between markers -->

<a id="cordis-surface"></a>

## Cordis API

Generated from source by `scripts/gen-cordis-catalog.ts` (verified fresh by `pnpm run verify-cordis-catalog` in doc-sync; regenerate with `pnpm run gen-cordis-catalog`) — the language sides differ only in locale-specific paired document paths. Signature blocks use a `ts cordis-catalog` fence and keep the original source JSDoc; dispatch modes are defined in the [primer](../cordis-primer.md#dispatch-modes), and the framework-inherited `ctx` API lives in [cordis-api/inherited.md](../cordis-api/inherited.md).

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
