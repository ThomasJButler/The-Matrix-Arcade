# Metris Block Drop Timing Issue - Debug Guide

## Problem Summary
Blocks are falling **much slower** than configured. Despite setting `INITIAL_DROP_SPEED = 50ms`, blocks take several seconds to drop one row.

## Expected Behavior
- **Level 1**: Blocks should drop every 50ms (0.05 seconds)
- **Level 2**: Blocks should drop every 40ms
- **Level 3**: Blocks should drop every 30ms
- **Level 4+**: Blocks should drop every 20ms minimum

## Actual Behavior
Console logs show the timer counting up properly (1000ms, 2000ms, 3000ms, 4000ms) but then **resetting** before reaching the drop interval, preventing blocks from ever dropping.

Example console output:
```
[DEBUG] Drop timer: {timeSinceLastDrop: 4641, dropInterval: 5000, ...}
[DEBUG] Drop timer: {timeSinceLastDrop: 633, ...}  // ⚠️ Reset!
[DEBUG] Drop timer: {timeSinceLastDrop: 1633, ...}
[DEBUG] Drop timer: {timeSinceLastDrop: 2633, ...}
[DEBUG] Drop timer: {timeSinceLastDrop: 3633, ...}
[DEBUG] Drop timer: {timeSinceLastDrop: 4633, ...}
[DEBUG] Drop timer: {timeSinceLastDrop: 599, ...}  // ⚠️ Reset again!
```

## Root Cause Investigation

### Key Code Locations in `src/components/games/Metris.tsx`

1. **Drop Speed Constants** (Lines 10-12):
```typescript
const INITIAL_DROP_SPEED = 50; // ms
const SPEED_DECREASE = 10; // ms per level
const MIN_DROP_SPEED = 20; // minimum drop speed
```

2. **Timer Check** (Lines 452-473):
```typescript
const timestamp = performance.now();
const timeSinceLastDrop = timestamp - lastDropTimeRef.current;

// Check if it's time to drop
if (timestamp - lastDropTimeRef.current < dropIntervalRef.current) {
  // Not time to drop yet - just update particles
  return updatedState;
}

// Time to drop the piece
lastDropTimeRef.current = timestamp; // Reset timer
```

3. **Game Loop Effect** (Lines 621-641):
```typescript
useEffect(() => {
  if (state.gameOver || state.paused || state.waiting) {
    return;
  }

  let animationId: number;
  const loop = () => {
    updateGame();
    animationId = requestAnimationFrame(loop);
  };
  animationId = requestAnimationFrame(loop);

  return () => {
    if (animationId) cancelAnimationFrame(animationId);
  };
}, [state.gameOver, state.paused, state.waiting]); // ⚠️ Dependencies
```

### Suspected Issues

#### Issue #1: React Effect Re-renders
The game loop effect may be **re-running too frequently**, causing the animation loop to be cancelled and restarted. This happens when:
- Any state change triggers re-render
- Dependencies change
- The component re-mounts

**Evidence**: Timer resets correlate with state updates (particle updates, score changes, etc.)

#### Issue #2: `updateGame` Closure Stale State
The `updateGame` function (lines 446-619) is a `useCallback` with many dependencies:
```typescript
}, [checkCollision, lockPiece, clearLines, createPiece, achievementManager,
    synthExplosion, synthPowerUp, synthDrum, isMuted]);
```

When any dependency changes, `updateGame` is recreated. However, the game loop effect **doesn't depend on `updateGame`**, so it keeps calling the old version. This could lead to:
- Stale state access
- Timer reads from old closure
- Unexpected behavior

#### Issue #3: Timer Reference Synchronization
`lastDropTimeRef` is a `useRef` (line 129) that should persist across renders, but:
- Multiple places set it: lines 507, 664, 674, 890, 1140
- Could be race conditions between these updates
- May be getting reset by keyboard handlers unexpectedly

## Debugging Steps

### Step 1: Add More Detailed Logging
Add logging to track when and why the timer resets:

```typescript
// At line 507 (when piece should drop)
console.log('[DROP] Piece dropping! Timer was:', timeSinceLastDrop);
lastDropTimeRef.current = timestamp;

// At line 664 (spacebar start)
console.log('[START] Game starting, resetting timer');
lastDropTimeRef.current = performance.now();

// At line 674 (unpause)
console.log('[UNPAUSE] Resetting timer');
lastDropTimeRef.current = performance.now();
```

### Step 2: Check Effect Re-runs
Add logging to the game loop effect:

```typescript
useEffect(() => {
  console.log('[EFFECT] Game loop starting/restarting', {
    gameOver: state.gameOver,
    paused: state.paused,
    waiting: state.waiting
  });

  // ... rest of effect

  return () => {
    console.log('[EFFECT] Game loop cleaning up');
    if (animationId) cancelAnimationFrame(animationId);
  };
}, [state.gameOver, state.paused, state.waiting]);
```

### Step 3: Isolate updateGame
Try making `updateGame` NOT a `useCallback` - just a regular function inside the effect:

```typescript
useEffect(() => {
  if (state.gameOver || state.paused || state.waiting) return;

  let animationId: number;

  // Define updateGame directly here to avoid closure issues
  const updateGame = () => {
    setState(currentState => {
      // ... all the update logic
    });
  };

  const loop = () => {
    updateGame();
    animationId = requestAnimationFrame(loop);
  };

  animationId = requestAnimationFrame(loop);

  return () => {
    if (animationId) cancelAnimationFrame(animationId);
  };
}, [state.gameOver, state.paused, state.waiting]);
```

### Step 4: Check Performance.now() vs Date.now()
The timer uses `performance.now()` but bullet time uses `Date.now()` (line 533). These can drift:

```typescript
// Check if timestamps are compatible
console.log('performance.now():', performance.now());
console.log('Date.now():', Date.now());
```

## Potential Fixes

### Fix #1: Move Timer to State
Instead of using `useRef`, move the drop timer into React state:

```typescript
const [lastDropTime, setLastDropTime] = useState(0);

// In updateGame
const timestamp = performance.now();
if (timestamp - lastDropTime < dropIntervalRef.current) {
  return updatedState;
}

setLastDropTime(timestamp); // This triggers re-render but that's OK
```

### Fix #2: Use setInterval Instead of requestAnimationFrame
Replace the game loop with `setInterval`:

```typescript
useEffect(() => {
  if (state.gameOver || state.paused || state.waiting) return;

  const intervalId = setInterval(() => {
    updateGame();
  }, 16); // 60fps

  return () => clearInterval(intervalId);
}, [state.gameOver, state.paused, state.waiting]);
```

### Fix #3: Separate Timers
Use one timer for rendering (60fps) and another for game logic (drop speed):

```typescript
useEffect(() => {
  if (state.gameOver || state.paused || state.waiting) return;

  // Rendering loop - 60fps
  let renderFrameId: number;
  const renderLoop = () => {
    // Just render particles, animations, etc.
    renderFrameId = requestAnimationFrame(renderLoop);
  };
  renderFrameId = requestAnimationFrame(renderLoop);

  // Game logic loop - based on drop speed
  const gameIntervalId = setInterval(() => {
    // Drop piece logic
  }, dropSpeed);

  return () => {
    cancelAnimationFrame(renderFrameId);
    clearInterval(gameIntervalId);
  };
}, [state.gameOver, state.paused, state.waiting]);
```

## Quick Test

To verify the timer logic works, temporarily set a breakpoint or alert when a drop should occur:

```typescript
// Line 507
if (timeSinceLastDrop >= dropIntervalRef.current) {
  alert(`DROP! Timer: ${timeSinceLastDrop}ms`);
  lastDropTimeRef.current = timestamp;
  // ... drop logic
}
```

If the alert never fires, the condition is never true.
If it fires but blocks don't drop, the drop logic has issues.

## Additional Notes

- Debug logging is currently active (lines 459-470)
- Console should show timer values every second
- Look for patterns in when resets occur
- Check browser performance tab for frame rates

## Files Modified
- `src/components/games/Metris.tsx` - Main game component
- Drop speed constants: Lines 10-12
- Timer logic: Lines 452-508
- Game loop: Lines 621-641
- updateGame callback: Lines 446-619

## Next Steps
1. Run the game with console open (F12)
2. Press spacebar to start
3. Watch the `[DEBUG] Drop timer:` logs
4. Note when/why timer resets unexpectedly
5. Try the fixes above one by one
6. Remove debug logging when fixed (lines 459-470, 507)

Good luck! 🎮
