/**
 * Test-mode activator. Enabled when the URL contains `?test=1`.
 *
 * - Sets `window.__TEST__ = true` so existing per-scene `exposeTestState()` writes state.
 * - Replaces `Math.random` with a deterministic mulberry32 PRNG seeded from `?seed=N`
 *   (default 42). This is intentionally the smallest possible change that makes all 27
 *   `Math.random()` callsites reproducible without per-file edits. Production users
 *   never visit `?test=1`, so the override is a no-op outside Playwright runs.
 *
 * Imported from `src/main.tsx` before any game code so the override is in place
 * when scenes initialise.
 */

declare global {
  interface Window {
    __TEST__?: boolean;
    __SEED__?: number;
  }
}

function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let x = t;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

if (typeof window !== 'undefined') {
  const params = new URLSearchParams(window.location.search);
  if (params.get('test') === '1') {
    const seed = Number.parseInt(params.get('seed') ?? '42', 10) || 42;
    window.__TEST__ = true;
    window.__SEED__ = seed;
    Math.random = mulberry32(seed);
  }
}

export {};
