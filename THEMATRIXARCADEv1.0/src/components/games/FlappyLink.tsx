import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Volume2, VolumeX, Play, Pause, RotateCw, Trophy, Shield, Wifi, Battery, Zap } from 'lucide-react';

// Game constants - Adjusted for easier gameplay
const GRAVITY = 0.25; // Reduced from 0.5
const JUMP_FORCE = -6; // Reduced from -8 for gentler jumps
const PIPE_SPEED = 2; // Reduced from 3
const PIPE_SPACING = 300; // Increased from 200 for more space between pipes
const PIPE_GAP = 180; // Increased from 150 for larger gaps
const GROUND_HEIGHT = 50;
const PARTICLE_COUNT = 50;

// Rest of the imports and type definitions remain the same...
[Previous code from line 13 to line 675 remains exactly the same]

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-black p-4">
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={800}
          height={400}
          className="border-2 border-green-500 rounded-lg shadow-[0_0_20px_rgba(0,255,0,0.3)]"
          onClick={jump}
        />
        
        {/* Enhanced HUD */}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          <div className="flex items-center gap-2 bg-black bg-opacity-50 px-3 py-1 rounded">
            <Trophy className="w-5 h-5 text-yellow-400" />
            <span className="text-green-400">Score: {state.score}</span>
          </div>
          <div className="flex items-center gap-2 bg-black bg-opacity-50 px-3 py-1 rounded">
            <Zap className="w-5 h-5 text-blue-400" />
            <span className="text-green-400">Combo: x{state.combo.toFixed(1)}</span>
          </div>
          <div className="flex items-center gap-2 bg-black bg-opacity-50 px-3 py-1 rounded">
            <Wifi className="w-5 h-5 text-green-400" />
            <span className="text-green-400">Level: {state.level}</span>
          </div>
        </div>

        {/* Status Effects */}
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          {state.powerUpActive && (
            <div className="flex items-center gap-2 bg-black bg-opacity-50 px-3 py-1 rounded">
              <Shield className="w-5 h-5 text-blue-400" />
              <span className="text-green-400">Shield Active</span>
            </div>
          )}
          {state.timeSlowActive && (
            <div className="flex items-center gap-2 bg-black bg-opacity-50 px-3 py-1 rounded">
              <Battery className="w-5 h-5 text-yellow-400" />
              <span className="text-green-400">Time Slow</span>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="absolute bottom-4 right-4 flex gap-2">
          <button
            onClick={() => setMuted(m => !m)}
            className="p-2 bg-green-900 rounded hover:bg-green-800 transition-colors"
            type="button"
          >
            {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
          <button
            onClick={() => setPaused(p => !p)}
            className="p-2 bg-green-900 rounded hover:bg-green-800 transition-colors"
            type="button"
          >
            {paused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
          </button>
          <button
            onClick={reset}
            className="p-2 bg-green-900 rounded hover:bg-green-800 transition-colors"
            type="button"
          >
            <RotateCw className="w-5 h-5" />
          </button>
        </div>

        {/* Game Over Screen */}
        {state.gameOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-80">
            <div className="text-center font-mono text-green-500">
              <h2 className="text-2xl mb-4">SYSTEM FAILURE</h2>
              <p className="mb-2">Final Score: {state.score}</p>
              <p className="mb-4">High Score: {state.highScore}</p>
              <button
                onClick={reset}
                className="px-4 py-2 bg-green-500 text-black rounded hover:bg-green-400"
                type="button"
              >
                REBOOT SYSTEM
              </button>
            </div>
          </div>
        )}

        {/* Tutorial */}
        {showTutorial && !state.started && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-80">
            <div className="text-center font-mono text-green-400">
              <h2 className="text-2xl mb-4">MATRIX PROTOCOL</h2>
              <p className="mb-2">Press SPACE to navigate</p>
              <p className="mb-2">P to pause</p>
              <p className="mb-4">Collect power-ups to survive</p>
              <p className="animate-pulse">Click or press SPACE to begin</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Utility function for collision detection remains the same...
[Previous collision detection code remains exactly the same]