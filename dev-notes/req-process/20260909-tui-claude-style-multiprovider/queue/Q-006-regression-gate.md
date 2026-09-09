# Q-006 regression gate
State: done

## Goal
Prove the TUI still boots and old sessions/themes/providers keep working.

## Contract
- Adapter boundary, patch-surface, i18n, model-route, theme catalog verifiers pass.
- DeepSeek official route still default when no pref is set.
- Custom theme files and whale-era theme names do not crash.

## Targets
- existing `packages/ui/tui` verify scripts
- modelRoute tests
- theme catalog tests

## Constraints
Do not expand to web snapshot suite unless a TUI change breaks a shared package.

## Verification
- `pnpm --filter @deepseek-ai/dsh-tui run verify:build` (or the in-tree equivalent) passes for the touched gates.
- Unit tests for `resolveModelRoute` still assert `deepseek-official` / `deepseek-v4-flash` default.
