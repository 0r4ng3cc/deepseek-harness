---
description: "Interactive terminal front door for DeepSeek Harness agents: the tui profile bundle over dsh-base."
kind: "package-bundle"
---

# @x1a0f3n9/dsh-tui

English | [中文](README.zh.md)

## Summary

Run `dsh --profile tui` to open an interactive terminal chat with a DeepSeek Harness agent. It uses the same model access, tools, and safety defaults as other dsh surfaces, composed from the shipped agent presets (the `standard` preset by default). Choose this package for interactive terminal work; use `dsh-headless` for one-shot command-line tasks and `dsh-web-app` for the browser GUI.

## Table of Contents

- [Use this package](#use-this-package)
- [Understand the implementation](#understand-the-implementation)
- [Further Exploration](#further-exploration)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)
- [Dev Note](#dev-note)

-----

<a id="use-this-package"></a>
## Use this package

Start the TUI in a real terminal and talk to the agent. Resume an earlier session with `--resume` or `DSH_TUI_RESUME_SESSION`.

### Starting the TUI

```sh
dsh --profile tui
dsh --profile tui --resume
```

You know it worked when the fullscreen chat screen appears and you can type. Two failures to expect: a non-TTY stdout cannot take the Ink renderer; a missing `DEEPSEEK_API_KEY` fails at the first model request, not at boot.

### Configuration

Most users never set these; the command-line and environment feed the row below. The plugin `Config` schema in [`src/dsh-adapter/index.ts`](src/dsh-adapter/index.ts) is the source for every accepted field.

| Field | Default | Meaning |
|---|---|---|
| `provider` | `deepseek-official` | LLM provider route for new sessions |
| `fullscreen` | `true` | Alt-screen fullscreen with in-app mouse selection |
| `effort` | `max` | Reasoning effort, validated against the live adapter bands |
| `preset` | roster default (`standard`) | Static preset; `DSH_TUI_PRESET` overrides the persisted `/preset` choice |
| `sessionId` | unset | Existing session to attach; `DSH_TUI_RESUME_SESSION` supplies it |

### Per-session agent setup

Each terminal session composes its own agent from the shipped presets instead of sharing one process-wide tool set. You can change the default preset or add your own presets under `$DSH_HOME/.agent-presets`.

-----

<a id="understand-the-implementation"></a>
## Understand the implementation

<details>
<summary>Implementation internals — click to expand</summary>

The package is one patch plus the terminal runtime. The storage stack and projection cache come from `dsh-base`; the TUI overlay's workspace and plugin-host rows consume those shared services. The patch restates the surface-specific values the base deliberately omits, inserts TUI-only host rows, then moves the agent plane behind presets. The runtime plugin owns session create/resume, the Ink tree, and process exit when the TUI unmounts.

### Patch semantics

A patch replaces the targeted row's whole `config`, so each TUI row restates every key it owns. The per-agent tool rows the base mounts process-wide are disabled here and the preset roster takes over; the reasoning for each host-plane versus preset-plane decision is inline in the patch.

### Source map

| File | Role |
|---|---|
| [`src/index.ts`](src/index.ts) | Re-export of the plugin factory (`name` / `inject` / `Config` / `apply`) |
| [`src/dsh-adapter/index.ts`](src/dsh-adapter/index.ts) | The `dsh-tui` plugin surface; `apply` loads the JSX render path |
| [`cordis.patch.yml`](cordis.patch.yml) | The tui patch: restated base values, TUI host rows, agent plane behind presets |
| [`vendor/dsh-std/`](vendor/dsh-std/) | Embedded `dsh-std` protocol snapshot; tsdown inlines `@dsh-std/*` into published entries |
| [`tests/tui.spec.ts`](tests/tui.spec.ts) | Bundle patch declaration and profile-row contract |

### Invariant ownership

No invariant companion is published because Ink UI, the resume marker, and plugin-host grants dispose with the fiber, session records live in `dsh-session-persistence-jsonl`, and each owning registry package carries that relation's invariant.

### Embedded dsh-std snapshot

`vendor/dsh-std` is an in-package snapshot of the DSH Standard protocol workspace, not a root [`vendor/`](../../../vendor/README.md) entry. There is no upstream git SHA recorded in this tree. Seven protocol packages are linked from the repo `pnpm-workspace.yaml` so TypeScript and tsdown can resolve them; they are not published as harness packages. Updating the snapshot is local to this package.

The package-local TypeScript config keeps looser flags for the ported Ink renderer (`src/ink`). Coverage excludes `packages/ui/tui/src/**/*` for the same reason.

</details>

-----

<a id="further-exploration"></a>
## Further Exploration

Read these pages when you want to go deeper into the shared core, profile composition, or why this package is not under `bundle/`.

- [ui group map](../README.md) — the group this package belongs to.
- [dsh-base](../../bundle/base/README.md) — the shared core the TUI runs on.
- [Profile plugin bundles note](../../../.agents/notes/implemented/architecture/2026-08-05-profile-plugin-bundles.md) — how shipped profiles stack base plus one mode bundle.
- [TUI stays in packages/ui/tui](../../../.agents/notes/implemented/architecture/2026-09-11-tui-profile-bundle-in-ui-group.md) — why the thick terminal surface is not a `bundle/` glue package.

-----

<a id="model-experience"></a>
## Model Experience

### TUI coding-agent persona

#### What the model sees

The profile supplies `You are a coding agent.` as the system-prompt persona (overridable with `DSH_TUI_PERSONA`) before first-party guidance. Each session then composes tools and prompt sections from the selected agent preset. The TUI does not register a web-style surface-orientation section.

#### Token effect

One short stable persona plus the data-dependent base prompt sections and the selected preset's tool schemas.

#### KV Cache effect

Stable for a fixed profile, provider, model, and preset. Profile changes take effect on the next process because the shipped TUI profile uses startup-only patches.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

These limits tell you what to expect in a terminal, on Windows, or when composing extra plugins. They are current package constraints, not a terminal-emulator comparison or a task backlog.

- **A real TTY is required** — stdout that is not a terminal cannot host the Ink renderer; there is no headless render fallback.
- **Configuration changes require restart** — the shipped `tui` profile uses `patchReload: startup` so one Ink tree never observes a replacement plugin graph.
- **Windows has no sandbox confinement backend** — the patch selects `danger-full-access` and `approval: never` on `win32` so bash can run.
- **Coverage does not gate this tree** — `packages/ui/tui/src/**/*` is excluded from the per-file 100% gate because the ported Ink core is third-party code under looser TypeScript flags.
- **`dsh-std` is an embedded snapshot** — there is no upstream SHA in this tree; protocol updates are local to this package and are inlined at pack time.

<a id="dev-note"></a>
### Dev Note

<details>
<summary>Working context for maintainers — click to expand</summary>

None.

</details>
