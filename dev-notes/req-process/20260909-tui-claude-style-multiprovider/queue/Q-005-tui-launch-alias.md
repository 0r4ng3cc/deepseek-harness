# Q-005 tui launch alias
State: done

## Goal
Make TUI as easy to boot as Web: `xfdsh tui` == `--profile tui`.

## Contract
- CLI help documents `tui` beside `web`.
- Profile template stays `@deepseek-ai/dsh-base` + `@deepseek-ai/dsh-tui`.
- Inner args still forward (`xfdsh tui --resume <id>`).

## Targets
- `apps/cli/src/args.ts`
- CLI README / help strings that already mention web alias

## Constraints
Do not change default no-arg boot if it is currently web; only add the alias unless product later says otherwise.

## Verification
- `xfdsh tui --help` prints TUI/app flags, not launcher-only help.
- `xfdsh tui --dump-config` (or equivalent) shows the tui profile layers including `@deepseek-ai/dsh-tui`.
