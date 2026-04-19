/**
 * R84.CI (a11y priority 1): shared a11y utilities for the Phaser React
 * wrapper. Separate file so PhaserGame.tsx stays a component-only module
 * and React Refresh keeps hot-reloading its UI without needing to flush
 * every dependent game. Tests import from here directly.
 */

/**
 * Build the screen-reader announcement for a `gameOver` event. Pure so
 * tests can pin the `score + reason` → string mapping without having to
 * mount the full wrapper + Phaser stack. The live region renders this
 * inside `role="status"` + `aria-live="polite"` so screen readers read
 * the outcome the moment the scene emits the event.
 */
export function buildGameOverAnnouncement(data?: { score?: number; reason?: string }): string {
  const score = data?.score;
  const reason = data?.reason;
  const scorePart = typeof score === 'number' ? ` Final score ${score}.` : '';
  const reasonPart = reason ? ` ${reason}.` : '';
  return `Game over.${scorePart}${reasonPart}`.trim();
}
