# RQ-001 current surface
Fact:
- `packages/ui/tui` is `@deepseek-ai/dsh-tui`, already a Claude-Code-style Ink TUI (LogoV2, ThemePicker, PromptInput, AgentView).
- `../dsh-TUI` is chimney's plugin repo; in-tree package still points repository URL there.
- Built-in themes: `dark`, `dark-ansi`, `light`, plus `auto`. Identity is Gentle Mist Blue; mascot is pixel whale / PetSprite whale-girl.
- `PROFILE_TEMPLATES.tui` = base + `@deepseek-ai/dsh-tui`. CLI has `web` alias, no `tui` alias.
- `llm-pi-ai` uses `@earendil-works/pi-ai` catalogs including anthropic, openai, openai-codex, google, xai, deepseek.
- `dsh-auth` OAuth mounts `openai-codex`, `anthropic`, `xai`. Google provider auth is `GEMINI_API_KEY`.
- Default TUI route: `deepseek-official` / `deepseek-v4-flash`.
Infer: user dissatisfaction is identity (theme + whale), not missing TUI.
Suggest: keep interaction chrome; replace identity; expose named providers in TUI chrome.
