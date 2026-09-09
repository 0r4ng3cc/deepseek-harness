# TUI Claude chrome

Surface: Ink TUI (`packages/ui/tui`) for local agent REPL. Audience: terminal users who know Claude Code, on a DSH product.
Evidence: DeepSeek favicon fill `#4D6BFE`; TUI shimmer BRAND/ICE/FLASH; Claude Code density (Clawd ~9 cols); current 40×13 Excel whale + 雾蓝 rejected.
Precedence: this master overrides Gentle Mist Blue and the large pixel whale. `Theme` field names stay the code contract. Custom themes still win over built-ins.

## Color
- Brand: `#4D6BFE` (DeepSeek). Dark text `#E8ECF8`, subtle `#9AA3C2`, success `#4ADE80`, error `#F87171`, warning `#FBBF24`.
- Ice ladder: `#93BEFF` / `#D7E4FF` / flash `#C6D8F8` (shimmer, never white).
- Light: brand `#4D6BFE`, text `#1B2438`, card `#F5F7FF`.
- Diff: add green / remove red, dimmed siblings.
- Not brand: mist `#7DA1DE`, Claude orange, 雾蓝 family.

## Type / space
- Dense REPL: 1-col left gutter; 1-cell accent on user/assistant rows.
- Header: compact glyph whale 11 cols × 4 rows + text column (Clawd register, not Excel sprite).

## Components
- Prompt: one bordered input; bash/permission/plan from tokens.
- Status: one bottom line (model, context, tps, git).
- Overlays: picker + Esc cancel.
- Shimmer only on brand text and working line.

## Motion
- Intro ≤ 1.2s; settled height frozen. Whale may blink/bob without layout jump.

## Assets
- Glyph whale: `clawd_body` `#4D6BFE`, pupil inverse on `clawd_background`; 11×4 settled box.
- Default no longer: 40×13 Excel whale, PetSprite whale-girl, Clawd.

## Exclusions
- Web UI. VS Code webview. Copying Clawd. Dropping the whale.
