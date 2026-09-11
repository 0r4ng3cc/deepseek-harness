# Agent Note: model tools do not apply a guessed goal round cap

Status: implemented

English | [中文](2026-09-11-model-goal-round-cap.zh.md)

## Problem

`create_goal` and `update_goal` accepted `max_goal_rounds` and stored that number as `maxGoalRounds`. Models commonly guess 3 or 8. That stored cap later blocked resume once `roundsStarted` reached it, and it looked like a harness default rather than a model argument.

## Decision

`create_goal` omits `max_goal_rounds`, so the goal-service `defaultMaxGoalRounds` (100000) applies. `update_goal` edit floors a supplied cap to `DEFAULT_MAX_GOAL_ROUNDS` before calling the domain. The optional schema field remains, including zero as a strict-schema filler. Direct `ctx.goals.create` / `edit` still accept an explicit cap for tests and non-model callers. Persisted snapshots keep their stored cap until an authorized edit floors it.

## Verification

`packages/goal/tool-goal/tests/tool-goal.spec.ts` creates with `max_goal_rounds: 9` and edits with `max_goal_rounds: 8`, and both results keep `maxGoalRounds: 100000`. Pause and resume still reject a non-zero cap as a cross-action field.

## Alternatives considered

**Remove `max_goal_rounds` from the tool schema.** Rejected: the field is copied into many recorded tool-schema snapshots, and ignoring or flooring the value closes the hole without that churn.

**Floor every domain create and edit, including tests.** Rejected: unit tests and opt-in API callers still need small caps to exercise `round-limit`.

**Rewrite stored session logs that already contain 8 or 256.** Rejected: committed session artifacts stay unchanged; an edit that supplies a cap floors it on the next authorized mutation.

**Auto-resume goals already blocked as `model-reported`.** Rejected: that blocker is a separate model judgment, not this cap hole.

## Consequences

- A model create stores the harness default, not 3 or 8, as the continuation budget.
- A model edit that supplies 8 stores 100000, which can raise an older undersized cap.
- Sessions that already stored 8 stay on 8 until that edit, and `model-reported` blocked goals still need an explicit resume.

## Related

[Default goal round cap is 100000](../feature/2026-09-11-goal-default-round-cap.md)
[Model-facing same-session goal tools](../feature/2026-07-19-model-facing-goal-tools.md)
