# Q-002 header mark
State: done

## Goal
Replace the 40×13 pixel whale / PetSprite whale-girl with a compact original whale mark.

## Contract
- Settled mark ≤12 columns × 6 rows (Clawd-scale, not Excel sprite).
- Palette: outline deep navy, body `#4D6BFE`, belly ice, eye/highlight white.
- Header still shows brand, model, effort, cwd, version, one tip.
- <48 cols / <20 rows drop the mark, keep text.
- Intro may animate; settled height frozen.

## Targets
- `packages/ui/tui/src/components/LogoV2.tsx`
- new compact whale module; old `Whale.tsx` / `whaleFrames.ts` / PetSprite not default.

## Constraints
Keep a whale. Do not copy Clawd. Do not keep 40-col sprite as default.

## Verification
- Startup header whale cell-box ≤12×6.
- Narrow terminal does not overflow.
- LogoV2 seams (`skipIntro`, pinned tip) still work or update in the same change.
