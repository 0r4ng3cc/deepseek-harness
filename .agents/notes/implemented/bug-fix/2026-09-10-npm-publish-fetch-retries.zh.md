# Agent Note: npm publish 不得在内部重试 429

Status: implemented

[English](2026-09-10-npm-publish-fetch-retries.md) | 中文

## Problem

发布 `@x1a0f3n9` 这一族会创建大量新包名。npm 的新包写入额度会返回 `E429`，文案里写 `user undefined`，即使 `npm whoami` 已是真实用户。`npm publish` 还会在一次调用里把这次 429 重试三次，把剩余额度耗在同一个名字上，后面的包全部卡住。

## Decision

给 publish 命令加上 `--fetch-retries 0`，一个 tarball 只发一次 PUT。脚本层仍然重试，但第一次等待 45 分钟，上限 60 分钟，好让额度窗口恢复，而不是反复打同一个包。

## Verification

`pnpm exec vitest run scripts/release/publish.spec.ts` 覆盖更长的退避。本地用同样 fetch-retries 设置的续发脚本，是新包名一次只 PUT 一次的现场证据。

## Alternatives considered

**保留 npm 默认的三次 fetch 重试。** 否决：每次 429 仍会计入新包额度。

**一次 429 就让整族失败。** 否决：额度恢复后后面的名字还能发；这次运行应该等待并继续。

## Consequences

- 一次分支发布 200 多个新名字，在 npm 额度下仍要数小时到数天。
- 同版本已存在的名字仍然只 skip；只有缺失的名字才走长退避。
