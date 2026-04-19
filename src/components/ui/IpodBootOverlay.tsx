import { useEffect, useRef } from 'react';

interface IpodBootOverlayProps {
  title: string;
}

// Mirrors the glyph bank in `MatrixRainCanvas` so the launcher visually rhymes
// with the landing-page background rain — same katakana + digits, same bright
// leading character. Local copy keeps this launcher independent of the full
// background canvas's lifecycle and sizing logic (the launcher is short-lived
// and scoped to the iPod bezel, not the viewport).
const KATAKANA =
  'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
const DIGITS = '0123456789';
const GLYPHS = KATAKANA + DIGITS;

// Phase timeline from R83.G10 — total 450 ms. Stays inside the 500 ms GamePortal
// safety timeout; if `GAME_TRANSITION_READY_EVENT` lifts the mask early, the
// rAF loop simply halts when the overlay unmounts.
const PHASE_BLACK_MS = 100;
const PHASE_WARMUP_MS = 100;
const PHASE_GLYPH_MS = 150;
const PHASE_WIPE_MS = 100;
const TOTAL_MS = PHASE_BLACK_MS + PHASE_WARMUP_MS + PHASE_GLYPH_MS + PHASE_WIPE_MS;
const T_WARMUP = PHASE_BLACK_MS;
const T_GLYPH = T_WARMUP + PHASE_WARMUP_MS;
const T_WIPE = T_GLYPH + PHASE_GLYPH_MS;

// 4 columns matches Tom's "3-4 columns" brief — enough to feel like rain,
// sparse enough to read the title/status text that sits on top.
const NUM_COLUMNS = 4;

export function IpodBootOverlay({ title }: IpodBootOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // prefers-reduced-motion: skip the animated launcher entirely. The overlay
    // still mounts (CSS gives it a solid black fill + shortened fade), but we
    // don't fire rAF so no motion sickness trigger.
    const reduce =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      const w = canvas.clientWidth || 1;
      const h = canvas.clientHeight || 1;
      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const columns = Array.from({ length: NUM_COLUMNS }, (_, i) => ({
      // Evenly spread between the vertical edges (i+1)/(n+1) leaves margin
      // so glyphs don't crowd the title/status text.
      xFrac: (i + 1) / (NUM_COLUMNS + 1),
      seed: Math.floor(Math.random() * GLYPHS.length),
      // Up to 20% of the glyph window — gentle desync so columns don't march
      // in lockstep.
      delayFrac: Math.random() * 0.2,
    }));

    const start = performance.now();
    let raf = 0;

    const draw = (now: number) => {
      const t = now - start;
      const w = canvas.clientWidth || 1;
      const h = canvas.clientHeight || 1;
      ctx.clearRect(0, 0, w, h);

      // (b) phosphor warm-up — radial green glow + scanline tint fade in
      if (t >= T_WARMUP) {
        const warm = Math.min(1, (Math.min(t, TOTAL_MS) - T_WARMUP) / PHASE_WARMUP_MS);
        const grad = ctx.createRadialGradient(
          w / 2,
          h / 2,
          0,
          w / 2,
          h / 2,
          Math.max(w, h) * 0.75,
        );
        grad.addColorStop(0, `rgba(0, 80, 0, ${0.45 * warm})`);
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        ctx.globalAlpha = 0.08 * warm;
        ctx.fillStyle = '#00ff00';
        for (let y = 0; y < h; y += 3) {
          ctx.fillRect(0, y, w, 1);
        }
        ctx.globalAlpha = 1;
      }

      // (c) falling glyph sweep — each column drops from the top toward the
      // bottom during the 150 ms window, leaving a fading trail behind.
      if (t >= T_GLYPH) {
        const fontSize = Math.max(14, Math.floor(h / 12));
        ctx.font = `${fontSize}px 'Press Start 2P', monospace`;
        ctx.textBaseline = 'top';
        for (const col of columns) {
          const localT =
            Math.min(t, TOTAL_MS) - T_GLYPH - col.delayFrac * PHASE_GLYPH_MS;
          if (localT <= 0) continue;
          const progress = Math.min(1, localT / PHASE_GLYPH_MS);
          const x = col.xFrac * w - fontSize / 2;
          const lead = Math.floor(progress * (h / fontSize + 2));
          for (let i = 0; i <= lead; i++) {
            const y = (i - 1) * fontSize;
            if (y < -fontSize || y > h) continue;
            // Deterministic glyph pick per (column, row) — stable across frames.
            const ch = GLYPHS[(col.seed + i * 7) % GLYPHS.length];
            if (i === lead) {
              ctx.fillStyle = '#aaffaa';
              ctx.shadowBlur = 10;
              ctx.shadowColor = '#00ff00';
              ctx.fillText(ch, x, y);
              ctx.shadowBlur = 0;
            } else {
              const fade = Math.max(0.15, 1 - (lead - i) * 0.12);
              ctx.fillStyle = `rgba(0, 255, 0, ${fade})`;
              ctx.fillText(ch, x, y);
            }
          }
        }
      }

      // (d) vertical scanline wipe — a bright horizontal band sweeps top→bottom
      // in the last 100 ms, punctuating the reveal.
      if (t >= T_WIPE) {
        const wipe = Math.min(1, (t - T_WIPE) / PHASE_WIPE_MS);
        const y = wipe * h;
        const band = 14;
        const grad = ctx.createLinearGradient(0, y - band, 0, y + band);
        grad.addColorStop(0, 'rgba(0, 255, 0, 0)');
        grad.addColorStop(0.5, 'rgba(200, 255, 200, 0.9)');
        grad.addColorStop(1, 'rgba(0, 255, 0, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, y - band, w, band * 2);
      }

      if (t < TOTAL_MS) {
        raf = requestAnimationFrame(draw);
      }
    };

    raf = requestAnimationFrame(draw);
    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div
      className="ipod-boot-overlay"
      data-testid="ipod-boot-overlay"
      aria-hidden="true"
    >
      <canvas
        ref={canvasRef}
        className="ipod-boot-canvas"
        aria-hidden="true"
      />
      <div className="ipod-boot-title">{title}</div>
      <div className="ipod-boot-status">INITIALISING MATRIX…</div>
    </div>
  );
}
