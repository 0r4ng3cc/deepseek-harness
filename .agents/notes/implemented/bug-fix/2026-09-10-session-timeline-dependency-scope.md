# Agent Note: keep session-timeline off the flattened Client/Host relay

Status: implemented

English | [中文](2026-09-10-session-timeline-dependency-scope.zh.md)

## Problem

`dsh-session-timeline` declares `dsh.client`, so `verify-package-dependencies` treated it as a flattened Client/Host package. Its host rewind path imports `SessionSeq`, `createUserMessage`, `boundContextSummary`, `canonicalPath`, and `resolveDshHome`. Those exports are not in the reviewed safe/peer-required lists, so the Release `dependencies` job failed before npm publish.

## Decision

Add `@x1a0f3n9/dsh-session-timeline` to `clientFaceExclude`, the same roster as the API session/workspace controllers. The plugin stays a dual-face bundle row, but Host dependency flattening does not apply. Do not add those five exports to the global Host allowlists.

## Verification

`node --import tsx/esm scripts/verify-package-dependencies.ts` reports 0 violations. `pnpm exec vitest run scripts/verify-package-dependencies.spec.ts` covers the explicit exclude roster.

## Alternatives considered

**Classify the five exports as safe or peer-required.** Rejected because that allowlist is global, and new entries are reserved for explicit human review of duplicate-install identity.

**Rewrite rewind to avoid those imports.** Rejected for this publish: the plugin already uses those constructors to append the rewind marker and restore files.

## Consequences

- Session-timeline host dependencies stay declared on the package itself.
- Later Client/Host flattening for this plugin needs a dedicated follow-up if the rewind imports are replaced by service calls.
