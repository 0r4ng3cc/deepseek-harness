# Q-003 Claude Code chrome
State: done

## Goal
Align Chat REPL chrome with Claude Code: prompt, status, messages, overlays — interaction, not mascot.

## Contract
- PromptInput, StatusLine, MessageList, command/file suggestions, Theme/Model pickers stay Ink overlays.
- Double-Esc rewind, working activity line, context bar remain.
- Visual density follows MASTER.md (tight padding, left-accent user/assistant, shimmer on brand text).

## Targets
- `packages/ui/tui/src/screens/Chat.tsx`
- `packages/ui/tui/src/screens/StatusLine.tsx`
- `packages/ui/tui/src/components/PromptInput.tsx`
- `packages/ui/tui/src/components/MessageList.tsx`
- related design-system primitives

## Constraints
Do not port Claude Code proprietary services. Adapter boundary (`src/dsh-adapter/`) stays the only `@deepseek-ai/*` import surface for UI.

## Verification
- Type-to-send, `/help`, `/model`, `/theme` still open overlays.
- Status line still shows model + context/TPS when a turn is running.
- No adapter-boundary verifier regression.
