# Agent Note: remap the official CLI package at launch

Status: implemented

English | [中文](2026-09-11-remap-official-dsh-cli.zh.md)

## Problem

`dsh-context` probes `@deepseek-ai/dsh` from `$DSH_HOME/profiles` to decide whether the harness meets `0.1.2-rc.1`. The launch remap only matched `@deepseek-ai/dsh-*`, so a leftover official CLI in that tree answered `0.1.0-rc.8` and the plugin stayed on its fallback gate. This fork was already `0.1.5-alpha.2`.

## Decision

Map `@deepseek-ai/dsh` and `@deepseek-ai/dsh/...` onto `@x1a0f3n9/dsh` in `forkDshPackageName`. Keep `@deepseek-ai/dsh-session` on the library prefix so it does not become a CLI subpath. The existing Node resolve hook then reads the fork CLI version.

## Verification

`pnpm exec vitest run packages/boot/app-boot/tests/official-package-resolve.spec.ts`

## Alternatives considered

**Ignore the home CLI probe and trust library packages.** Rejected: the plugin prefers `@deepseek-ai/dsh` when that name resolves, so a stale official CLI still wins.

**Delete leftover `@deepseek-ai/dsh` from the profile tree.** Rejected: official `dsh` and `xfdsh` may share a home, and the fork must not require users to wipe that install.

## Consequences

- Home-anchor version probes that request the official CLI receive this fork's CLI.
- `@deepseek-ai/dsh-session` and other `dsh-*` libraries keep their existing remap.
