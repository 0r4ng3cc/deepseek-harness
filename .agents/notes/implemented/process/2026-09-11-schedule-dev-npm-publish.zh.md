# Agent Note: 开发线 npm 发布在新包名 429 后定时重试

Status: implemented

[English](2026-09-11-schedule-dev-npm-publish.md) | 中文

## Problem

发布一大批新包名时，第一次 npm `E429` 就会让 job 失败。这个失败是对的：同一个窗口不会再收下更多名字。job 随后一直失败，直到有人再推开发分支或手动 dispatch，剩下的缺失名字只能等人看着。

## Decision

开发线的 `Release (dsh)` workflow 还会按每天两次的 cron（UTC `17 2,14 * * *`）跑。发布仍然 gated 在 `github.ref == 'refs/heads/dev-x1a0f3n9'`。job 仍在第一次 `E429` 失败；下一次定时运行会再探测，并发布剩下的缺失名字。GitHub 只在默认分支上跑 `schedule`，而默认分支就是这条开发分支。

## Verification

`pnpm exec vitest run scripts/ci-workflow.spec.ts` 断言 cron，并且 `on` 包含 `schedule`，同时发布仍按 ref gated。

## Alternatives considered

**在 job 里睡到额度窗口重置。** 否决：GitHub Actions 不会把 runner 占几个小时，而且 [npm 发布不得在进程内重试 429](../bug-fix/2026-09-10-npm-publish-fetch-retries.zh.md) 已经拒绝过进程内等待。

**在发布脚本里重试 `E429`。** 否决：重试 PUT 打的还是同一额度。[npm registry 调用必须间隔，第一次 429 即失败](../bug-fix/2026-09-11-npm-registry-serial-spacing.zh.md) 负责 fail-fast。

**只靠 `workflow_dispatch` 续跑。** 否决：每个额度窗口还是要有人来点。

**遇到 `E429` 以 0 退出，让检查保持绿。** 否决：必选检查会把真正的停顿藏起来，后面的运行看起来像一次成功的空跑。

**每小时 cron。** 否决：打包大约十分钟，额度窗口以小时计，大多数整点运行只会探测然后失败。

## Consequences

- 额度 `E429` 仍会让那一次运行失败。
- 下一次 cron 不用再推一次也能继续发剩下的缺失名字。
- GitHub 在仓库 60 天无活动后会关掉 `schedule`；push 和 `workflow_dispatch` 仍是后路。
- workflow 并发仍会在同一 ref 有新 push 时取消进行中的定时 pack；publish job 本身不会中途取消。

## Related

[npm registry 调用必须间隔，第一次 429 即失败](../bug-fix/2026-09-11-npm-registry-serial-spacing.zh.md) 仍然负责探测和 PUT 间隔。
[先发布尚未存在的包名，再处理已有版本](../bug-fix/2026-09-11-publish-absent-names-first.zh.md) 仍然负责两轮顺序。
