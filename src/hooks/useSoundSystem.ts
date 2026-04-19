/**
 * @author Tom Butler
 * @date 2025-10-25
 * @description Web Audio API sound system with procedural synthesis, ADSR envelopes,
 *              and file-based SFX via AudioBuffer. Pre-loaded Matrix Trilogy audio
 *              takes priority; procedural synthesis is the fallback.
 */

import { useCallback, useRef, useState, useEffect, useMemo } from 'react';

export interface SoundConfig {
  music: boolean;
  sfx: boolean;
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
}

export interface SoundEffect {
  type: string;
  frequency: { start: number; end: number };
  oscillatorType: OscillatorType;
  duration: number;
  attack: number;
  decay: number;
  sustain: number;
  release: number;
  filterType?: BiquadFilterType;
  filterFreq?: number;
  delay?: number;
  reverb?: boolean;
  // R83.B1(f): per-call envelope scalar (0–1). Multiplies the attack peak and
  // sustain level so a caller can drop a specific SFX without touching the
  // global sfxVolume slider. Used by Matrix Bird to soften all its SFX by 25%
  // after Tom flagged the mix as too hot on 2026-04-19.
  volumeScale?: number;
}

const DEFAULT_CONFIG: SoundConfig = {
  music: true,
  sfx: true,
  masterVolume: 0.7,
  musicVolume: 0.4,
  sfxVolume: 0.25
};

const SOUND_LIBRARY: Record<string, SoundEffect> = {
  jump: {
    type: 'jump',
    frequency: { start: 440, end: 220 },
    oscillatorType: 'sine',
    duration: 0.15,
    attack: 0.015,
    decay: 0.07,
    sustain: 0.2,
    release: 0.08,
    filterType: 'lowpass',
    filterFreq: 800
  },
  // R83.B1(d): Matrix Bird flap — procedural-only (not in AUDIO_FILE_MAP) so
  // the "horrendous" sfx_landing.mp3 that Tom flagged stays out of the Bird
  // flap path. Short 80ms triangle pluck sliding 800→480Hz reads as a clean,
  // birdy wingbeat rather than a thud. Neo Jump / Cloud Jumper still call the
  // original `jump` MP3 path and are unaffected.
  //
  // R84.B6 (2026-04-19): Tom's post-R83.B1 playtest still flagged the jump
  // SFX as "the worst". Sweep depth narrowed 20% (400→320Hz → end moved
  // 400→480Hz) so the pluck lands gentler; the steep full-octave drop of the
  // original sweep was reading as "whooshy" rather than birdy. Scene-level
  // volume drop of another 20% is applied via
  // MatrixCloudGameScene.playSound (0.75 → 0.60 for this key only) rather
  // than a library-level volumeScale so other games that might one day
  // borrow `birdFlap` are not silently quieter.
  birdFlap: {
    type: 'birdFlap',
    frequency: { start: 800, end: 480 },
    oscillatorType: 'triangle',
    duration: 0.08,
    attack: 0.005,
    decay: 0.02,
    sustain: 0.25,
    release: 0.05,
  },
  hit: {
    type: 'hit',
    frequency: { start: 180, end: 60 },
    oscillatorType: 'triangle',
    duration: 0.25,
    attack: 0.005,
    decay: 0.08,
    sustain: 0.05,
    release: 0.12,
    filterType: 'lowpass',
    filterFreq: 400
  },
  score: {
    type: 'score',
    frequency: { start: 523, end: 650 },
    oscillatorType: 'triangle',
    duration: 0.18,
    attack: 0.015,
    decay: 0.06,
    sustain: 0.3,
    release: 0.08,
    filterType: 'bandpass',
    filterFreq: 1500
  },
  powerup: {
    type: 'powerup',
    frequency: { start: 659, end: 900 },
    oscillatorType: 'triangle',
    duration: 0.3,
    attack: 0.04,
    decay: 0.08,
    sustain: 0.4,
    release: 0.15,
    filterType: 'highpass',
    filterFreq: 500,
    reverb: true
  },
  levelUp: {
    type: 'levelUp',
    frequency: { start: 784, end: 1200 },
    oscillatorType: 'triangle',
    duration: 0.4,
    attack: 0.08,
    decay: 0.12,
    sustain: 0.5,
    release: 0.2,
    filterType: 'bandpass',
    filterFreq: 2000,
    reverb: true
  },
  combo: {
    type: 'combo',
    frequency: { start: 392, end: 523 },
    oscillatorType: 'sine',
    duration: 0.12,
    attack: 0.01,
    decay: 0.04,
    sustain: 0.3,
    release: 0.07,
    filterType: 'bandpass',
    filterFreq: 1200
  },
  gameOver: {
    type: 'gameOver',
    frequency: { start: 220, end: 110 },
    oscillatorType: 'triangle',
    duration: 0.7,
    attack: 0.08,
    decay: 0.2,
    sustain: 0.25,
    release: 0.4,
    filterType: 'lowpass',
    filterFreq: 300,
    reverb: true
  },
  menu: {
    type: 'menu',
    frequency: { start: 440, end: 523 },
    oscillatorType: 'sine',
    duration: 0.08,
    attack: 0.02,
    decay: 0.02,
    sustain: 0.2,
    release: 0.04,
    filterType: 'bandpass',
    filterFreq: 1000
  },

  // Game-specific sounds
  snakeEat: {
    type: 'snakeEat',
    frequency: { start: 740, end: 880 },
    oscillatorType: 'triangle',
    duration: 0.12,
    attack: 0.01,
    decay: 0.03,
    sustain: 0.25,
    release: 0.08,
    filterType: 'bandpass',
    filterFreq: 1600
  },
  pongBounce: {
    type: 'pongBounce',
    frequency: { start: 330, end: 530 },
    oscillatorType: 'sine',
    duration: 0.08,
    attack: 0.005,
    decay: 0.02,
    sustain: 0.2,
    release: 0.05,
    filterType: 'bandpass',
    filterFreq: 900
  },
  terminalType: {
    type: 'terminalType',
    frequency: { start: 880, end: 880 },
    oscillatorType: 'triangle',
    duration: 0.04,
    attack: 0.003,
    decay: 0.01,
    sustain: 0.1,
    release: 0.02,
    filterType: 'highpass',
    filterFreq: 800
  },
  // R83.CTRLS.19 — soft matrix "click" for CTRL-S World paragraph advance.
  // Short square wave through a 2 kHz lowpass reads as a muted terminal key
  // tap rather than the tonal `menu` blip that previously fired. Volume
  // scaled to 0.15 so rapid SPACE/ENTER presses don't pile up on the dread
  // drone mix. Procedural-only by design (no AUDIO_FILE_MAP entry) — a
  // 20 ms sample would weigh more as an MP3 than it does synthesised.
  ctrlsAdvance: {
    type: 'ctrlsAdvance',
    frequency: { start: 1200, end: 1200 },
    oscillatorType: 'square',
    duration: 0.02,
    attack: 0.002,
    decay: 0.005,
    sustain: 0.4,
    release: 0.013,
    filterType: 'lowpass',
    filterFreq: 2000,
    volumeScale: 0.15,
  },
  matrixRain: {
    type: 'matrixRain',
    frequency: { start: 220, end: 330 },
    oscillatorType: 'sine',
    duration: 0.6,
    attack: 0.15,
    decay: 0.15,
    sustain: 0.2,
    release: 0.25,
    filterType: 'lowpass',
    filterFreq: 600
  },

  // Bullet time power-up sounds
  powerupBulletTime: {
    type: 'powerupBulletTime',
    frequency: { start: 880, end: 440 },
    oscillatorType: 'sine',
    duration: 0.35,
    attack: 0.04,
    decay: 0.1,
    sustain: 0.3,
    release: 0.2,
    filterType: 'lowpass',
    filterFreq: 1200,
    reverb: true
  },
  powerupGhost: {
    type: 'powerupGhost',
    frequency: { start: 330, end: 550 },
    oscillatorType: 'sine',
    duration: 0.45,
    attack: 0.08,
    decay: 0.12,
    sustain: 0.25,
    release: 0.2,
    filterType: 'bandpass',
    filterFreq: 800,
    reverb: true
  },
  powerupShield: {
    type: 'powerupShield',
    frequency: { start: 523, end: 784 },
    oscillatorType: 'triangle',
    duration: 0.28,
    attack: 0.02,
    decay: 0.08,
    sustain: 0.4,
    release: 0.18,
    filterType: 'highpass',
    filterFreq: 400
  },
  powerupMagnet: {
    type: 'powerupMagnet',
    frequency: { start: 220, end: 330 },
    oscillatorType: 'triangle',
    duration: 0.3,
    attack: 0.04,
    decay: 0.08,
    sustain: 0.3,
    release: 0.15,
    filterType: 'bandpass',
    filterFreq: 600
  },

  // Shooting sound
  shoot: {
    type: 'shoot',
    frequency: { start: 1100, end: 400 },
    oscillatorType: 'triangle',
    duration: 0.12,
    attack: 0.003,
    decay: 0.05,
    sustain: 0.1,
    release: 0.04,
    filterType: 'bandpass',
    filterFreq: 1800
  },

  // Rhythm game sounds
  rhythmMiss: {
    type: 'rhythmMiss',
    frequency: { start: 220, end: 110 },
    oscillatorType: 'triangle',
    duration: 0.15,
    attack: 0.01,
    decay: 0.05,
    sustain: 0.05,
    release: 0.09,
    filterType: 'lowpass',
    filterFreq: 350
  },
  rhythmGood: {
    type: 'rhythmGood',
    frequency: { start: 440, end: 523 },
    oscillatorType: 'sine',
    duration: 0.1,
    attack: 0.01,
    decay: 0.03,
    sustain: 0.25,
    release: 0.06,
    filterType: 'bandpass',
    filterFreq: 900
  },
  rhythmPerfect: {
    type: 'rhythmPerfect',
    frequency: { start: 784, end: 987 },
    oscillatorType: 'triangle',
    duration: 0.14,
    attack: 0.01,
    decay: 0.04,
    sustain: 0.3,
    release: 0.09,
    filterType: 'bandpass',
    filterFreq: 1500
  },
  rhythmCombo: {
    type: 'rhythmCombo',
    frequency: { start: 523, end: 659 },
    oscillatorType: 'triangle',
    duration: 0.22,
    attack: 0.02,
    decay: 0.08,
    sustain: 0.4,
    release: 0.12,
    filterType: 'bandpass',
    filterFreq: 1200,
    reverb: true
  },

  // Agent Chase sounds
  wakaWaka: {
    type: 'wakaWaka',
    frequency: { start: 550, end: 440 },
    oscillatorType: 'triangle',
    duration: 0.06,
    attack: 0.005,
    decay: 0.02,
    sustain: 0.2,
    release: 0.03,
    filterType: 'bandpass',
    filterFreq: 800
  },
  ghostEat: {
    type: 'ghostEat',
    frequency: { start: 220, end: 660 },
    oscillatorType: 'triangle',
    duration: 0.3,
    attack: 0.01,
    decay: 0.12,
    sustain: 0.3,
    release: 0.15,
    filterType: 'bandpass',
    filterFreq: 1200
  },

  // Matrix Frogger (synthesis fallbacks while audio files load)
  froggerDeath: {
    type: 'froggerDeath',
    frequency: { start: 200, end: 80 },
    oscillatorType: 'triangle',
    duration: 0.35,
    attack: 0.01,
    decay: 0.1,
    sustain: 0.1,
    release: 0.2,
    filterType: 'lowpass',
    filterFreq: 350
  },
  froggerMove: {
    type: 'froggerMove',
    frequency: { start: 500, end: 350 },
    oscillatorType: 'sine',
    duration: 0.06,
    attack: 0.005,
    decay: 0.02,
    sustain: 0.15,
    release: 0.03,
    filterType: 'bandpass',
    filterFreq: 700
  },
  froggerScore: {
    type: 'froggerScore',
    frequency: { start: 523, end: 784 },
    oscillatorType: 'triangle',
    duration: 0.25,
    attack: 0.02,
    decay: 0.08,
    sustain: 0.35,
    release: 0.12,
    filterType: 'bandpass',
    filterFreq: 1500
  },
  froggerPickup: {
    type: 'froggerPickup',
    frequency: { start: 659, end: 880 },
    oscillatorType: 'triangle',
    duration: 0.2,
    attack: 0.01,
    decay: 0.06,
    sustain: 0.3,
    release: 0.1,
    filterType: 'highpass',
    filterFreq: 500
  },
  froggerExtraScore: {
    type: 'froggerExtraScore',
    frequency: { start: 784, end: 1047 },
    oscillatorType: 'triangle',
    duration: 0.3,
    attack: 0.03,
    decay: 0.1,
    sustain: 0.4,
    release: 0.15,
    filterType: 'bandpass',
    filterFreq: 1800,
    reverb: true
  },

  // Scoreboard sounds
  scoreboardTab: {
    type: 'scoreboardTab',
    frequency: { start: 200, end: 200 },
    oscillatorType: 'square',
    duration: 0.06,
    attack: 0.005,
    decay: 0.02,
    sustain: 0.15,
    release: 0.03,
    filterType: 'bandpass',
    filterFreq: 600
  },
  scoreboardNewHigh: {
    type: 'scoreboardNewHigh',
    frequency: { start: 523, end: 1047 },
    oscillatorType: 'triangle',
    duration: 0.6,
    attack: 0.02,
    decay: 0.15,
    sustain: 0.5,
    release: 0.2,
    filterType: 'bandpass',
    filterFreq: 2000,
    reverb: true
  },
  scoreboardLetterCycle: {
    type: 'scoreboardLetterCycle',
    frequency: { start: 660, end: 660 },
    oscillatorType: 'square',
    duration: 0.04,
    attack: 0.003,
    decay: 0.01,
    sustain: 0.1,
    release: 0.02,
    filterType: 'highpass',
    filterFreq: 500
  },
  scoreboardConfirm: {
    type: 'scoreboardConfirm',
    frequency: { start: 523, end: 784 },
    oscillatorType: 'triangle',
    duration: 0.18,
    attack: 0.01,
    decay: 0.06,
    sustain: 0.35,
    release: 0.08,
    filterType: 'bandpass',
    filterFreq: 1500
  },

  // CTRL-S typewriter ticks — per-character archetype
  ctrlsTickProtagonist: {
    type: 'ctrlsTickProtagonist',
    frequency: { start: 800, end: 600 },
    oscillatorType: 'sine',
    duration: 0.04,
    attack: 0.003,
    decay: 0.015,
    sustain: 0.1,
    release: 0.02,
    filterType: 'highpass',
    filterFreq: 500
  },
  ctrlsTickAntagonist: {
    type: 'ctrlsTickAntagonist',
    frequency: { start: 180, end: 120 },
    oscillatorType: 'sawtooth',
    duration: 0.06,
    attack: 0.005,
    decay: 0.02,
    sustain: 0.15,
    release: 0.03,
    filterType: 'lowpass',
    filterFreq: 300
  },
  ctrlsTickNpc: {
    type: 'ctrlsTickNpc',
    frequency: { start: 440, end: 350 },
    oscillatorType: 'triangle',
    duration: 0.04,
    attack: 0.003,
    decay: 0.015,
    sustain: 0.1,
    release: 0.02,
    filterType: 'bandpass',
    filterFreq: 600
  },
  ctrlsTickNarrator: {
    type: 'ctrlsTickNarrator',
    frequency: { start: 550, end: 500 },
    oscillatorType: 'sine',
    duration: 0.03,
    attack: 0.002,
    decay: 0.01,
    sustain: 0.08,
    release: 0.015,
  },

  // Chapter-cut whoosh. Present in AUDIO_FILE_MAP but was missing a SOUND_LIBRARY
  // fallback — so during the cold-start window (before preloadAudioFiles has
  // cached the MP3) callers like MenuScene's JACK IN and NarrativeScene's
  // onAllComplete hit the synthesis branch, found nothing, and logged
  // "Sound effect 'ctrlsTransition' not found in library". Descending sweep
  // 660→220 Hz with bandpass + reverb reads as a terminal-cut whoosh that
  // matches the file's character, so either path is sonically acceptable.
  ctrlsTransition: {
    type: 'ctrlsTransition',
    frequency: { start: 660, end: 220 },
    oscillatorType: 'sine',
    duration: 0.45,
    attack: 0.02,
    decay: 0.1,
    sustain: 0.35,
    release: 0.25,
    filterType: 'bandpass',
    filterFreq: 900,
    reverb: true,
  }
};

// Maps sound keys to pre-recorded audio files (Matrix Trilogy SFX kit + per-game audio).
// Keys present here play the file; keys absent fall back to procedural synthesis above.
const AUDIO_FILE_MAP: Record<string, string> = {
  menu: '/assets/audio/sfx/sfx_button_click.mp3',
  shoot: '/assets/audio/sfx/sfx_laser_gun_1.mp3',
  hit: '/assets/audio/sfx/sfx_impact_medium.mp3',
  score: '/assets/audio/sfx/sfx_beeps.mp3',
  powerup: '/assets/audio/sfx/sfx_charge_ignitor.mp3',
  powerupBulletTime: '/assets/audio/sfx/sfx_bullet_time.mp3',
  levelUp: '/assets/audio/sfx/sfx_burst.mp3',
  gameOver: '/assets/audio/sfx/sfx_explosion_emp.mp3',
  combo: '/assets/audio/sfx/sfx_impact_small.mp3',
  jump: '/assets/audio/sfx/sfx_landing.mp3',
  snakeEat: '/assets/audio/sfx/sfx_matrix_code_1.mp3',
  terminalType: '/assets/audio/sfx/sfx_matrix_code_2.mp3',
  matrixRain: '/assets/audio/sfx/sfx_light_flicker.mp3',
  rhythmMiss: '/assets/audio/sfx/sfx_blown_fuse.mp3',
  ghostEat: '/assets/audio/sfx/sfx_agent_dies.mp3',
  pongBounce: '/assets/audio/sfx/sfx_impact_small.mp3',

  // Matrix Frogger game-specific audio
  froggerDeath: '/assets/matrix-frogger/audio/death.mp3',
  froggerMove: '/assets/matrix-frogger/audio/move.mp3',
  froggerScore: '/assets/matrix-frogger/audio/score.mp3',
  froggerPickup: '/assets/matrix-frogger/audio/frog_pick_up.mp3',
  froggerExtraScore: '/assets/matrix-frogger/audio/extra_score.mp3',

  // Extended SFX — Matrix Trilogy kit
  jackIn: '/assets/audio/sfx/sfx_jacking_in.mp3',
  achievementUnlock: '/assets/audio/sfx/sfx_power_surge.mp3',
  platformBreak: '/assets/audio/sfx/sfx_statue_break.mp3',
  collectible: '/assets/audio/sfx/sfx_ammo_drop.mp3',
  fall: '/assets/audio/sfx/sfx_elevator_drop.mp3',
  bossExplosion: '/assets/audio/sfx/sfx_explosion_large.mp3',
  enemyAlert: '/assets/audio/sfx/sfx_sentinel_search.mp3',
  dangerWarning: '/assets/audio/sfx/sfx_sentinel_swarm.mp3',
  kungFuHit: '/assets/audio/sfx/sfx_kung_fu_hit.mp3',
  glassBreak: '/assets/audio/sfx/sfx_glass_break.mp3',
  powerDown: '/assets/audio/sfx/sfx_power_down.mp3',
  dotEat: '/assets/audio/sfx/sfx_blip.mp3',
  specialAbility: '/assets/audio/sfx/sfx_spoon_bend.mp3',
  unplug: '/assets/audio/sfx/sfx_unplug.mp3',
  laserGun2: '/assets/audio/sfx/sfx_laser_gun_2.mp3',
  bulletsDrop: '/assets/audio/sfx/sfx_bullets_drop.mp3',
  doorOpen: '/assets/audio/sfx/sfx_door_open.mp3',
  hitGround: '/assets/audio/sfx/sfx_hit_ground.mp3',

  // CTRL-S World narrative stingers
  // Note: ctrlsAdvance is intentionally absent — a 20 ms click is smaller as
  // synthesis than as an MP3, and R83 forbids new audio files.
  ctrlsPuzzleAppear: '/assets/ctrl-s/audio/sfx/puzzle-appear.mp3',
  ctrlsPuzzleSolved: '/assets/ctrl-s/audio/sfx/puzzle-solved.mp3',
  ctrlsPuzzleFailed: '/assets/ctrl-s/audio/sfx/puzzle-failed.mp3',
  ctrlsChapterStart: '/assets/ctrl-s/audio/sfx/chapter-start.mp3',
  ctrlsChapterComplete: '/assets/ctrl-s/audio/sfx/chapter-complete.mp3',
  ctrlsDramaticSting: '/assets/ctrl-s/audio/sfx/dramatic-sting.mp3',
  ctrlsReveal: '/assets/ctrl-s/audio/sfx/reveal.mp3',
  ctrlsTransition: '/assets/ctrl-s/audio/sfx/transition.mp3',
};

// Background music sequences using Web Audio synthesis
const MUSIC_SEQUENCES = {
  menu: {
    notes: [220, 246.94, 261.63, 293.66, 329.63, 349.23, 392], // A3 to G4
    rhythm: [0.5, 0.25, 0.5, 0.25, 0.5, 0.25, 1.0],
    tempo: 120,
    loop: true
  },
  gameplay: {
    notes: [174.61, 196, 220, 246.94, 261.63, 293.66], // F3 to D4
    rhythm: [0.5, 0.5, 0.25, 0.25, 0.5, 0.5],
    tempo: 100,
    loop: true
  },
  intense: {
    notes: [130.81, 146.83, 164.81, 174.61, 196, 220], // C3 to A3
    rhythm: [0.25, 0.25, 0.25, 0.25, 0.5, 0.5],
    tempo: 140,
    loop: true
  }
};

export function useSoundSystem() {
  const [config, setConfig] = useState<SoundConfig>(() => {
    const saved = localStorage.getItem('matrix-arcade-audio-config');
    return saved ? { ...DEFAULT_CONFIG, ...JSON.parse(saved) } : DEFAULT_CONFIG;
  });
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const musicSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const musicGainRef = useRef<GainNode | null>(null);
  const sfxGainRef = useRef<GainNode | null>(null);
  const currentMusicRef = useRef<string | null>(null);
  const musicLoopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const backgroundMusicRef = useRef<HTMLAudioElement | null>(null);
  const reverbRef = useRef<ConvolverNode | null>(null);
  const preMuteConfigRef = useRef<{ music: boolean; sfx: boolean } | null>(null);
  const audioBufferCacheRef = useRef<Map<string, AudioBuffer>>(new Map());
  const preloadingRef = useRef(false);

  // Create reverb impulse response
  const createReverbBuffer = useCallback((
    audioContext: AudioContext,
    channels: number,
    sampleRate: number,
    length: number
  ): AudioBuffer => {
    const buffer = audioContext.createBuffer(channels, sampleRate * length, sampleRate);
    
    for (let channel = 0; channel < channels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < channelData.length; i++) {
        const decay = Math.pow(1 - i / channelData.length, 2);
        channelData[i] = (Math.random() * 2 - 1) * decay * 0.3;
      }
    }
    return buffer;
  }, []);

  // Initialize audio context and setup
  const initializeAudio = useCallback(async () => {
    // Check if context exists and its state
    if (audioContextRef.current) {
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }
      if (audioContextRef.current.state === 'closed') {
        audioContextRef.current = null;
        return null;
      }
      return audioContextRef.current;
    }

    try {
      const AudioContext = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      // Create master gain node
      const masterGain = audioContext.createGain();
      masterGain.gain.setValueAtTime(config.masterVolume, audioContext.currentTime);
      masterGain.connect(audioContext.destination);
      masterGainRef.current = masterGain;

      // Create music gain node
      const musicGain = audioContext.createGain();
      musicGain.gain.setValueAtTime(config.musicVolume, audioContext.currentTime);
      musicGain.connect(masterGain);
      musicGainRef.current = musicGain;

      // Create SFX gain node
      const sfxGain = audioContext.createGain();
      sfxGain.gain.setValueAtTime(config.sfxVolume, audioContext.currentTime);
      sfxGain.connect(masterGain);
      sfxGainRef.current = sfxGain;

      // Create reverb node
      const convolver = audioContext.createConvolver();
      const reverbBuffer = createReverbBuffer(audioContext, 2, audioContext.sampleRate, 1.5);
      convolver.buffer = reverbBuffer;
      reverbRef.current = convolver;

      // Preload audio file SFX in the background
      if (!preloadingRef.current) {
        preloadingRef.current = true;
        preloadAudioFiles(audioContext);
      }

      return audioContext;
    } catch (error) {
      if (import.meta.env.DEV) {
         
        console.warn('Failed to initialize audio context:', error);
      }
      return null;
    }
  }, [config.masterVolume, config.musicVolume, config.sfxVolume, createReverbBuffer]);

  // Preload all mapped audio files into AudioBuffer cache
  const preloadAudioFiles = useCallback((audioContext: AudioContext) => {
    const uniqueUrls = new Set(Object.values(AUDIO_FILE_MAP));
    for (const url of uniqueUrls) {
      fetch(url)
        .then(res => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.arrayBuffer();
        })
        .then(data => audioContext.decodeAudioData(data))
        .then(buffer => {
          audioBufferCacheRef.current.set(url, buffer);
        })
        .catch(() => {
          // File not available — synthesis fallback will handle it
        });
    }
  }, []);

  // Play a cached AudioBuffer through the SFX gain chain
  const playAudioBuffer = useCallback((
    audioContext: AudioContext,
    buffer: AudioBuffer,
    sfxGain: GainNode
  ) => {
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(sfxGain);
    source.start(0);
  }, []);

  // Play sound effect — uses pre-loaded audio file when available, procedural synthesis as fallback
  const playSFX = useCallback(async (soundType: string, customConfig?: Partial<SoundEffect>) => {
    if (!config.sfx) return;

    const audioContext = await initializeAudio();
    if (!audioContext || !sfxGainRef.current) return;

    // Prefer pre-loaded audio file when available and no custom synthesis config
    if (!customConfig) {
      const fileUrl = AUDIO_FILE_MAP[soundType];
      if (fileUrl) {
        const cached = audioBufferCacheRef.current.get(fileUrl);
        if (cached) {
          try {
            if (audioContext.state !== 'closed') {
              playAudioBuffer(audioContext, cached, sfxGainRef.current);
            }
          } catch {
            // Fall through to synthesis on playback error
          }
          return;
        }
      }
    }

    const soundConfig = customConfig
      ? { ...SOUND_LIBRARY[soundType], ...customConfig }
      : SOUND_LIBRARY[soundType];

    if (!soundConfig) {
      if (import.meta.env.DEV) {

        console.warn(`Sound effect '${soundType}' not found in library`);
      }
      return;
    }

    try {
      // Check if context is still valid
      if (audioContext.state === 'closed') return;
      
      // Create oscillator
      const oscillator = audioContext.createOscillator();
      oscillator.type = soundConfig.oscillatorType;
      oscillator.frequency.setValueAtTime(soundConfig.frequency.start, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(
        soundConfig.frequency.end,
        audioContext.currentTime + soundConfig.duration
      );

      // Create envelope. `volumeScale` (0–1, default 1) uniformly multiplies
      // the attack peak and sustain level so a per-scene call can drop a SFX
      // without touching the global sfxVolume slider. Clamped [0, 1] so a
      // rogue caller can never push past unity gain.
      const volumeScale = Math.max(0, Math.min(1, soundConfig.volumeScale ?? 1));
      const envelope = audioContext.createGain();
      envelope.gain.setValueAtTime(0, audioContext.currentTime);
      envelope.gain.linearRampToValueAtTime(volumeScale, audioContext.currentTime + soundConfig.attack);
      envelope.gain.linearRampToValueAtTime(
        soundConfig.sustain * volumeScale,
        audioContext.currentTime + soundConfig.attack + soundConfig.decay
      );
      envelope.gain.linearRampToValueAtTime(
        0,
        audioContext.currentTime + soundConfig.duration
      );

      // Create filter if specified
      if (soundConfig.filterType && soundConfig.filterFreq) {
        const filter = audioContext.createBiquadFilter();
        filter.type = soundConfig.filterType;
        filter.frequency.setValueAtTime(soundConfig.filterFreq, audioContext.currentTime);
        filter.Q.setValueAtTime(1, audioContext.currentTime);
        
        oscillator.connect(filter);
        filter.connect(envelope);
      } else {
        oscillator.connect(envelope);
      }

      // Add reverb if specified
      if (soundConfig.reverb && reverbRef.current) {
        const reverbGain = audioContext.createGain();
        reverbGain.gain.setValueAtTime(0.3, audioContext.currentTime);
        
        const dryGain = audioContext.createGain();
        dryGain.gain.setValueAtTime(0.7, audioContext.currentTime);
        
        envelope.connect(dryGain);
        envelope.connect(reverbGain);
        reverbGain.connect(reverbRef.current);
        reverbRef.current.connect(sfxGainRef.current);
        dryGain.connect(sfxGainRef.current);
      } else {
        envelope.connect(sfxGainRef.current);
      }

      // Start and stop oscillator
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + soundConfig.duration);

    } catch (error) {
      if (import.meta.env.DEV) {
         
        console.warn('Error playing sound effect:', error);
      }
    }
  }, [config.sfx, initializeAudio]);

  // Play background music
  const playMusic = useCallback(async (sequenceType: keyof typeof MUSIC_SEQUENCES) => {
    if (!config.music) return;
    
    // Stop current music if playing
    if (musicSourceRef.current) {
      musicSourceRef.current.stop();
      musicSourceRef.current = null;
    }

    const audioContext = await initializeAudio();
    if (!audioContext || !musicGainRef.current) return;

    currentMusicRef.current = sequenceType;
    const sequence = MUSIC_SEQUENCES[sequenceType];
    
    try {
      const playSequence = () => {
        if (currentMusicRef.current !== sequenceType) return; // Check if music changed
        if (audioContext.state === 'closed') return; // Check if context is closed
        
        let time = audioContext.currentTime;
        const noteDuration = 60 / sequence.tempo; // Base note duration

        sequence.notes.forEach((frequency, index) => {
          const rhythm = sequence.rhythm[index];
          const duration = noteDuration * rhythm;

          // Create oscillator for each note
          const oscillator = audioContext.createOscillator();
          oscillator.type = 'triangle';
          oscillator.frequency.setValueAtTime(frequency, time);

          // Create envelope for musical note
          const noteGain = audioContext.createGain();
          noteGain.gain.setValueAtTime(0, time);
          noteGain.gain.linearRampToValueAtTime(0.1, time + 0.02);
          noteGain.gain.linearRampToValueAtTime(0.05, time + duration * 0.7);
          noteGain.gain.linearRampToValueAtTime(0, time + duration);

          // Add subtle filter for warmth
          const filter = audioContext.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(1200, time);
          filter.Q.setValueAtTime(0.5, time);

          oscillator.connect(filter);
          filter.connect(noteGain);
          noteGain.connect(musicGainRef.current!);

          oscillator.start(time);
          oscillator.stop(time + duration);

          time += duration;
        });

        // Schedule next loop if enabled
        if (sequence.loop && currentMusicRef.current === sequenceType) {
          const totalDuration = sequence.rhythm.reduce((sum, r) => sum + r * noteDuration, 0);
          musicLoopTimerRef.current = setTimeout(playSequence, totalDuration * 1000);
        }
      };

      playSequence();
    } catch (error) {
      if (import.meta.env.DEV) {
         
        console.warn('Error playing background music:', error);
      }
    }
  }, [config.music, initializeAudio]);

  // Stop music
  const stopMusic = useCallback(() => {
    currentMusicRef.current = null;
    if (musicLoopTimerRef.current) {
      clearTimeout(musicLoopTimerRef.current);
      musicLoopTimerRef.current = null;
    }
    if (musicSourceRef.current) {
      musicSourceRef.current.stop();
      musicSourceRef.current = null;
    }
    // Also stop MP3 background music if playing
    if (backgroundMusicRef.current) {
      backgroundMusicRef.current.pause();
      backgroundMusicRef.current.currentTime = 0;
    }
  }, []);

  // Per-game ambient multiplier so a scene can request a quieter mix
  // (e.g. Matrix Snake at 0.7) without permanently muting global music volume.
  // Stored on the audio element so the config-update effect can re-apply it.
  const bgMusicAmbientMultiplierRef = useRef(1);

  // Play MP3 background music — keeps playing if same track is already active.
  // `ambientMultiplier` (0–1, default 1) lets a game soften the mix locally.
  const playBackgroundMP3 = useCallback((src: string, ambientMultiplier = 1) => {
    if (!config.music || !src) return;

    const clampedMultiplier = Math.max(0, Math.min(1, ambientMultiplier));
    bgMusicAmbientMultiplierRef.current = clampedMultiplier;

    // Create or reuse audio element
    if (!backgroundMusicRef.current) {
      backgroundMusicRef.current = new Audio();
      backgroundMusicRef.current.loop = true;
    }

    const targetVolume = config.masterVolume * config.musicVolume * clampedMultiplier;

    // If the same track is already playing, just ensure volume is correct and don't restart
    if (backgroundMusicRef.current.src.endsWith(src) && !backgroundMusicRef.current.paused) {
      backgroundMusicRef.current.volume = targetVolume;
      return;
    }

    // Stop any existing procedural music (but not the background MP3)
    currentMusicRef.current = null;
    if (musicSourceRef.current) {
      musicSourceRef.current.stop();
      musicSourceRef.current = null;
    }

    backgroundMusicRef.current.src = src;
    backgroundMusicRef.current.volume = targetVolume;

    // Play the music
    backgroundMusicRef.current.play().catch(error => {
      if (import.meta.env.DEV) {
        console.warn('Error playing background music:', error);
      }
    });

  }, [config.music, config.masterVolume, config.musicVolume]);

  // Stop MP3 background music
  const stopBackgroundMP3 = useCallback(() => {
    if (backgroundMusicRef.current) {
      backgroundMusicRef.current.pause();
      backgroundMusicRef.current.currentTime = 0;
    }
  }, []);

  // R83.CTRLS.17 — ambient dread drone. Procedural sub-bass drone used under
  // CTRL-S narrative scenes to give the game its "lost in time" undercurrent.
  // Routed through masterGain so the global mute toggle silences it alongside
  // everything else. All nodes are held on refs so `stopAmbientDrone()` can
  // tear them down deterministically; callers keep the drone alive by simply
  // not stopping it — there's no polling loop.
  //
  // Recipe (from task .17(d)):
  //   - 55 Hz low-saw fundamental + 55 Hz sine (one octave sub fused in) —
  //     saw alone sounds like a radio hum, sine alone disappears on small
  //     speakers; the pair reads as "felt" on laptops while staying subtle.
  //   - Lowpass at 180 Hz so any higher harmonics from the saw don't clash
  //     with dialogue or the BGM track the chapter plays on top.
  //   - Amplitude LFO at 0.1 Hz (one full breath every ~10 s) between 0.55×
  //     and 1.0× — reads as "something is breathing behind the terminal."
  //   - Occasional minor-6th stab: a 440→140 Hz sine pluck every 12-22 s,
  //     panned centre, 0.5 s tail. Gives the ear something to catch onto so
  //     the drone doesn't dissolve into white noise of inattention.
  const ambientDroneNodesRef = useRef<{
    oscLow: OscillatorNode;
    oscSub: OscillatorNode;
    gain: GainNode;
    lfo: OscillatorNode;
    lfoGain: GainNode;
    filter: BiquadFilterNode;
    stabTimer: ReturnType<typeof setInterval> | null;
  } | null>(null);

  const playAmbientDrone = useCallback(async (options?: { volume?: number }) => {
    if (ambientDroneNodesRef.current) return; // already running
    const audioContext = await initializeAudio();
    if (!audioContext || !masterGainRef.current) return;
    if (audioContext.state === 'closed') return;

    const now = audioContext.currentTime;
    const targetVolume = Math.max(0, Math.min(1, options?.volume ?? 0.18));

    const gain = audioContext.createGain();
    gain.gain.setValueAtTime(0, now);
    // Fade in over 2 s so the drone slips under the player's awareness rather
    // than announcing itself.
    gain.gain.linearRampToValueAtTime(targetVolume, now + 2);

    const filter = audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(180, now);
    filter.Q.setValueAtTime(0.8, now);

    const oscLow = audioContext.createOscillator();
    oscLow.type = 'sawtooth';
    oscLow.frequency.setValueAtTime(55, now);

    const oscSub = audioContext.createOscillator();
    oscSub.type = 'sine';
    oscSub.frequency.setValueAtTime(55, now);

    const lfo = audioContext.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.1, now);

    const lfoGain = audioContext.createGain();
    // LFO depth: ±0.225 × targetVolume → amplitude wobble between 0.55× and
    // 1.0× baseline. Keeping the floor > 0 stops the drone audibly "popping"
    // back in on each cycle.
    lfoGain.gain.setValueAtTime(targetVolume * 0.225, now);

    oscLow.connect(filter);
    oscSub.connect(filter);
    filter.connect(gain);
    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);
    gain.connect(masterGainRef.current);

    oscLow.start(now);
    oscSub.start(now);
    lfo.start(now);

    // Minor-6th stab every 12-22 s. setInterval gives us irregular-ish timing
    // because JS timers drift slightly; fine for atmosphere work.
    const scheduleStab = () => {
      if (!ambientDroneNodesRef.current) return;
      const ctx = audioContextRef.current;
      const master = masterGainRef.current;
      if (!ctx || !master || ctx.state === 'closed') return;

      const stabTime = ctx.currentTime;
      const stabGain = ctx.createGain();
      stabGain.gain.setValueAtTime(0, stabTime);
      stabGain.gain.linearRampToValueAtTime(targetVolume * 0.3, stabTime + 0.02);
      stabGain.gain.exponentialRampToValueAtTime(0.0001, stabTime + 0.5);

      const stabOsc = ctx.createOscillator();
      stabOsc.type = 'sine';
      // Minor-sixth above the drone root = ~88 Hz, but we pitch-down-sweep for
      // the "stab" feel. Starts around A3 (220 Hz) and sweeps to F2 (~87 Hz)
      // — the minor-sixth landing point.
      stabOsc.frequency.setValueAtTime(220, stabTime);
      stabOsc.frequency.exponentialRampToValueAtTime(87.3, stabTime + 0.45);

      stabOsc.connect(stabGain);
      stabGain.connect(master);
      stabOsc.start(stabTime);
      stabOsc.stop(stabTime + 0.55);
    };
    const stabTimer = setInterval(() => {
      // 50% chance each tick so the cadence feels uneven.
      if (Math.random() < 0.5) scheduleStab();
    }, 10_000);

    ambientDroneNodesRef.current = {
      oscLow,
      oscSub,
      gain,
      lfo,
      lfoGain,
      filter,
      stabTimer,
    };
  }, [initializeAudio]);

  const stopAmbientDrone = useCallback(() => {
    const nodes = ambientDroneNodesRef.current;
    if (!nodes) return;
    ambientDroneNodesRef.current = null;

    const ctx = audioContextRef.current;
    if (nodes.stabTimer) clearInterval(nodes.stabTimer);
    if (!ctx || ctx.state === 'closed') return;

    const now = ctx.currentTime;
    try {
      // 1 s fade-out then stop — prevents the DC click that a hard stop on a
      // sawtooth at non-zero phase produces.
      nodes.gain.gain.cancelScheduledValues(now);
      nodes.gain.gain.setValueAtTime(nodes.gain.gain.value, now);
      nodes.gain.gain.linearRampToValueAtTime(0, now + 1);
      nodes.oscLow.stop(now + 1.05);
      nodes.oscSub.stop(now + 1.05);
      nodes.lfo.stop(now + 1.05);
    } catch {
      // Oscillators already stopped — safe to ignore.
    }
  }, []);

  // Update config using functional updater to avoid stale closure
  const updateConfig = useCallback((newConfig: Partial<SoundConfig>) => {
    setConfig(prev => {
      const updated = { ...prev, ...newConfig };
      localStorage.setItem('matrix-arcade-audio-config', JSON.stringify(updated));

      // Update gain nodes if they exist
      const currentTime = audioContextRef.current?.currentTime || 0;
      if (masterGainRef.current && updated.masterVolume !== prev.masterVolume) {
        masterGainRef.current.gain.setValueAtTime(updated.masterVolume, currentTime);
      }
      if (musicGainRef.current && updated.musicVolume !== prev.musicVolume) {
        musicGainRef.current.gain.setValueAtTime(updated.musicVolume, currentTime);
      }
      if (sfxGainRef.current && updated.sfxVolume !== prev.sfxVolume) {
        sfxGainRef.current.gain.setValueAtTime(updated.sfxVolume, currentTime);
      }

      // Immediately update MP3 background music volume if it exists, preserving the per-game ambient multiplier
      if (backgroundMusicRef.current && (updated.masterVolume !== prev.masterVolume || updated.musicVolume !== prev.musicVolume)) {
        backgroundMusicRef.current.volume =
          updated.masterVolume * updated.musicVolume * bgMusicAmbientMultiplierRef.current;
      }

      return updated;
    });
  }, []);

  // Check if muted (must be defined before toggleMute)
  const isMuted = !config.music && !config.sfx;

  // Toggle mute for all sounds (preserves individual music/sfx settings)
  //
  // Why we silence via masterGain instead of stopping: calling stopMusic() on
  // mute pauses the BGM HTMLAudioElement AND rewinds its currentTime to 0, so
  // there was no symmetrical "resume" on unmute and every game stayed silent
  // after the second M press (R83.G1). Setting masterGain to 0 silences every
  // Web Audio oscillator routed through it while leaving the graph intact, and
  // the HTMLAudioElement's own `muted` flag (applied via the useEffect below)
  // keeps BGM playback position so unmute is simply "restore gain + unmute
  // element". We also defensively resume() the AudioContext in case the
  // browser's autoplay policy or a tab-blur suspended it while muted.
  const toggleMute = useCallback(() => {
    if (!isMuted) {
      preMuteConfigRef.current = { music: config.music, sfx: config.sfx };
      updateConfig({ music: false, sfx: false });
      const ctx = audioContextRef.current;
      if (masterGainRef.current && ctx && ctx.state !== 'closed') {
        masterGainRef.current.gain.setValueAtTime(0, ctx.currentTime);
      }
    } else {
      const restored = preMuteConfigRef.current || { music: true, sfx: true };
      updateConfig(restored);
      preMuteConfigRef.current = null;

      const ctx = audioContextRef.current;
      if (ctx && ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      if (masterGainRef.current && ctx && ctx.state !== 'closed') {
        masterGainRef.current.gain.setValueAtTime(config.masterVolume, ctx.currentTime);
      }
      // If BGM was paused while muted (some browsers pause on masterGain=0
      // or on tab-blur), nudge it back into play. The element's `muted`
      // flag is cleared by the useEffect once `config.music` re-flips.
      const bgm = backgroundMusicRef.current;
      if (restored.music && bgm && bgm.src && bgm.paused) {
        bgm.muted = false;
        bgm.play().catch(() => {});
      }
    }
  }, [config.music, config.sfx, config.masterVolume, isMuted, updateConfig]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopMusic();
      stopAmbientDrone();
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, [stopMusic, stopAmbientDrone]);

  // Update MP3 volume when config changes
  useEffect(() => {
    if (backgroundMusicRef.current) {
      backgroundMusicRef.current.volume =
        config.masterVolume * config.musicVolume * bgMusicAmbientMultiplierRef.current;
      backgroundMusicRef.current.muted = isMuted || !config.music;
    }
  }, [config.masterVolume, config.musicVolume, config.music, isMuted]);

  // Memoize the return value to prevent unnecessary re-renders
  return useMemo(
    () => ({
      config,
      updateConfig,
      playSFX,
      playMusic,
      stopMusic,
      playBackgroundMP3,
      stopBackgroundMP3,
      playAmbientDrone,
      stopAmbientDrone,
      toggleMute,
      isMuted,
      isInitialized: !!audioContextRef.current,
      soundLibrary: Object.keys(SOUND_LIBRARY),
      musicSequences: Object.keys(MUSIC_SEQUENCES)
    }),
    [config, updateConfig, playSFX, playMusic, stopMusic, playBackgroundMP3, stopBackgroundMP3, playAmbientDrone, stopAmbientDrone, toggleMute, isMuted]
  );
}