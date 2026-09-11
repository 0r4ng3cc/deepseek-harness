---
description: "The interactive terminal package group: the TUI profile bundle over dsh-base."
kind: "package-group"
---

# ui/ — interactive terminal surface

English | [中文](README.zh.md)

## Summary

The ui group provides one package: the interactive terminal front door for DeepSeek Harness agents. It is the `tui` profile's mode bundle over [`dsh-base`](../bundle/base/README.md), not a thin glue package in `bundle/`. A user runs `dsh --profile tui` to chat with an agent in the terminal. This page maps the group; the package README owns the per-package contract.

## Table of Contents

- [Packages](#packages)
- [Related documentation](#related-documentation)
- [Dev Note](#dev-note)

-----

<a id="packages"></a>
## Packages

| Package | Role |
|---|---|
| [`tui/`](tui/README.md) | Interactive terminal profile bundle over dsh-base: Ink renderer, plugin-host seams, and the tui patch |

-----

<a id="related-documentation"></a>
## Related documentation

- [TUI subsystem](../../docs/subsystems/tui.md) — decision-point events and the generated Cordis API.
- [dsh-base](../bundle/base/README.md) — the shared core the TUI runs on.
- [Profile plugin bundles note](../../.agents/notes/implemented/architecture/2026-08-05-profile-plugin-bundles.md) — how shipped profiles stack base plus one mode bundle.
- [TUI stays in packages/ui/tui](../../.agents/notes/implemented/architecture/2026-09-11-tui-profile-bundle-in-ui-group.md) — why the thick terminal surface is not a `bundle/` glue package.

<a id="dev-note"></a>
## Dev Note

None.
