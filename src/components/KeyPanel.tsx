import React from 'react';
import type { GameEntry } from '../data/gameRegistry';

export interface ControlHint {
  key: string;
  meaning: string;
}

/**
 * Per-game control reference. Curated rather than parsed because the prose
 * `controls` strings in `gameRegistry.ts` are authored for the instructions
 * modal and split awkwardly (e.g. "Arrows/WASD to move, Z/X to rotate, C to
 * hold"). A structured map keeps the panel concise and consistent; the
 * fallback parser below catches anything missing.
 */
const IN_PLAY_CONTROLS: Record<string, ControlHint[]> = {
  'ctrl-s-world': [
    { key: '\u2191\u2193', meaning: 'Navigate' },
    { key: 'ENTER', meaning: 'Confirm' },
    { key: 'TYPE', meaning: 'Commands' },
    { key: 'ESC', meaning: 'Exit' },
  ],
  'snake-classic': [
    { key: 'WASD', meaning: 'Move' },
    { key: '\u2191\u2193\u2190\u2192', meaning: 'Move' },
    { key: 'P', meaning: 'Pause' },
    { key: 'ESC', meaning: 'Exit' },
  ],
  'vortex-pong': [
    { key: '\u2191\u2193', meaning: 'Paddle' },
    { key: 'W/S', meaning: 'Paddle' },
    { key: 'MOUSE', meaning: 'Paddle' },
    { key: 'P', meaning: 'Pause' },
    { key: 'ESC', meaning: 'Exit' },
  ],
  'matrix-cloud': [
    { key: 'SPACE', meaning: 'Flap' },
    { key: 'CLICK', meaning: 'Flap' },
    { key: 'P', meaning: 'Pause' },
    { key: 'ESC', meaning: 'Exit' },
  ],
  'matrix-invaders': [
    { key: '\u2190\u2192', meaning: 'Move' },
    { key: 'SPACE', meaning: 'Fire' },
    { key: 'B', meaning: 'Bullet time' },
    { key: 'P', meaning: 'Pause' },
    { key: 'ESC', meaning: 'Exit' },
  ],
  metris: [
    { key: '\u2190\u2192', meaning: 'Move' },
    { key: 'Z/X', meaning: 'Rotate' },
    { key: 'C', meaning: 'Hold' },
    { key: 'SPACE', meaning: 'Hard drop' },
    { key: 'B', meaning: 'Bullet time' },
    { key: 'ESC', meaning: 'Exit' },
  ],
  'matrix-frogger': [
    { key: '\u2191\u2193\u2190\u2192', meaning: 'Move' },
    { key: 'WASD', meaning: 'Move' },
    { key: 'K', meaning: 'Kung fu' },
    { key: 'P', meaning: 'Pause' },
    { key: 'ESC', meaning: 'Exit' },
  ],
  'neo-jump': [
    { key: '\u2190\u2192', meaning: 'Move' },
    { key: 'A/D', meaning: 'Move' },
    { key: '\u2191 / W', meaning: 'Jetpack' },
    { key: 'SPACE', meaning: 'Shoot' },
    { key: 'P', meaning: 'Pause' },
    { key: 'ESC', meaning: 'Exit' },
  ],
  'agent-chase': [
    { key: '\u2191\u2193\u2190\u2192', meaning: 'Move' },
    { key: 'WASD', meaning: 'Move' },
    { key: 'P', meaning: 'Pause' },
    { key: 'ESC', meaning: 'Exit' },
  ],
  'rhythm-hacker': [
    { key: 'D', meaning: 'Lane 1' },
    { key: 'F', meaning: 'Lane 2' },
    { key: 'J', meaning: 'Lane 3' },
    { key: 'K', meaning: 'Lane 4' },
    { key: 'P', meaning: 'Pause' },
    { key: 'ESC', meaning: 'Exit' },
  ],
  'cloud-jumper': [
    { key: 'SPACE', meaning: 'Jump' },
    { key: '\u2191 / W', meaning: 'Jump' },
    { key: 'P', meaning: 'Pause' },
    { key: 'ESC', meaning: 'Exit' },
  ],
  'code-breaker': [
    { key: '\u2190\u2192', meaning: 'Paddle' },
    { key: 'MOUSE', meaning: 'Paddle' },
    { key: 'SPACE', meaning: 'Launch' },
    { key: 'B', meaning: 'Bullet time' },
    { key: 'P', meaning: 'Pause' },
    { key: 'ESC', meaning: 'Exit' },
  ],
};

/**
 * Static-mode universal arcade controls. Mirrors the keyboard handler in
 * GamePortal (`handleWheelKeyDown`) so the panel reflects what actually works.
 */
export const STATIC_CONTROLS: readonly ControlHint[] = [
  { key: '\u2190\u2192', meaning: 'Navigate' },
  { key: '\u2191', meaning: 'Menu' },
  { key: '\u2193', meaning: 'Scores' },
  { key: 'ENTER', meaning: 'Play' },
  { key: 'ESC', meaning: 'Exit' },
  { key: '1\u20139', meaning: 'Jump' },
  { key: 'HOME/END', meaning: 'First/Last' },
  { key: 'SWIPE', meaning: 'Touch nav' },
] as const;

/**
 * Best-effort fallback parser for games missing from IN_PLAY_CONTROLS.
 * Splits the registry's prose `controls` string on common delimiters and
 * extracts `KEY → meaning` pairs. Unrecognised segments pass through as
 * meaning-only rows. Exported for unit tests.
 */
export function parseControlsString(controls: string): ControlHint[] {
  if (!controls) return [];
  return controls
    .split(/[,|.]/)
    .map((seg) => seg.trim())
    .filter(Boolean)
    .map((seg) => {
      const m = seg.match(/^([A-Z0-9↑↓←→/\s]+?)\s*(?::|\sto\s|\sfor\s)\s*(.+)$/i);
      if (m) {
        return { key: m[1].trim().toUpperCase(), meaning: m[2].trim() };
      }
      return { key: '', meaning: seg };
    });
}

export interface KeyPanelProps {
  game?: GameEntry;
  isPlaying: boolean;
}

export function KeyPanel({ game, isPlaying }: KeyPanelProps) {
  const showInPlay = isPlaying && Boolean(game);

  const hints = React.useMemo<ControlHint[]>(() => {
    if (showInPlay && game) {
      return IN_PLAY_CONTROLS[game.id] ?? parseControlsString(game.controls);
    }
    return [...STATIC_CONTROLS];
  }, [showInPlay, game]);

  const title = showInPlay ? 'NOW PLAYING' : 'ARCADE KEYS';
  const subtitle = showInPlay && game ? game.title : 'iPod Classic Navigation';

  return (
    <aside
      className="key-panel"
      aria-label={showInPlay ? 'Game controls reference' : 'Arcade navigation controls reference'}
      data-testid="key-panel"
      data-mode={showInPlay ? 'in-play' : 'static'}
    >
      <div className="key-panel-header">
        <span className="key-panel-dot" aria-hidden="true" />
        <span className="key-panel-title">{title}</span>
      </div>
      <div className="key-panel-subtitle" aria-hidden="true">
        {subtitle}
      </div>
      <ul className="key-panel-list">
        {hints.map((hint, i) => (
          <li key={`${hint.key}-${hint.meaning}-${i}`} className="key-panel-row">
            <kbd className="key-panel-key">{hint.key || '\u2022'}</kbd>
            <span className="key-panel-meaning">{hint.meaning}</span>
          </li>
        ))}
      </ul>
      <div className="key-panel-scanline" aria-hidden="true" />
    </aside>
  );
}

export default KeyPanel;
