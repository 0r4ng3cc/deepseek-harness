# Q-001 visual identity
State: done

## Goal
Switch built-in TUI palettes from Gentle Mist Blue to DeepSeek brand blue.

## Contract
- Brand token maps to `#4D6BFE` (favicon / shimmer `BRAND`).
- Ladder: ice `#93BEFF`, pale `#D7E4FF`, flash `#C6D8F8`.
- Built-ins stay `dark`, `light`, `dark-ansi`, `auto`.
- `Theme` field names unchanged. Mist `#7DA1DE` / `#3F6CC4` are no longer brand.
- `auto` still follows OSC 11.

## Targets
- `packages/ui/tui/src/theme.ts`
- `packages/ui/tui/src/themeCatalog.ts`
- `packages/ui/tui/src/customTheme.ts`
- `packages/ui/tui/src/components/shimmer.ts`
- `dev-notes/design-system/tui-claude-chrome/MASTER.md`

## Constraints
Do not restyle Web UI. Do not rename Theme keys. Do not ship orange Claude brand.

## Verification
- `/theme` still lists dark/light/dark-ansi/auto.
- Brand/shimmer colors equal `#4D6BFE` family.
- Custom JSON themes still apply on top.
