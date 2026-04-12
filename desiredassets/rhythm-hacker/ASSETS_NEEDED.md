# Rhythm Hacker — Asset Requirements

## Source Mapping (from TheMatrixArcadeAssetsToADDANDSORT-WILL-BE-FUN-TASK/)

| Asset Category | Source | Location | Details |
|---|---|---|---|
| Guitar Hero UI Reference | Inspiration | INSPO/guitarhero/ | Lane layouts, note highway, scoring |
| Music Tracks (CRITICAL) | Matrix Arcade Tracks | DUMP/MatrixArcadeTracksSoundEffects/LongTracks/ | 10 tracks: Cyberpsychotic, Cyberpunkin', In The Moonlight, Enhancements, ostcrunch2 resonance, ostcrunch2 epic, brothers_and_sisters_FINAL.mp3 |
| Boss Theme | Matrix Arcade Tracks | DUMP/MatrixArcadeTracksSoundEffects/SoundEffects/ | random bits (boss theme).mp3 |
| Stage Theme | Matrix Arcade Tracks | DUMP/MatrixArcadeTracksSoundEffects/SoundEffects/ | massive chrome (stage theme).mp3 |
| Sound Effects Kit | Matrix Arcade Tracks | DUMP/MatrixArcadeTracksSoundEffects/SoundEffects/ | WeirdoOnTheBus - The Matrix Trilogy (Sound Effects Kit).zip |
| Health Bar Sprites | Hologram Interface | DUMP/1. Free Hologram Interface Wenrexa/Progress Bar/ | Health bar + frame |
| Score/Track Panels | Hologram Interface | DUMP/1. Free Hologram Interface Wenrexa/Card X*/ | Card UI elements |

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
- [~] Score display panel — SOURCE: DUMP/1. Free Hologram Interface Wenrexa/Card X*/
- [ ] Combo counter (large, animated)
- [~] Health bar (fill + frame + danger state) — SOURCE: DUMP/1. Free Hologram Interface Wenrexa/Progress Bar/
- [ ] Multiplier indicator
- [~] Track info panel (song name, difficulty) — SOURCE: DUMP/1. Free Hologram Interface Wenrexa/Card X*/
- [ ] Countdown overlay (3, 2, 1, HACK!)

### Audio (CRITICAL — this is a rhythm game)
- [~] **Music tracks** — minimum 3, ideally 5+:
  - [~] Easy track (~100 BPM, electronic/ambient) — SOURCE: DUMP/MatrixArcadeTracksSoundEffects/LongTracks/In The Moonlight.wav (43MB)
  - [~] Normal track (~120 BPM, synth/beat) — SOURCE: DUMP/MatrixArcadeTracksSoundEffects/LongTracks/Cyberpunkin'.wav (38MB)
  - [~] Hard track (~140 BPM, intense electronic) — SOURCE: DUMP/MatrixArcadeTracksSoundEffects/LongTracks/Cyberpsychotic.wav (28MB) or ostcrunch2 resonance.wav (36MB)
  - [~] Insane track (~160 BPM, aggressive) — SOURCE: DUMP/MatrixArcadeTracksSoundEffects/LongTracks/Enhancements.wav (47MB)
  - [~] Boss track (variable BPM, dramatic) — SOURCE: DUMP/MatrixArcadeTracksSoundEffects/SoundEffects/random bits (boss theme).mp3
- [~] Note hit sound (satisfying, short, per-lane pitch variation) — SOURCE: DUMP/MatrixArcadeTracksSoundEffects/SoundEffects/WeirdoOnTheBus - The Matrix Trilogy (Sound Effects Kit).zip
- [~] Note miss sound (dull thud / buzz) — SOURCE: DUMP/MatrixArcadeTracksSoundEffects/SoundEffects/WeirdoOnTheBus - The Matrix Trilogy (Sound Effects Kit).zip
- [~] Combo milestone sound (at 10, 25, 50, 100) — SOURCE: DUMP/MatrixArcadeTracksSoundEffects/SoundEffects/
- [~] Health critical warning — SOURCE: DUMP/MatrixArcadeTracksSoundEffects/SoundEffects/
- [~] Track complete fanfare — SOURCE: DUMP/MatrixArcadeTracksSoundEffects/SoundEffects/
- [~] Track fail sound — SOURCE: DUMP/MatrixArcadeTracksSoundEffects/SoundEffects/
- [~] Countdown beeps — SOURCE: DUMP/MatrixArcadeTracksSoundEffects/SoundEffects/WeirdoOnTheBus - The Matrix Trilogy (Sound Effects Kit).zip

### Note Charts (data files, not art)
- [ ] Note chart per track (BPM, note timing in ms, lane assignments)
- [ ] Format: JSON or custom, synced to audio files

## Notes

Music tracks are the single most important asset for this game. The entire experience depends on notes being synced to actual music. Even simple electronic beats would transform the gameplay from procedural noise to genuine rhythm gaming. Consider royalty-free electronic music or commissioned tracks.
