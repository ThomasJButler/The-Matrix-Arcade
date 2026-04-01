╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
 Gameplay E2E Test Suite — Real Player Simulation & Glitch Detection
                                                                                                                                                                                     
 Context                                                                                                                                                                           
                                                                                                                                                                                                  
 The existing E2E tests are purely visual — they navigate to each game, perform minimal inputs, and take screenshots. They don't simulate real gameplay or test edge cases. The user has          
 identified specific glitches (Matrix Cloud idle scoring, Agent Chase wall glitch) and wants tests that play the games like a real human would, trying multiple play styles to expose bugs.       
                                                                                                                                                                                                  
 File Structure                                                                                                                                                                                   
                                                                                                                                                                                               
 e2e/gameplay/                          # NEW directory for gameplay tests
   matrix-cloud.gameplay.spec.ts        # Idle scoring exploit, skilled play, button mashing
   agent-chase.gameplay.spec.ts         # Wall glitch, maze navigation, ghost evasion
   matrix-frogger.gameplay.spec.ts      # Bottom camping exploit, lane crossing
   cloud-jumper.gameplay.spec.ts        # Idle death, skilled platforming
   neo-jump.gameplay.spec.ts            # Auto-bounce behavior, jetpack usage
   rhythm-hacker.gameplay.spec.ts       # Idle health drain, note hitting
   snake.gameplay.spec.ts               # Idle wall collision, self-collision
   metris.gameplay.spec.ts              # Lock delay abuse, line clearing
   vortex-pong.gameplay.spec.ts         # AI exploitation, paddle defense
   invaders.gameplay.spec.ts            # Bottom camping, wave survival
   cloud-jumper.gameplay.spec.ts        # Instant idle death

 No new fixture helpers needed — existing navigateToGame, startGame, takeScreenshot, pauseGame cover all needs. Phaser games need 1500ms post-start wait for initialization.

 Game State Verification Strategy

 React games (Snake, Pong, Cloud, Metris, Invaders): DOM has readable text elements.
 - Matrix Cloud: text("Level:"), text("Combo:"), text("High Score:"), game over overlay has text("Final Score:") and text("SYSTEM FAILURE")
 - Vortex Pong: text("Score:"), game over modal
 - Snake: text("SCORE"), text("GAME OVER")
 - Metris: DOM panels with score/level
 - Invaders: Canvas-rendered HUD (screenshot only)

 Phaser games (Frogger, Neo Jump, Agent Chase, Rhythm Hacker, Cloud Jumper): Canvas only — use screenshots + time-based assertions (e.g., "game should still be running after 30s" = no game-over
  overlay appeared).

 Test Scenarios Per Game

 1. Matrix Cloud — matrix-cloud.gameplay.spec.ts (PRIORITY: HIGH)

 Known bug: Idle scoring exploit

 ┌───────────────────────────────────────────────┬────────────┬──────────────────────────────────────────────────────────────────────────────────┬─────────┐
 │                     Test                      │ Play Style │                                 What It Verifies                                 │ Timeout │
 ├───────────────────────────────────────────────┼────────────┼──────────────────────────────────────────────────────────────────────────────────┼─────────┤
 │ idle player racks up score without input      │ AFK        │ Start game, wait 8s, pause, check "Current Score" text > 0. Screenshot evidence. │ 15s     │
 ├───────────────────────────────────────────────┼────────────┼──────────────────────────────────────────────────────────────────────────────────┼─────────┤
 │ skilled player navigates pipe gaps            │ Skilled    │ Timed Space presses every 400-600ms for 10s, screenshot showing alive with score │ 20s     │
 ├───────────────────────────────────────────────┼────────────┼──────────────────────────────────────────────────────────────────────────────────┼─────────┤
 │ rapid button mashing                          │ Mashing    │ Spam Space every 50ms for 5s, verify game didn't crash                           │ 10s     │
 ├───────────────────────────────────────────────┼────────────┼──────────────────────────────────────────────────────────────────────────────────┼─────────┤
 │ ground collision eventually kills idle player │ AFK        │ Start, wait 15s, check for "SYSTEM FAILURE" (game over)                          │ 25s     │
 ├───────────────────────────────────────────────┼────────────┼──────────────────────────────────────────────────────────────────────────────────┼─────────┤
 │ pause and resume preserves score              │ Skill      │ Play 3s, pause, read score, resume, play 2s, pause, verify score >= previous     │ 15s     │
 └───────────────────────────────────────────────┴────────────┴──────────────────────────────────────────────────────────────────────────────────┴─────────┘

 Key assertions: Read span:has-text("Level:") and pause screen text("Current Score:") from DOM.

 2. Agent Chase — agent-chase.gameplay.spec.ts (PRIORITY: HIGH)

 Known bug: Wall movement glitch

 ┌───────────────────────────────────────────┬───────────┬────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┬─────────┐
 │                   Test                    │   Play    │                                                    What It Verifies                                                    │ Timeout │
 │                                           │   Style   │                                                                                                                        │         │
 ├───────────────────────────────────────────┼───────────┼────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┼─────────┤
 │ wall glitch — pressing into wall          │ Exploit   │ Start, wait 1.5s, press ArrowUp 20x rapidly (into top wall). Take 3 sequential screenshots to capture visual           │ 15s     │
 │ continuously                              │           │ interpolation artifact.                                                                                                │         │
 ├───────────────────────────────────────────┼───────────┼────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┼─────────┤
 │ skilled maze navigation — collect dots    │ Skilled   │ Move Right x5, Down x5, Left x5 with 250ms gaps. Screenshot showing dot collection trail.                              │ 15s     │
 ├───────────────────────────────────────────┼───────────┼────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┼─────────┤
 │ idle player gets caught by ghosts         │ AFK       │ Start, do nothing for 12s. Ghosts should eventually reach player. Screenshot.                                          │ 20s     │
 ├───────────────────────────────────────────┼───────────┼────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┼─────────┤
 │ reverse direction rapidly                 │ Mashing   │ Alternate Left/Right every 100ms for 5s. Verify no crash.                                                              │ 10s     │
 ├───────────────────────────────────────────┼───────────┼────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┼─────────┤
 │ power pellet then chase ghosts            │ Skilled   │ Move Left x10 toward corner pellet, then chase ghosts. Screenshots at each phase.                                      │ 20s     │
 └───────────────────────────────────────────┴───────────┴────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┴─────────┘

 Key assertions: Screenshot comparison only (Phaser canvas). Wait 1500ms after start for Phaser init.

 3. Matrix Frogger — matrix-frogger.gameplay.spec.ts (PRIORITY: HIGH)

 Known exploit: Bottom camping — never die

 ┌───────────────────────────────────────────────────┬───────────┬────────────────────────────────────────────────────────────────────────────────────────────────────────────────┬─────────┐
 │                       Test                        │   Play    │                                                What It Verifies                                                │ Timeout │
 │                                                   │   Style   │                                                                                                                │         │
 ├───────────────────────────────────────────────────┼───────────┼────────────────────────────────────────────────────────────────────────────────────────────────────────────────┼─────────┤
 │ bottom camping — idle player survives             │ Exploit   │ Start, do nothing for 20s. Take screenshots at 5s, 10s, 20s. Player should still be alive (no game-over        │ 30s     │
 │ indefinitely                                      │           │ overlay).                                                                                                      │         │
 ├───────────────────────────────────────────────────┼───────────┼────────────────────────────────────────────────────────────────────────────────────────────────────────────────┼─────────┤
 │ cross all lanes to reach top                      │ Skilled   │ Press Up with 400ms gaps, navigating through enemy lanes. Screenshot at top.                                   │ 20s     │
 ├───────────────────────────────────────────────────┼───────────┼────────────────────────────────────────────────────────────────────────────────────────────────────────────────┼─────────┤
 │ rush forward without looking                      │ Reckless  │ Spam ArrowUp every 200ms. Should die from enemy collision quickly. Screenshot.                                 │ 15s     │
 ├───────────────────────────────────────────────────┼───────────┼────────────────────────────────────────────────────────────────────────────────────────────────────────────────┼─────────┤
 │ dodge sideways in enemy lane                      │ Skilled   │ Move up to lane 2, then Left/Right to dodge enemies. Screenshots.                                              │ 20s     │
 └───────────────────────────────────────────────────┴───────────┴────────────────────────────────────────────────────────────────────────────────────────────────────────────────┴─────────┘

 Key assertions: Screenshot-only (Phaser). Verify no game-over state after idle period.

 4. Cloud Jumper — cloud-jumper.gameplay.spec.ts (PRIORITY: MEDIUM)

 Known behavior: Instant death on idle (auto-scroll)

 ┌───────────────────────────────────┬────────────┬──────────────────────────────────────────────────────────────────────┬─────────┐
 │               Test                │ Play Style │                           What It Verifies                           │ Timeout │
 ├───────────────────────────────────┼────────────┼──────────────────────────────────────────────────────────────────────┼─────────┤
 │ idle player dies within 5 seconds │ AFK        │ Start, do nothing. Should see game over within ~5s. Screenshot.      │ 15s     │
 ├───────────────────────────────────┼────────────┼──────────────────────────────────────────────────────────────────────┼─────────┤
 │ active jumping survives longer    │ Skilled    │ Press Space every 500ms for 10s. Should still be alive. Screenshots. │ 20s     │
 ├───────────────────────────────────┼────────────┼──────────────────────────────────────────────────────────────────────┼─────────┤
 │ rapid jump spam                   │ Mashing    │ Press Space every 100ms for 8s. Verify no crash.                     │ 15s     │
 └───────────────────────────────────┴────────────┴──────────────────────────────────────────────────────────────────────┴─────────┘

 5. Neo Jump — neo-jump.gameplay.spec.ts (PRIORITY: MEDIUM)

 Known behavior: Auto-bounce on platforms

 ┌───────────────────────────┬────────────┬───────────────────────────────────────────────────────────────────────────────────────────────────────────┬─────────┐
 │           Test            │ Play Style │                                             What It Verifies                                              │ Timeout │
 ├───────────────────────────┼────────────┼───────────────────────────────────────────────────────────────────────────────────────────────────────────┼─────────┤
 │ auto-bounce without input │ AFK        │ Start, do nothing. Player should auto-bounce on first platform and rise. Screenshot showing altitude > 0. │ 15s     │
 ├───────────────────────────┼────────────┼───────────────────────────────────────────────────────────────────────────────────────────────────────────┼─────────┤
 │ skilled lateral movement  │ Skilled    │ ArrowLeft/Right alternating while auto-bouncing. Screenshots showing horizontal traversal.                │ 15s     │
 ├───────────────────────────┼────────────┼───────────────────────────────────────────────────────────────────────────────────────────────────────────┼─────────┤
 │ jetpack usage             │ Skilled    │ Hold Space for 2s bursts. Screenshots showing jetpack flight.                                             │ 15s     │
 └───────────────────────────┴────────────┴───────────────────────────────────────────────────────────────────────────────────────────────────────────┴─────────┘

 6. Rhythm Hacker — rhythm-hacker.gameplay.spec.ts (PRIORITY: MEDIUM)

 Known behavior: Health drains fast after countdown

 ┌────────────────────────────────────┬────────────┬───────────────────────────────────────────────────────────────────────────────────┬─────────┐
 │                Test                │ Play Style │                                 What It Verifies                                  │ Timeout │
 ├────────────────────────────────────┼────────────┼───────────────────────────────────────────────────────────────────────────────────┼─────────┤
 │ idle player dies from health drain │ AFK        │ Start, wait through 10s countdown + 15s gameplay. Should reach game over.         │ 45s     │
 ├────────────────────────────────────┼────────────┼───────────────────────────────────────────────────────────────────────────────────┼─────────┤
 │ random key mashing on lanes        │ Mashing    │ After countdown, press D/F/J/K randomly every 150ms. Some should hit. Screenshot. │ 30s     │
 ├────────────────────────────────────┼────────────┼───────────────────────────────────────────────────────────────────────────────────┼─────────┤
 │ empty lane hits drain health       │ Exploit    │ Spam D key every 100ms (only lane 1). Verify game over from empty hit penalty.    │ 30s     │
 └────────────────────────────────────┴────────────┴───────────────────────────────────────────────────────────────────────────────────┴─────────┘

 Note: Set test.setTimeout(60000) per CLAUDE.md guidance.

 7. Snake — snake.gameplay.spec.ts (PRIORITY: MEDIUM)

 ┌─────────────────────────────────┬────────────┬───────────────────────────────────────────────────────────────────────────┬─────────┐
 │              Test               │ Play Style │                             What It Verifies                              │ Timeout │
 ├─────────────────────────────────┼────────────┼───────────────────────────────────────────────────────────────────────────┼─────────┤
 │ idle snake hits wall eventually │ AFK        │ Start, do nothing. Snake moves in initial direction until wall collision. │ 15s     │
 ├─────────────────────────────────┼────────────┼───────────────────────────────────────────────────────────────────────────┼─────────┤
 │ skilled play — collect food     │ Skilled    │ Navigate with arrow keys toward food. 10s of play.                        │ 15s     │
 ├─────────────────────────────────┼────────────┼───────────────────────────────────────────────────────────────────────────┼─────────┤
 │ rapid direction reversal        │ Exploit    │ Press Right then immediately Left. Check for self-collision.              │ 10s     │
 └─────────────────────────────────┴────────────┴───────────────────────────────────────────────────────────────────────────┴─────────┘

 8. Metris — metris.gameplay.spec.ts (PRIORITY: LOW)

 ┌──────────────────────────────────┬────────────┬─────────────────────────────────────────────────────────────────────────────────────────────────────┬─────────┐
 │               Test               │ Play Style │                                          What It Verifies                                           │ Timeout │
 ├──────────────────────────────────┼────────────┼─────────────────────────────────────────────────────────────────────────────────────────────────────┼─────────┤
 │ idle stack to game over          │ AFK        │ Start, let pieces fall for 30s. Should eventually stack to top.                                     │ 45s     │
 ├──────────────────────────────────┼────────────┼─────────────────────────────────────────────────────────────────────────────────────────────────────┼─────────┤
 │ lock delay abuse — shuffle piece │ Exploit    │ When piece lands, rapidly Left/Right to extend lock delay. Screenshot showing piece held at bottom. │ 20s     │
 ├──────────────────────────────────┼────────────┼─────────────────────────────────────────────────────────────────────────────────────────────────────┼─────────┤
 │ hard drop spam                   │ Mashing    │ Press Space every 500ms. Fast game over from rapid stacking.                                        │ 20s     │
 ├──────────────────────────────────┼────────────┼─────────────────────────────────────────────────────────────────────────────────────────────────────┼─────────┤
 │ line clearing gameplay           │ Skilled    │ Strategically place pieces to fill rows.                                                            │ 25s     │
 └──────────────────────────────────┴────────────┴─────────────────────────────────────────────────────────────────────────────────────────────────────┴─────────┘

 9. Vortex Pong — vortex-pong.gameplay.spec.ts (PRIORITY: LOW)

 ┌────────────────────────────────┬────────────┬──────────────────────────────────────────────────────────┬─────────┐
 │              Test              │ Play Style │                     What It Verifies                     │ Timeout │
 ├────────────────────────────────┼────────────┼──────────────────────────────────────────────────────────┼─────────┤
 │ idle player — AI scores freely │ AFK        │ Start, do nothing. AI should score. Check score display. │ 15s     │
 ├────────────────────────────────┼────────────┼──────────────────────────────────────────────────────────┼─────────┤
 │ track ball with paddle         │ Skilled    │ Move Up/Down following ball Y position. 15s of play.     │ 20s     │
 └────────────────────────────────┴────────────┴──────────────────────────────────────────────────────────┴─────────┘

 10. Matrix Invaders — invaders.gameplay.spec.ts (PRIORITY: LOW)

 ┌────────────────────────────┬────────────┬───────────────────────────────────────────────────────────────────────────────┬─────────┐
 │            Test            │ Play Style │                               What It Verifies                                │ Timeout │
 ├────────────────────────────┼────────────┼───────────────────────────────────────────────────────────────────────────────┼─────────┤
 │ bottom camping — tank hits │ Exploit    │ Start, don't move, don't shoot. See how long player survives with 100 health. │ 30s     │
 ├────────────────────────────┼────────────┼───────────────────────────────────────────────────────────────────────────────┼─────────┤
 │ shoot and dodge            │ Skilled    │ Move Left/Right and Space to shoot. 10s of play.                              │ 20s     │
 └────────────────────────────┴────────────┴───────────────────────────────────────────────────────────────────────────────┴─────────┘

 Implementation Notes

 1. Phaser init wait: All Phaser games (Frogger, Neo Jump, Agent Chase, Rhythm Hacker, Cloud Jumper) need await page.waitForTimeout(1500) after startGame() for scene init.
 2. Screenshot naming: Use gameplay- prefix to distinguish from visual tests, e.g., gameplay-cloud-idle-scoring.
 3. DOM state reading for React games: Use page.locator('text=...').textContent() to read scores from HUD overlays and game-over screens.
 4. Game-over detection: For React games, check for game-over text (e.g., page.locator('text=SYSTEM FAILURE')). For Phaser games, use page.locator('text=GAME OVER') which BaseScene may render,
 or rely on screenshot comparison.
 5. No flaky timing: Use generous waits. Don't assert on exact scores — use range checks (score > 0, score increased).

 Critical Files to Modify/Create

 - e2e/gameplay/ — new directory (11 spec files)
 - e2e/fixtures/arcade.fixture.ts — no changes needed
 - playwright.config.ts — no changes needed (already covers ./e2e directory)

 Verification

 1. Run npx playwright test e2e/gameplay/ to execute all gameplay tests
 2. Check e2e/screenshots/ for gameplay-* screenshots showing evidence of glitches
 3. Verify Matrix Cloud idle test shows score > 0 without any input
 4. Verify Agent Chase wall test screenshots show visual interpolation artifact
 5. Verify Matrix Frogger idle test shows player alive after 20s of no input
 6. Verify Cloud Jumper idle test shows game over within ~5s

---

## DOM State Access Per Game

How each game exposes readable state for assertions:

| Game | Type | During Play | At Pause | At Game Over |
|------|------|-------------|----------|--------------|
| Matrix Cloud | React | DOM: `Level:`, `Combo:`, `High Score:` | DOM: `Current Score:`, `Level:`, `Lives:` | DOM: `Final Score:`, `SYSTEM FAILURE` |
| Snake | React | DOM: `SCORE` header | DOM: `PAUSED` | DOM: `GAME OVER`, `Score:` |
| Vortex Pong | React | DOM: ScoreBoard `PLAYER`/`AI` spans | N/A | DOM: `Score: X - Y` |
| Metris | React | DOM: `SCORE:`, `LEVEL:`, `LINES:` panels | DOM: `PAUSED` | DOM: `Score:` in overlay |
| Invaders | React | Canvas-only HUD | Canvas pause | DOM: `GAME OVER`, `Score:`, `Wave:` |
| Agent Chase | Phaser | Canvas only | Canvas pause overlay | Canvas: Phaser GameOverScene |
| Matrix Frogger | Phaser | Canvas only | Canvas pause overlay | Canvas: Phaser GameOverScene |
| Neo Jump | Phaser | Canvas only | Canvas pause overlay | Canvas: Phaser GameOverScene |
| Cloud Jumper | Phaser | Canvas only | Canvas pause overlay | Canvas: Phaser GameOverScene |
| Rhythm Hacker | Phaser | Canvas only | Canvas pause overlay | Canvas: Phaser GameOverScene |

## Phaser Game-Over Detection Strategy

Phaser games render everything on `<canvas>` — Playwright's `:text()` selector does NOT work with canvas text. The Phaser `GameOverScene` renders "GAME OVER" via `createMatrixText` but it's canvas-drawn, not DOM.

**Pragmatic approach:**
1. **Timeout-based assertions** — if game should end in N seconds, wait N+buffer and screenshot
2. **Screenshot evidence** — periodic captures to document state progression
3. **Absence-based check** — for "still alive" tests, verify `:text("GAME OVER")` is not visible in DOM
4. **React wrapper** — `PhaserGame.tsx` handles `gameOver` events but doesn't render DOM overlays for Phaser game-over states

## Helper Patterns (no new files needed)

```typescript
// Read score from React game pause overlay
await pauseGame(arcadePage);
const scoreText = await arcadePage.locator('text=Current Score:').textContent();
const score = parseInt(scoreText?.match(/\d+/)?.[0] ?? '0');

// Rapid key press (mashing/exploit tests)
for (let i = 0; i < count; i++) {
  await page.keyboard.press(key);
  await page.waitForTimeout(intervalMs);
}

// Hold key down (wall glitch tests)
await page.keyboard.down('ArrowRight');
await page.waitForTimeout(durationMs);
await page.keyboard.up('ArrowRight');

// Phaser "still alive" check
const gameOver = await page.locator(':text("GAME OVER")').isVisible().catch(() => false);
expect(gameOver).toBe(false);
```

---

## Delivery Checklist

### Infrastructure
- [ ] `e2e/gameplay/` directory created
- [ ] All 10 spec files created and importable
- [ ] `npx playwright test e2e/gameplay/` runs without import errors

### Matrix Cloud (HIGH — idle scoring exploit)
- [ ] idle player racks up score without input
- [ ] skilled player navigates pipe gaps
- [ ] rapid button mashing doesn't crash
- [ ] ground collision eventually kills idle player
- [ ] pause and resume preserves score

### Agent Chase (HIGH — wall movement glitch)
- [ ] wall glitch — pressing into wall continuously
- [ ] skilled maze navigation — collect dots
- [ ] idle player gets caught by ghosts
- [ ] reverse direction rapidly doesn't crash
- [ ] power pellet then chase ghosts

### Matrix Frogger (HIGH — bottom camping exploit)
- [ ] bottom camping — idle player survives indefinitely
- [ ] cross all lanes to reach top
- [ ] rush forward without looking
- [ ] dodge sideways in enemy lane

### Cloud Jumper (MEDIUM — instant idle death)
- [ ] idle player dies within 5 seconds
- [ ] active jumping survives longer
- [ ] rapid jump spam doesn't crash

### Neo Jump (MEDIUM — auto-bounce)
- [ ] auto-bounce without input
- [ ] skilled lateral movement
- [ ] jetpack usage

### Rhythm Hacker (MEDIUM — health drain)
- [ ] idle player dies from health drain
- [ ] random key mashing on lanes
- [ ] empty lane hits drain health

### Snake (MEDIUM)
- [ ] idle snake hits wall eventually
- [ ] skilled play — collect food
- [ ] rapid direction reversal

### Metris (LOW)
- [ ] idle stack to game over
- [ ] lock delay abuse — shuffle piece
- [ ] hard drop spam
- [ ] line clearing gameplay

### Vortex Pong (LOW)
- [ ] idle player — AI scores freely
- [ ] track ball with paddle

### Matrix Invaders (LOW)
- [ ] bottom camping — tank hits
- [ ] shoot and dodge

### Summary
| Metric | Count |
|--------|-------|
| Total tests | 38 |
| Passing | 0 |
| Failing | 0 |
| Not started | 38 |