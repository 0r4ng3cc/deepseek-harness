/**
 * Compact overlay fill. `compactNow` yields `shadowedTokenCount` only after
 * success — there is no live percent — so the bar eases toward 92% over 12s
 * and never claims completion while the flight is still open.
 */
export function compactingBarRatio(elapsedMs: number): number {
  const elapsed = Math.max(0, elapsedMs)
  const t = Math.min(1, elapsed / 12_000)
  return 0.92 * (1 - (1 - t) ** 3)
}
