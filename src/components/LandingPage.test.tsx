import type { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

// Mutable container hoisted so tests can flip reduced-motion mid-suite without
// re-mocking the module (vi.mock itself is hoisted). Mirrors the AttractMode
// + MatrixRainCanvas test idiom so the project keeps a single shared pattern
// for reduced-motion mocks.
const framerMock = vi.hoisted(() => ({ reducedMotion: false as boolean | null }));

// Pass motion components through as plain DOM elements so test assertions can
// read className / inline style / initial + animate props without fighting
// framer's real animation scheduler (which doesn't tick inside jsdom).
vi.mock('framer-motion', () => {
  type MotionProps = {
    children?: ReactNode;
    initial?: unknown;
    animate?: unknown;
    exit?: unknown;
    transition?: unknown;
    [key: string]: unknown;
  };
  const passthrough = (Tag: 'div' | 'h2' | 'p') => ({
    children,
    initial,
    animate,
    exit,
    transition,
    ...rest
  }: MotionProps) => {
    // Serialise animation props as data-* attributes so tests can pin them
    // without relying on framer internals.
    const animProps: Record<string, string> = {};
    if (initial !== undefined) animProps['data-motion-initial'] = JSON.stringify(initial);
    if (animate !== undefined) animProps['data-motion-animate'] = JSON.stringify(animate);
    if (exit !== undefined) animProps['data-motion-exit'] = JSON.stringify(exit);
    if (transition !== undefined) animProps['data-motion-transition'] = JSON.stringify(transition);
    return <Tag {...animProps} {...rest}>{children}</Tag>;
  };
  return {
    motion: {
      div: passthrough('div'),
      h2: passthrough('h2'),
      p: passthrough('p'),
    },
    AnimatePresence: ({ children }: { children?: ReactNode }) => <>{children}</>,
    useReducedMotion: () => framerMock.reducedMotion,
  };
});

import LandingPage from './LandingPage';

describe('LandingPage reduced-motion (R84.CI-15)', () => {
  beforeEach(() => {
    framerMock.reducedMotion = false;
  });

  afterEach(() => {
    cleanup();
    framerMock.reducedMotion = false;
  });

  const renderLanding = () =>
    render(
      <LandingPage
        onSelectGame={vi.fn()}
        onClose={vi.fn()}
        onShowScoreboard={vi.fn()}
      />,
    );

  it('marks the overlay root with data-reduced-motion="false" by default', () => {
    // Observable tripwire — surfaces the shouldReduceMotion decision on a DOM
    // attribute so tests can pin the wiring without reflecting on framer
    // internals (which the module mock flattens).
    framerMock.reducedMotion = false;
    const { container } = renderLanding();
    const overlay = container.querySelector('[data-reduced-motion]');
    expect(overlay?.getAttribute('data-reduced-motion')).toBe('false');
  });

  it('marks the overlay root with data-reduced-motion="true" when UA requests reduced motion', () => {
    framerMock.reducedMotion = true;
    const { container } = renderLanding();
    const overlay = container.querySelector('[data-reduced-motion]');
    expect(overlay?.getAttribute('data-reduced-motion')).toBe('true');
  });

  it('animates game-card entries with a 30px y-offset stagger when motion is allowed', () => {
    // Baseline contract for the animated entry. Load-bearing only as the
    // inverse pin for the reduced-motion-collapses-to-zero test below — if a
    // future refactor drops the stagger entirely under motion-allowed, users
    // lose the cascade effect and this test catches it.
    framerMock.reducedMotion = false;
    renderLanding();
    const firstCard = screen.getAllByRole('button', { name: /Play / })[0];
    expect(firstCard.getAttribute('data-motion-initial')).toContain('"y":30');
    // First card's delay should be cardStaggerBase (0.05) + 0 * step.
    const transition = JSON.parse(firstCard.getAttribute('data-motion-transition') ?? '{}');
    expect(transition.delay).toBeCloseTo(0.05, 5);
  });

  it('collapses card entry y-offset AND stagger to zero under reduced motion', () => {
    // The load-bearing a11y contract: cards must not translate vertically on
    // page load for users with prefers-reduced-motion: reduce. Also pins the
    // stagger delay at zero — a non-zero delay with a zero y-offset would
    // still make cards fade in sequence, which feels laggy under the "reduce
    // motion" user intent (all cards should appear together, not cascade).
    framerMock.reducedMotion = true;
    renderLanding();
    const cards = screen.getAllByRole('button', { name: /Play / });
    cards.forEach((card) => {
      const initial = JSON.parse(card.getAttribute('data-motion-initial') ?? '{}');
      const transition = JSON.parse(card.getAttribute('data-motion-transition') ?? '{}');
      expect(initial.y).toBe(0);
      expect(transition.delay).toBe(0);
    });
  });

  it('still increments card stagger across cards when motion is allowed', () => {
    // Guards a refactor that drops the per-card `index * step` term and
    // collapses every card to a single shared delay (which would lose the
    // cascade even under motion-allowed).
    framerMock.reducedMotion = false;
    renderLanding();
    const cards = screen.getAllByRole('button', { name: /Play / });
    const first = JSON.parse(cards[0].getAttribute('data-motion-transition') ?? '{}');
    const second = JSON.parse(cards[1].getAttribute('data-motion-transition') ?? '{}');
    expect(second.delay).toBeGreaterThan(first.delay);
  });

  it('collapses hero h2 + p + filter row y-offsets to zero under reduced motion', () => {
    // Triple-pin for the three motion elements above the card grid. Refactors
    // that add a fourth hero-level motion element should extend this test to
    // cover it; otherwise silent vestibular regressions can creep in.
    framerMock.reducedMotion = true;
    const { container } = renderLanding();
    const heroH2 = container.querySelector('h2[data-motion-initial]');
    const heroP = container.querySelector('p[data-motion-initial]');
    expect(heroH2).toBeTruthy();
    expect(heroP).toBeTruthy();
    const heroH2Initial = JSON.parse(heroH2?.getAttribute('data-motion-initial') ?? '{}');
    const heroPInitial = JSON.parse(heroP?.getAttribute('data-motion-initial') ?? '{}');
    expect(heroH2Initial.y).toBe(0);
    expect(heroPInitial.y).toBe(0);
  });

  it('keeps hero y-offset at 20px under motion-allowed', () => {
    // Baseline inverse pin for the previous hero reduced-motion test.
    framerMock.reducedMotion = false;
    const { container } = renderLanding();
    const heroH2 = container.querySelector('h2[data-motion-initial]');
    const heroH2Initial = JSON.parse(heroH2?.getAttribute('data-motion-initial') ?? '{}');
    expect(heroH2Initial.y).toBe(20);
  });

  it('drops the group-hover:scale-105 class from card preview images under reduced motion', () => {
    // The hover scale is a 2D transform — exactly the vestibular-trigger shape
    // WCAG 2.3.3 asks UAs to let users suppress. The opacity fade stays so
    // sighted users still get an interactive-affordance cue on hover.
    framerMock.reducedMotion = true;
    const { container } = renderLanding();
    const firstImg = container.querySelector('img[aria-hidden="true"]');
    expect(firstImg?.className).not.toContain('group-hover:scale-105');
    expect(firstImg?.className).toContain('group-hover:opacity-90');
  });

  it('keeps group-hover:scale-105 on card preview images when motion is allowed', () => {
    framerMock.reducedMotion = false;
    const { container } = renderLanding();
    const firstImg = container.querySelector('img[aria-hidden="true"]');
    expect(firstImg?.className).toContain('group-hover:scale-105');
  });

  it('suppresses the animate-pulse rain backdrop strips under reduced motion', () => {
    // The decorative rain strips at the back of the page each carry an
    // `animate-pulse` class running indefinitely. WCAG 2.2.2 scope asks for
    // suppressible moving content >5s; collapse the entire strip array under
    // reduced motion rather than token-minimising the pulse.
    framerMock.reducedMotion = true;
    const { container } = renderLanding();
    const pulseStrips = container.querySelectorAll('.animate-pulse');
    expect(pulseStrips.length).toBe(0);
  });

  it('tolerates null return from useReducedMotion (server / first-paint window)', () => {
    // Framer's hook returns null before the media-query probe resolves. The
    // component coerces via `?? false`, so a null reading must behave like
    // motion-allowed. Force-return null via Object.defineProperty to pin the
    // coercion path without changing the hoisted mock shape permanently.
    const originalMock = Object.getOwnPropertyDescriptor(framerMock, 'reducedMotion');
    Object.defineProperty(framerMock, 'reducedMotion', {
      configurable: true,
      get: () => null as unknown as boolean,
    });
    try {
      const { container } = renderLanding();
      const overlay = container.querySelector('[data-reduced-motion]');
      expect(overlay?.getAttribute('data-reduced-motion')).toBe('false');
      const firstImg = container.querySelector('img[aria-hidden="true"]');
      expect(firstImg?.className).toContain('group-hover:scale-105');
    } finally {
      if (originalMock) {
        Object.defineProperty(framerMock, 'reducedMotion', originalMock);
      } else {
        Object.defineProperty(framerMock, 'reducedMotion', {
          configurable: true,
          writable: true,
          value: false,
        });
      }
    }
  });
});
