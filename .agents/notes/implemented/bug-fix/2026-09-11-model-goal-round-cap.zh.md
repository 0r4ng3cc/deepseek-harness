# Agent Note: model tools do not apply a guessed goal round cap

Status: implemented

[English](2026-09-11-model-goal-round-cap.md) | 中文

## Problem

`create_goal` 和 `update_goal` 会接受 `max_goal_rounds` 并把它存成 `maxGoalRounds`。模型经常随手填 3 或 8。这个存下来的上限会在 `roundsStarted` 达到后挡住 resume，看起来像 harness 默认值，而不是模型参数。

## Decision

`create_goal` 忽略 `max_goal_rounds`，因此使用 goal 服务的 `defaultMaxGoalRounds`（100000）。`update_goal` 的 edit 在调用领域层之前，会把模型给出的上限抬到 `DEFAULT_MAX_GOAL_ROUNDS`。可选 schema 字段保留，零仍是严格 schema 的填充值。直接的 `ctx.goals.create` / `edit` 仍接受显式上限，供测试和非模型调用方使用。已经持久化的快照保持原上限，直到一次授权 edit 把它抬上去。

## Verification

`packages/goal/tool-goal/tests/tool-goal.spec.ts` 会用 `max_goal_rounds: 9` 创建、用 `max_goal_rounds: 8` 编辑，两次结果都保持 `maxGoalRounds: 100000`。pause 和 resume 仍把非零上限当作跨 action 字段拒绝。

## Alternatives considered

**从工具 schema 里删掉 `max_goal_rounds`。** 否决：该字段复制进大量已录制的工具 schema 快照，忽略或抬高取值就能堵住这个漏洞，不必带动那些快照。

**对所有领域 create 和 edit 都抬高，包括测试。** 否决：单元测试和可选 API 调用方仍需要小上限来覆盖 `round-limit`。

**改写已经存成 8 或 256 的会话日志。** 否决：已提交的会话产物保持不变；下一次带上限的授权 edit 会把它抬上去。

**自动恢复已经因 `model-reported` 被挡住的 goal。** 否决：那是另一项模型判断，不是这个上限漏洞。

## Consequences

- 模型创建时把 harness 默认值而不是 3 或 8 存成续行预算。
- 模型 edit 如果传入 8，会存成 100000，从而可以抬高更早的过小上限。
- 已经存成 8 的会话在那次 edit 之前仍是 8，并且 `model-reported` 挡住的 goal 仍需要显式 resume。

## Related

[默认 Goal Round 上限为 100000](../feature/2026-09-11-goal-default-round-cap.zh.md)
[面向模型的同会话 goal 工具](../feature/2026-07-19-model-facing-goal-tools.zh.md)
