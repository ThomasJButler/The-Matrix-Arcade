type GlyphRows = [string, string, string, string, string];

const GLYPHS: Record<string, GlyphRows> = {
  A: [' ██ ', '█  █', '████', '█  █', '█  █'],
  B: ['███ ', '█  █', '███ ', '█  █', '███ '],
  C: [' ███', '█   ', '█   ', '█   ', ' ███'],
  D: ['███ ', '█  █', '█  █', '█  █', '███ '],
  E: ['████', '█   ', '███ ', '█   ', '████'],
  F: ['████', '█   ', '███ ', '█   ', '█   '],
  G: [' ███', '█   ', '█ ██', '█  █', ' ██ '],
  H: ['█  █', '█  █', '████', '█  █', '█  █'],
  I: ['███', ' █ ', ' █ ', ' █ ', '███'],
  J: ['████', '   █', '   █', '█  █', ' ██ '],
  K: ['█  █', '█ █ ', '██  ', '█ █ ', '█  █'],
  L: ['█   ', '█   ', '█   ', '█   ', '████'],
  M: ['█   █', '██ ██', '█ █ █', '█   █', '█   █'],
  N: ['█   █', '██  █', '█ █ █', '█  ██', '█   █'],
  O: [' ██ ', '█  █', '█  █', '█  █', ' ██ '],
  P: ['███ ', '█  █', '███ ', '█   ', '█   '],
  Q: [' ██ ', '█  █', '█  █', '█ ██', ' ███'],
  R: ['███ ', '█  █', '███ ', '█ █ ', '█  █'],
  S: [' ███', '█   ', ' ██ ', '   █', '███ '],
  T: ['████', ' █  ', ' █  ', ' █  ', ' █  '],
  U: ['█  █', '█  █', '█  █', '█  █', ' ██ '],
  V: ['█   █', '█   █', ' █ █ ', ' █ █ ', '  █  '],
  W: ['█   █', '█   █', '█ █ █', '██ ██', ' █ █ '],
  X: ['█   █', ' █ █ ', '  █  ', ' █ █ ', '█   █'],
  Y: ['█   █', ' █ █ ', '  █  ', '  █  ', '  █  '],
  Z: ['████', '  █ ', ' █  ', '█   ', '████'],
  '0': [' ██ ', '█  █', '█  █', '█  █', ' ██ '],
  '1': [' █ ', '██ ', ' █ ', ' █ ', '███'],
  '2': [' ██ ', '█  █', '  █ ', ' █  ', '████'],
  '3': ['███ ', '   █', ' ██ ', '   █', '███ '],
  '4': ['█  █', '█  █', '████', '   █', '   █'],
  '5': ['████', '█   ', '███ ', '   █', '███ '],
  '6': [' ██ ', '█   ', '███ ', '█  █', ' ██ '],
  '7': ['████', '   █', '  █ ', ' █  ', ' █  '],
  '8': [' ██ ', '█  █', ' ██ ', '█  █', ' ██ '],
  '9': [' ██ ', '█  █', ' ███', '   █', ' ██ '],
  '-': ['    ', '    ', '████', '    ', '    '],
  '|': [' █ ', ' █ ', ' █ ', ' █ ', ' █ '],
  ' ': ['  ', '  ', '  ', '  ', '  '],
};

function renderTextLine(text: string): string[] {
  const chars = text.toUpperCase().split('');
  const rows: string[] = ['', '', '', '', ''];

  for (let i = 0; i < chars.length; i++) {
    const glyph = GLYPHS[chars[i]] ?? GLYPHS[' '];
    for (let r = 0; r < 5; r++) {
      if (i > 0) rows[r] += ' ';
      rows[r] += glyph[r];
    }
  }

  return rows;
}

const TITLE_LINES: Record<string, string[]> = {
  'ctrl-s-world': ['CTRL-S', 'THE WORLD'],
  'snake-classic': ['SNAKE', 'CLASSIC'],
  'vortex-pong': ['VORTEX', 'PONG'],
  'matrix-cloud': ['MATRIX', 'BIRD'],
  'matrix-invaders': ['MATRIX', 'INVADERS'],
  'metris': ['METRIS'],
  'matrix-frogger': ['MATRIX', 'FROGGER'],
  'neo-jump': ['NEO', 'JUMP'],
  'agent-chase': ['AGENT', 'CHASE'],
  'rhythm-hacker': ['RHYTHM', 'HACKER'],
  'cloud-jumper': ['CLOUD', 'JUMPER'],
  'code-breaker': ['CODE', 'BREAKER'],
};

export function generateGameTitle(gameId: string): string {
  const lines = TITLE_LINES[gameId];
  if (!lines) return gameId.toUpperCase();

  const renderedBlocks: string[][] = lines.map(line => renderTextLine(line));

  const maxWidth = Math.max(
    ...renderedBlocks.flatMap(block => block.map(row => row.length))
  );

  const allRows: string[] = [];
  for (let b = 0; b < renderedBlocks.length; b++) {
    if (b > 0) allRows.push('');
    for (const row of renderedBlocks[b]) {
      const padding = Math.floor((maxWidth - row.length) / 2);
      allRows.push(' '.repeat(padding) + row);
    }
  }

  return allRows.join('\n');
}

export const GAME_TITLES: Record<string, string> = Object.fromEntries(
  Object.keys(TITLE_LINES).map(id => [id, generateGameTitle(id)])
);
