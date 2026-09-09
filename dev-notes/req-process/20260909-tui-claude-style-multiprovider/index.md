# TUI Claude-style chrome + first-class providers

## Spec
Goal: Make `deepseek-harness` TUI feel like Claude Code interaction chrome, keep DSH whale+blue identity with DeepSeek brand color and a redesigned compact whale, and make Claude / Codex / Gemini / Grok / DeepSeek first-class routes.
Inputs: in-tree `@deepseek-ai/dsh-tui` (`packages/ui/tui`), reference `../dsh-TUI`, visual reference `../claude-code-src`, existing `llm-pi-ai` + `dsh-auth`.
Constraints: keep Cordis plugin architecture; do not rewrite web UI; do not clone Clawd; do not ship every pi-ai catalog vendor as first-class; credentials stay in existing credential/auth seams.
Output: redesigned TUI theme + header/mascot, Claude-Code-like REPL chrome, first-class named providers with login/key UX, `xfdsh tui` launch alias, tests/verifiers for theme, header, provider routes, and launch.
Notes: TUI is already in-tree (not a missing port). Default route today is `deepseek-official` / `deepseek-v4-flash`. Google/Gemini in pi-ai is API-key only.

## ER / IR
ER-1: Unify TUI with Claude Code interaction style.
ER-2: Redesign theme to DeepSeek brand blue and redraw the whale (keep the mascot, reject current mist-blue + 40-col pixel whale).
ER-3: Support Claude, Codex, Gemini, Grok, DeepSeek protocols.
ER-4: Optimize `deepseek-harness` around this TUI work.
IR-1: Keep existing TUI features (resume, agent view, /model, streaming, status). why: dsh-TUI is the product baseline. confidence: H confirm: no
IR-2: First-class providers = Anthropic, OpenAI Codex, Google Gemini, xAI Grok, DeepSeek official; other pi-ai vendors stay in provider wizard. why: user named these; catalog has 30+. confidence: H confirm: no
IR-3: Gemini uses `GEMINI_API_KEY`; Claude/Codex/Grok keep OAuth via `dsh-auth`. why: pi-ai google provider has apiKey only. confidence: H confirm: no
IR-4: "Optimize harness" means TUI integration, launch, provider UX — not a general rewrite. why: unbounded otherwise. confidence: H confirm: no
IR-5: Identity stays DSH whale + DeepSeek blue `#4D6BFE` / ice `#93BEFF`; whale is redrawn compact (Clawd-scale), not removed and not Clawd. why: user confirmed 2026-09-09. confidence: H confirm: no

## Scope
In: TUI theme tokens; header/mascot; Claude Code chrome gaps; first-class provider routes + login/key UX; `xfdsh tui` alias; profile defaults; targeted tests.
Out: Web UI redesign; copying Claude Code proprietary internals; mounting all pi-ai vendors first-class; unrelated harness refactors; treating `dsh-TUI/` as runtime dependency.
Affected: `packages/ui/tui`, `packages/ui/dsh-auth`, `packages/llm/llm-pi-ai`, `apps/cli`, `packages/boot/app-boot`.
Must not regress: session resume, /model atomic route, DeepSeek official adapter, web profile, adapter boundary.
Migration: existing `~/.dsh-tui/theme.json` whale/雾蓝 names map to new default; old custom themes still load.
Rollout: in-tree only; no npm publish required for this task.

## FR / NFR / AC
FR-1 Theme: built-in palettes become a Claude-Code-like dense REPL family (dark / light / dark-ansi / auto). AC: `/theme` lists new names; `auto` still follows OSC 11; custom JSON themes still apply.
FR-2 Header: default mark is the new compact whale (not the 40×13 Excel sprite, not PetSprite whale-girl). AC: settled header whale ≤12 cols × 6 rows; <48 cols still collapses without overflow.
FR-3 Chrome: PromptInput, StatusLine, MessageList, pickers, double-Esc rewind stay Claude-Code-shaped. AC: Chat REPL still supports type-to-send, /commands, status metrics, overlay pickers.
FR-4 Providers: TUI profile can select and call Anthropic, openai-codex, google, xai, deepseek-official without a custom gateway. AC: `/model` groups show these five when credentials exist; missing creds surface login/key, not a silent empty catalog.
FR-5 Launch: `xfdsh tui` equals `--profile tui`. AC: help lists `tui`; booting it mounts `@deepseek-ai/dsh-tui`.
NFR-1: No credential plaintext in logs. NFR-2: Theme switch does not remount the session. NFR-3: Provider add does not break DeepSeek-only installs.

## Risk
P0: none on identity (decided). P1: OAuth/app credentials for Claude/Codex/Grok may be env-specific. P2: Theme rename breaks saved `theme.json`. P3: `tui` alias collides with a user custom profile named `tui` (already the shipped template name).

## Handoff
Term: first-class provider = shipped route with catalog + auth UX, not a hand-declared OpenAI-compatible gateway.
Decision: DSH whale + DeepSeek brand blue; compact redrawn whale; Claude Code chrome density. See D-002.
Artifact: `dev-notes/req-process/20260909-tui-claude-style-multiprovider`
Design: `dev-notes/design-system/tui-claude-chrome/MASTER.md`
