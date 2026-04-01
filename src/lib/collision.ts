/**
 * Shared collision detection utilities for React canvas games.
 * Phaser games use Phaser's built-in physics system instead.
 */

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Circle {
  x: number;
  y: number;
  radius: number;
}

export interface Point {
  x: number;
  y: number;
}

/** AABB rectangle overlap */
export function rectsOverlap(a: Rect, b: Rect): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

/** Point inside rectangle */
export function pointInRect(p: Point, r: Rect): boolean {
  return p.x >= r.x && p.x <= r.x + r.width && p.y >= r.y && p.y <= r.y + r.height;
}

/** Circle-rectangle overlap */
export function circleRectOverlap(c: Circle, r: Rect): boolean {
  const closestX = Math.max(r.x, Math.min(c.x, r.x + r.width));
  const closestY = Math.max(r.y, Math.min(c.y, r.y + r.height));
  const dx = c.x - closestX;
  const dy = c.y - closestY;
  return dx * dx + dy * dy < c.radius * c.radius;
}

/** Circle-circle overlap */
export function circlesOverlap(a: Circle, b: Circle): boolean {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const combinedRadius = a.radius + b.radius;
  return dx * dx + dy * dy < combinedRadius * combinedRadius;
}

/** Distance between two points */
export function distance(a: Point, b: Point): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/** Grid-based collision check (e.g., Snake, Metris) */
export function gridPositionMatch(a: Point, b: Point): boolean {
  return a.x === b.x && a.y === b.y;
}
