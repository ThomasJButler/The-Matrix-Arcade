import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';

interface MatrixRainCanvasProps {
  opacity?: number;
  fontSize?: number;
  fps?: number;
  respectReducedMotion?: boolean;
}

const KATAKANA =
  'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
const DIGITS = '0123456789';
const GLYPHS = KATAKANA + DIGITS;

export function MatrixRainCanvas({
  opacity = 0.12,
  fontSize = 14,
  fps = 30,
  respectReducedMotion = true,
}: MatrixRainCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reducedMotion = (useReducedMotion() ?? false) && respectReducedMotion;

  useEffect(() => {
    // Skip the animated rain in test mode so visual baselines are pixel-stable.
    if (typeof window !== 'undefined' && window.__TEST__) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let columns = 0;
    let drops: number[] = [];

    const sizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const newColumns = Math.floor(canvas.width / fontSize);
      if (newColumns !== columns) {
        const oldDrops = drops;
        drops = Array(newColumns).fill(0);
        for (let i = 0; i < Math.min(oldDrops.length, newColumns); i++) {
          drops[i] = oldDrops[i];
        }
        for (let i = oldDrops.length; i < newColumns; i++) {
          drops[i] = Math.floor(Math.random() * (canvas.height / fontSize));
        }
        columns = newColumns;
      }
    };

    sizeCanvas();
    for (let i = 0; i < columns; i++) {
      drops[i] = Math.floor(Math.random() * (canvas.height / fontSize));
    }

    if (reducedMotion) {
      // Paint one frozen rain frame so the Matrix backdrop visual persists
      // without continuous motion. Re-paint on resize only.
      const paintStaticFrame = () => {
        ctx.fillStyle = 'rgba(0, 0, 0, 1)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.font = `${fontSize}px monospace`;
        for (let i = 0; i < columns; i++) {
          const leadChar = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
          const x = i * fontSize;
          const y = drops[i] * fontSize;
          ctx.fillStyle = '#aaffaa';
          ctx.fillText(leadChar, x, y);
          if (drops[i] > 0) {
            const trailChar = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
            ctx.fillStyle = '#00ff00';
            ctx.fillText(trailChar, x, y - fontSize);
          }
        }
      };

      paintStaticFrame();
      const handleResize = () => {
        sizeCanvas();
        paintStaticFrame();
      };
      window.addEventListener('resize', handleResize);
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }

    let animationId = 0;
    let lastTime = 0;
    const frameInterval = 1000 / fps;

    const draw = (timestamp: number) => {
      if (timestamp - lastTime < frameInterval) {
        animationId = requestAnimationFrame(draw);
        return;
      }
      lastTime = timestamp;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < columns; i++) {
        const char = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        // Leading character is brighter white-green
        ctx.fillStyle = '#aaffaa';
        ctx.fillText(char, x, y);

        // Trailing character overwrites with standard green
        if (drops[i] > 0) {
          const prevChar = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
          ctx.fillStyle = '#00ff00';
          ctx.fillText(prevChar, x, (drops[i] - 1) * fontSize);
        }

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }

      animationId = requestAnimationFrame(draw);
    };

    animationId = requestAnimationFrame(draw);
    window.addEventListener('resize', sizeCanvas);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', sizeCanvas);
    };
  }, [fontSize, fps, reducedMotion]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none"
      style={{ opacity, zIndex: 0 }}
      data-reduced-motion={reducedMotion ? 'true' : 'false'}
    />
  );
}
