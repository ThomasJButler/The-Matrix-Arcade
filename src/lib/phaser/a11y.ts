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

/**
 * R84.CI-2 (a11y priority 2): build the screen-reader announcement for a
 * `scoreMilestone` event. Matrix Bird fires at 50/100/250 via a one-shot
 * COLLECTIBLE stinger; sighted players hear the cue, AT users previously
 * heard nothing because the scene had no live-region surface. Short phrase
 * so it doesn't interrupt the next beat of play — screen readers typically
 * read `polite` updates during pauses in speech, so a 3-word announcement
 * clears before the next pipe-pass call would land.
 *
 * Accepts the same defensive shape as `buildGameOverAnnouncement` — an
 * undefined or malformed payload returns an empty string, which the live
 * region renders as a no-op rather than blurting a garbled announcement.
 */
export function buildScoreMilestoneAnnouncement(data?: { value?: number }): string {
  const value = data?.value;
  if (typeof value !== 'number' || !Number.isFinite(value)) return '';
  return `Score milestone ${value}.`;
}
