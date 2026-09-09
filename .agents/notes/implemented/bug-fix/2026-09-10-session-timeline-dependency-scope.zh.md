# Agent Note: session-timeline 不进入扁平 Client/Host relay

Status: implemented

[English](2026-09-10-session-timeline-dependency-scope.md) | 中文

## Problem

`dsh-session-timeline` 声明了 `dsh.client`，因此 `verify-package-dependencies` 把它当成扁平 Client/Host 包。宿主 rewind 路径会导入 `SessionSeq`、`createUserMessage`、`boundContextSummary`、`canonicalPath` 和 `resolveDshHome`。这些导出不在已审阅的 safe/peer-required 名单里，Release 的 `dependencies` 任务会在 npm 发布前失败。

## Decision

把 `@x1a0f3n9/dsh-session-timeline` 加进 `clientFaceExclude`，与 API session/workspace controller 同一名册。插件仍是双面 bundle 行，但不做 Host 依赖扁平化。不要把这五个导出加进全局 Host allowlist。

## Verification

`node --import tsx/esm scripts/verify-package-dependencies.ts` 报告 0 条违规。`pnpm exec vitest run scripts/verify-package-dependencies.spec.ts` 覆盖这份显式 exclude 名册。

## Alternatives considered

**把这五个导出标成 safe 或 peer-required。** 否决：那份名单是全局的，新增条目需要针对重复安装身份做明确人工审阅。

**重写 rewind 以避开这些导入。** 此次发布否决：插件已经用这些构造器追加 rewind 标记并恢复文件。

## Consequences

- session-timeline 的宿主依赖仍由该包自己声明。
- 如果以后用 service 调用替换这些 rewind 导入，再单独做 Client/Host 扁平化。
