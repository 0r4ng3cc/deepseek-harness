# Agent Note: Schedule development npm publish after new-name 429

Status: implemented

English | [中文](2026-09-11-schedule-dev-npm-publish.zh.md)

## Problem

Publishing a large new-name family fails the job on the first npm `E429`. That failure is correct: the same window will not accept more names. The job then stays failed until a human pushes the development branch or dispatches the workflow, so remaining absent names wait on babysitting.

## Decision

The development `Release (dsh)` workflow also runs on a twice-daily cron (`17 2,14 * * *` UTC). Publish remains gated on `github.ref == 'refs/heads/dev-x1a0f3n9'`. The job still fails on the first `E429`; the next scheduled run probes again and publishes remaining absent names. GitHub runs `schedule` only on the default branch, which is this development branch.

## Verification

`pnpm exec vitest run scripts/ci-workflow.spec.ts` asserts the cron and that `on` includes `schedule` while publish stays ref-gated.

## Alternatives considered

**Sleep inside the job until the quota window resets.** Rejected: GitHub Actions will not keep a runner for hours, and [npm publish must not retry 429 internally](../bug-fix/2026-09-10-npm-publish-fetch-retries.md) already refused in-process waits.

**Retry `E429` in the publish script.** Rejected: the retry PUT hits the same quota. [npm registry calls must be spaced and fail on first 429](../bug-fix/2026-09-11-npm-registry-serial-spacing.md) owns fail-fast.

**Leave resumption to `workflow_dispatch` only.** Rejected: it still needs a person after every quota window.

**Exit 0 on `E429` so the check stays green.** Rejected: a required check would hide a real stop, and a later run would look like a no-op success.

**Hourly cron.** Rejected: pack is about ten minutes and quota windows last hours, so most hourly runs would only probe and fail.

## Consequences

- A quota `E429` still fails that run.
- The next cron continues remaining absent names without another push.
- GitHub disables `schedule` after 60 days of repository inactivity; push and `workflow_dispatch` remain backstops.
- Workflow concurrency still cancels an in-flight scheduled pack when a new push arrives on the same ref; the publish job itself does not cancel in progress.

## Related

[npm registry calls must be spaced and fail on first 429](../bug-fix/2026-09-11-npm-registry-serial-spacing.md) still owns probe and PUT gaps.
[Publish absent package names before present versions](../bug-fix/2026-09-11-publish-absent-names-first.md) still owns the two-pass order.
