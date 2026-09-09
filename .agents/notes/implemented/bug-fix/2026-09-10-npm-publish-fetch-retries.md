# Agent Note: npm publish must not retry 429 internally

Status: implemented

English | [中文](2026-09-10-npm-publish-fetch-retries.zh.md)

## Problem

Publishing the `@x1a0f3n9` family creates many new package names. npm's new-package write budget answers `E429` with `user undefined` even when `npm whoami` is a real user. `npm publish` also retries that 429 three times in one invocation, which spends the remaining quota on the same name and stalls the rest of the family.

## Decision

Pass `--fetch-retries 0` on the publish command so one tarball makes one PUT. Keep the script-level retry, but wait 45 minutes first and cap at 60 minutes so a quota window can refill instead of hammering the same package.

## Verification

`pnpm exec vitest run scripts/release/publish.spec.ts` covers the longer backoff. A local resume publisher with the same fetch-retries setting is the live evidence that new names are attempted one PUT at a time.

## Alternatives considered

**Keep npm's default three fetch retries.** Rejected because each 429 still counts against the new-package budget.

**Fail the family after one 429.** Rejected because later names can publish once the window refills; the run should wait and continue.

## Consequences

- A branch publish of 200+ new names still takes hours to days under npm's quota.
- Existing names at the same version stay skip-only; only absent names wait on the long backoff.
