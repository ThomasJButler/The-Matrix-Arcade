/**
 * SVG data URI previews for Phaser games that lack Cloudinary screenshots.
 * Each game gets a unique colour accent and icon to distinguish it in the grid.
 */

const makePhaserPreview = (title: string, icon: string, accent: string = '#00ff00') =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300">` +
    `<rect width="400" height="300" fill="#0a0a0a"/>` +
    `<rect x="1" y="1" width="398" height="298" rx="4" fill="none" stroke="${accent}" stroke-width="1" opacity="0.4"/>` +
    `<text x="200" y="120" text-anchor="middle" font-family="monospace" font-size="48" fill="${accent}" opacity="0.8">${icon}</text>` +
    `<text x="200" y="180" text-anchor="middle" font-family="monospace" font-size="18" fill="${accent}" font-weight="bold">${title}</text>` +
    `<text x="200" y="210" text-anchor="middle" font-family="monospace" font-size="11" fill="${accent}" opacity="0.5">PHASER 3</text>` +
    `</svg>`
  )}`;

export const matrixFroggerPreview = makePhaserPreview('MATRIX FROGGER', '&#x1F438;');
export const neoJumpPreview = makePhaserPreview('NEO JUMP', '&#x2B06;', '#00ccff');
export const agentChasePreview = makePhaserPreview('AGENT CHASE', '&#x25CF;', '#ffcc00');
export const rhythmHackerPreview = makePhaserPreview('RHYTHM HACKER', '&#x266A;', '#00ffcc');
export const cloudJumperPreview = makePhaserPreview('CLOUD JUMPER', '&#x2601;', '#00ff41');
export const codeBreakerPreview = makePhaserPreview('CODE BREAKER', '&#x1F512;', '#ff4400');
