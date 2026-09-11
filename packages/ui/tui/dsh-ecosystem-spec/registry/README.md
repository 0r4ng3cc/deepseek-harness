# dsh-TUI Admission Protocol Profile

English | [中文](README.zh.md)

[`registry-0.15.json`](registry-0.15.json) is not the global protocol registry. It describes the definition set this TUI admission profile uses:

- `imports` reference definitions a pinned dsh-std revision already provides;
- `definitions` hold only dsh-TUI private definitions.

Import entries do not copy dsh-std schema or contract bodies. Community v0.15 registers the `Command`, `LocalStorage`, `MessageObserver`, Presentation, and Workspace definitions through `@dsh-std/command`, `@dsh-std/storage`, `@dsh-std/messages`, `@dsh-std/presentation`, and `@dsh-std/workspace`.

Local definition contract profiles are pinned by SHA-256. Changing profile content must update its digest, and compatibility decides whether the coordinates stay or a new `apiVersion` is published. A digest proves byte equality only, never publisher identity.

`tui.dsh/*` is the dsh-TUI private namespace. Private definitions register into the dsh-std `ProtocolCatalog` like public ones; catalog admission alone grants no live support.

The permission catalog stays the input to TUI authorization policy. Permission grants and protocol support are decided separately; installing a definition authorizes no operation by itself.
