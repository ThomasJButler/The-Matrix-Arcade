# CTRL-S | The World — Phaser Rebuild Plan

## Status: RESEARCH NEEDED

## Design Vision
Citizen Sleeper-inspired narrative engine rebuilt in Phaser. Character art panels, environmental backgrounds, smooth text rendering with CONTINUE buttons, choice UI with particle effects, inventory system, puzzle modals, chapter navigation with transitions.

## Reference Images
- `../inspirationimagesandsprites/ctrlscitizensleeperimageinspiration/` (8 Citizen Sleeper UI screenshots)

## Current State
- **File**: `src/components/games/CtrlSWorld.tsx` (1,826 lines)
- **Architecture**: React DOM (modals, text, ASCII art)
- **Chapters**: 5 + prologue
- **Puzzles**: Inline puzzles triggered at story paragraph indices
- **Inventory**: Item rewards from puzzle completion
- **Achievements**: 3+ (first puzzle, no hints, game complete)

## Known Bugs
- Cannot save — `gameData.stats` is undefined (crash on save manager open)
- ASCII art needs to be bigger
- Story screen too glitchy, needs better UX
- User not in control — too rushed, hard to get into flow state

## Research Tasks
- [ ] Study all 8 Citizen Sleeper screenshots for UI patterns
- [ ] Map current story content (chapters, nodes, choices, puzzles)
- [ ] Design Phaser scene graph (how narrative flows between scenes)
- [ ] Plan text rendering system (typewriter effect, choices, continue)
- [ ] Plan character art panel system (left/right character portraits)
- [ ] Plan environmental background system (parallax, particle effects)
- [ ] Plan inventory UI in Phaser (nine-slice panels)
- [ ] Plan puzzle modal system (reuse existing puzzle data)
- [ ] Plan chapter hub scene (visual chapter select, not text list)
- [ ] Design achievement list (expand to 8+)
- [ ] Write test plan

## Phaser Scene Architecture (draft)
```
scenes/
├── BootScene.ts         # Load fonts, character art, backgrounds
├── MenuScene.ts         # Matrix-themed title with ASCII art
├── ChapterHubScene.ts   # Visual chapter select (like Citizen Sleeper hub)
├── NarrativeScene.ts    # Core story engine (text, choices, art panels)
├── PuzzleScene.ts       # Inline puzzle overlay (launched parallel)
├── InventoryScene.ts    # Item/inventory overlay
└── GameOverScene.ts     # Completion screen
```

## Notes
This is the most ambitious rebuild. The current React DOM approach works but feels disconnected from the arcade aesthetic. Phaser gives us: animated backgrounds, particle effects on choices, smooth transitions between chapters, character sprite animations, and a visual novel feel that matches Citizen Sleeper's polish. Must preserve all existing story content and puzzle logic.
