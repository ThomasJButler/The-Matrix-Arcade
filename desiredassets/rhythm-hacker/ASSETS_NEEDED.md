# Rhythm Hacker — Asset Requirements

## Currently Available (in rebuildingoldgames/inspirationimagesandsprites/guitarhero/)

- [x] 3 Guitar Hero UI reference images (lane layouts, note highway, scoring)

## Currently Procedural (in BootScene — 100% generated)

All 28 textures procedurally generated: 4 note sprites (coloured rounded rects), 4 hold bodies, 4 hold tails, double indicator, lane backgrounds, hit line, 4 key sprites (normal + pressed), 4 timing effect circles.

## Still Needed

### Notes (falling down lanes)
- [ ] Note sprite per lane (4 lanes × normal variant) — 70×30 or 64×32, coloured
- [ ] Hold note body — stretchy middle segment, tileable vertically
- [ ] Hold note tail — end cap, matches note style
- [ ] Double note indicator — border/glow around paired notes
- [ ] Note hit effect — burst/explosion per lane colour, 32×32, 4 frames

### Lanes
- [ ] Lane background — 80×700, subtle dark tint, per-lane colour accent
- [ ] Hit line / judgement line — full width, glowing, prominent
- [ ] Key receptor (bottom of lane) — 70×40, normal + pressed states per lane

### Timing Feedback
- [ ] "PERFECT" text/icon — gold, 64×24
- [ ] "GREAT" text/icon — green, 64×24
- [ ] "GOOD" text/icon — cyan, 64×24
- [ ] "MISS" text/icon — red, 64×24
- [ ] Combo fire effect (streak indicator at high combos)

### Background
- [ ] Gameplay background — dark, pulsing to beat, Matrix code columns
- [ ] Background beat visualiser (audio waveform or bar graph, subtle)

### UI
- [ ] Score display panel
- [ ] Combo counter (large, animated)
- [ ] Health bar (fill + frame + danger state)
- [ ] Multiplier indicator
- [ ] Track info panel (song name, difficulty)
- [ ] Countdown overlay (3, 2, 1, HACK!)

### Audio (CRITICAL — this is a rhythm game)
- [ ] **Music tracks** — minimum 3, ideally 5+:
  - [ ] Easy track (~100 BPM, electronic/ambient)
  - [ ] Normal track (~120 BPM, synth/beat)
  - [ ] Hard track (~140 BPM, intense electronic)
  - [ ] Insane track (~160 BPM, aggressive)
  - [ ] Boss track (variable BPM, dramatic)
- [ ] Note hit sound (satisfying, short, per-lane pitch variation)
- [ ] Note miss sound (dull thud / buzz)
- [ ] Combo milestone sound (at 10, 25, 50, 100)
- [ ] Health critical warning
- [ ] Track complete fanfare
- [ ] Track fail sound
- [ ] Countdown beeps

### Note Charts (data files, not art)
- [ ] Note chart per track (BPM, note timing in ms, lane assignments)
- [ ] Format: JSON or custom, synced to audio files

## Notes

Music tracks are the single most important asset for this game. The entire experience depends on notes being synced to actual music. Even simple electronic beats would transform the gameplay from procedural noise to genuine rhythm gaming. Consider royalty-free electronic music or commissioned tracks.
