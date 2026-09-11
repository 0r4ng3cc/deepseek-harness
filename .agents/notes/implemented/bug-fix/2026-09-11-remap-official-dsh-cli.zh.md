# Agent Note: 启动时把官方 CLI 包名映射到 fork

Status: implemented

[English](2026-09-11-remap-official-dsh-cli.md) | 中文

## Problem

`dsh-context` 从 `$DSH_HOME/profiles` 探测 `@deepseek-ai/dsh`，用来判断 harness 是否达到 `0.1.2-rc.1`。启动 remap 只匹配 `@deepseek-ai/dsh-*`，于是该目录里残留的官方 CLI 会返回 `0.1.0-rc.8`，插件一直停在 fallback 门闸。本 fork 实际已是 `0.1.5-alpha.2`。

## Decision

在 `forkDshPackageName` 里把 `@deepseek-ai/dsh` 和 `@deepseek-ai/dsh/...` 映射到 `@x1a0f3n9/dsh`。`@deepseek-ai/dsh-session` 仍走库前缀，避免被当成 CLI 子路径。现有 Node resolve hook 随后会读到 fork CLI 的版本。

## Verification

`pnpm exec vitest run packages/boot/app-boot/tests/official-package-resolve.spec.ts`

## Alternatives considered

**忽略 home 上的 CLI 探测，改信库包版本。** 否决：插件在 `@deepseek-ai/dsh` 能解析时会优先用它，残留官方 CLI 仍会获胜。

**删掉 profile 树里残留的 `@deepseek-ai/dsh`。** 否决：官方 `dsh` 和 `xfdsh` 可能共用 home，fork 不能要求用户清掉那份安装。

## Consequences

- 向官方 CLI 发起的 home 版本探测会落到本 fork 的 CLI。
- `@deepseek-ai/dsh-session` 和其他 `dsh-*` 库仍走原来的 remap。
