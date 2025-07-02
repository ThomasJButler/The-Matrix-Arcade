import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  Square,
  Settings,
  Mic,
  MicOff,
  SkipBack,
  SkipForward,
  Zap,
  Brain,
  Radio,
  ChevronDown,
} from 'lucide-react';
import { useAdvancedVoice, VoicePersona } from '../../hooks/useAdvancedVoice';

interface AdvancedVoiceControlsProps {
  text?: string | string[];
  onTextHighlight?: (wordIndex: number) => void;
  className?: string;
}

export const AdvancedVoiceControls: React.FC<AdvancedVoiceControlsProps> = ({
  text,
  onTextHighlight,
  className = '',
}) => {
  const {
    config,
    isSupported,
    isSpeaking,
    isPaused,
    currentWord,
    speechQueue,
    speak,
    stop,
    togglePause,
    updateConfig,
    getVisualizationData,
    personas,
  } = useAdvancedVoice();

  const [isExpanded, setIsExpanded] = useState(false);
  const [showPersonaMenu, setShowPersonaMenu] = useState(false);
  const visualizationRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();

  // Voice visualization
  useEffect(() => {
    if (!config.visualEffects || !isSpeaking) return;

    const updateVisualization = () => {
      const data = getVisualizationData();
      
      // Draw on canvas
      if (visualizationRef.current) {
        const ctx = visualizationRef.current.getContext('2d');
        if (!ctx) return;

        const { width, height } = visualizationRef.current;
        ctx.clearRect(0, 0, width, height);

        // Draw frequency bars
        const barWidth = width / data.frequency.length;
        data.frequency.forEach((value, index) => {
          const barHeight = value * height * 0.8;
          const x = index * barWidth;
          const y = height - barHeight;

          // Gradient based on amplitude
          const gradient = ctx.createLinearGradient(0, y, 0, height);
          gradient.addColorStop(0, `rgba(0, 255, 0, ${0.8 + value * 0.2})`);
          gradient.addColorStop(1, 'rgba(0, 255, 0, 0.2)');

          ctx.fillStyle = gradient;
          ctx.fillRect(x, y, barWidth - 2, barHeight);
        });

        // Draw amplitude wave
        ctx.strokeStyle = `rgba(0, 255, 0, ${0.5 + data.amplitude * 0.5})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        for (let i = 0; i < width; i++) {
          const y = height / 2 + Math.sin((i / width) * Math.PI * 4 + Date.now() / 200) * data.amplitude * height * 0.3;
          if (i === 0) {
            ctx.moveTo(i, y);
          } else {
            ctx.lineTo(i, y);
          }
        }
        
        ctx.stroke();
      }

      animationFrameRef.current = requestAnimationFrame(updateVisualization);
    };

    updateVisualization();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [config.visualEffects, isSpeaking, getVisualizationData]);

  // Update text highlighting
  useEffect(() => {
    if (onTextHighlight && isSpeaking) {
      onTextHighlight(currentWord);
    }
  }, [currentWord, isSpeaking, onTextHighlight]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key.toLowerCase()) {
        case 'v':
          updateConfig({ enabled: !config.enabled });
          break;
        case ' ':
          e.preventDefault();
          if (isSpeaking) {
            togglePause();
          } else if (text) {
            speak(text);
          }
          break;
        case 'escape':
          stop();
          break;
        case 's':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            setIsExpanded(!isExpanded);
          }
          break;
      }

      // Number keys for persona selection
      if (e.key >= '1' && e.key <= '5') {
        const personas: VoicePersona[] = ['captain', 'oracle', 'architect', 'narrator', 'glitch'];
        const index = parseInt(e.key) - 1;
        if (personas[index]) {
          updateConfig({ persona: personas[index] });
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [config.enabled, isSpeaking, text, speak, stop, togglePause, updateConfig, isExpanded]);

  if (!isSupported) {
    return (
      <div className={`bg-red-900/20 border border-red-500/30 rounded-lg p-3 ${className}`}>
        <div className="flex items-center gap-2 text-red-400">
          <MicOff className="w-4 h-4" />
          <span className="text-xs">Advanced voice synthesis not supported</span>
        </div>
      </div>
    );
  }

  const currentPersona = personas[config.persona];

  return (
    <motion.div
      className={`bg-black/90 border border-green-500/30 rounded-lg backdrop-blur-sm ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Main Control Bar */}
      <div className="p-3">
        <div className="flex items-center justify-between gap-3">
          {/* Left: Status and Persona */}
          <div className="flex items-center gap-3 flex-1">
            <div className="flex items-center gap-2">
              <Mic className={`w-4 h-4 ${config.enabled ? 'text-green-400' : 'text-gray-500'}`} />
              <span className="text-sm font-mono text-green-400">VOICE MODE</span>
            </div>

            {/* Persona Selector */}
            <div className="relative">
              <button
                onClick={() => setShowPersonaMenu(!showPersonaMenu)}
                className="flex items-center gap-2 px-3 py-1.5 bg-green-900/30 rounded-lg hover:bg-green-800/30 transition-colors text-sm"
              >
                <Brain className="w-4 h-4 text-green-400" />
                <span className="text-green-300">{currentPersona.name}</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${showPersonaMenu ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {showPersonaMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute bottom-full left-0 mb-2 w-64 max-h-[300px] overflow-y-auto bg-gray-900 border border-green-500/30 rounded-lg shadow-xl z-50 scrollbar-thin scrollbar-thumb-green-600 scrollbar-track-gray-800"
                  >
                    {Object.entries(personas).map(([key, persona]) => (
                      <button
                        key={key}
                        onClick={() => {
                          updateConfig({ persona: key as VoicePersona });
                          setShowPersonaMenu(false);
                        }}
                        className={`w-full text-left px-4 py-3 hover:bg-green-900/30 transition-colors ${
                          config.persona === key ? 'bg-green-900/50' : ''
                        }`}
                      >
                        <div className="font-mono text-sm text-green-400">{persona.name}</div>
                        <div className="text-xs text-gray-400 mt-1">
                          Press {Object.keys(personas).indexOf(key) + 1} to select
                        </div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Speaking Indicator */}
            {isSpeaking && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-2"
              >
                <Radio className="w-4 h-4 text-green-400 animate-pulse" />
                <span className="text-xs text-green-300">
                  {isPaused ? 'PAUSED' : 'SPEAKING...'}
                </span>
              </motion.div>
            )}
          </div>

          {/* Center: Visualization */}
          {config.visualEffects && (
            <div className="hidden md:block">
              <canvas
                ref={visualizationRef}
                width={120}
                height={40}
                className="rounded border border-green-500/20"
                style={{ imageRendering: 'pixelated' }}
              />
            </div>
          )}

          {/* Right: Controls */}
          <div className="flex items-center gap-2">
            {/* Playback Controls */}
            {isSpeaking ? (
              <>
                <button
                  onClick={togglePause}
                  className="p-2 rounded bg-green-900/50 hover:bg-green-800/50 transition-colors"
                  title={isPaused ? 'Resume (Space)' : 'Pause (Space)'}
                >
                  {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                </button>
                <button
                  onClick={stop}
                  className="p-2 rounded bg-red-900/50 hover:bg-red-800/50 transition-colors"
                  title="Stop (Esc)"
                >
                  <Square className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button
                onClick={() => text && speak(text)}
                disabled={!config.enabled || !text}
                className="p-2 rounded bg-green-900/50 hover:bg-green-800/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Play (Space)"
              >
                <Play className="w-4 h-4" />
              </button>
            )}

            {/* Skip Controls */}
            {speechQueue.length > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 bg-blue-900/30 rounded">
                <SkipBack className="w-3 h-3" />
                <span className="text-xs">{speechQueue.length}</span>
                <SkipForward className="w-3 h-3" />
              </div>
            )}

            {/* Toggle Voice */}
            <button
              onClick={() => updateConfig({ enabled: !config.enabled })}
              className={`p-2 rounded transition-colors ${
                config.enabled
                  ? 'bg-green-900/50 text-green-400 hover:bg-green-800/50'
                  : 'bg-gray-900/50 text-gray-500 hover:bg-gray-800/50'
              }`}
              title={config.enabled ? 'Disable Voice (V)' : 'Enable Voice (V)'}
            >
              {config.enabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Settings */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 rounded bg-blue-900/50 hover:bg-blue-800/50 transition-colors"
              title="Settings (Ctrl+S)"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        {isSpeaking && config.highlightText && (
          <div className="mt-2 text-xs text-gray-400">
            Word {currentWord + 1} • Queue: {speechQueue.length}
          </div>
        )}
      </div>

      {/* Expanded Settings Panel */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-green-500/30"
          >
            <div className="p-4 space-y-4">
              {/* Quick Presets */}
              <div className="space-y-2">
                <label className="text-xs text-green-400 font-bold">QUICK PRESETS</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => updateConfig({ rate: 0.7, pitch: 1.2, pauseMultiplier: 3.0 })}
                    className="px-3 py-1.5 bg-purple-900/30 rounded text-xs hover:bg-purple-800/30 transition-colors"
                  >
                    <Zap className="w-3 h-3 inline mr-1" />
                    Dramatic
                  </button>
                  <button
                    onClick={() => updateConfig({ rate: 1.0, pitch: 1.0, pauseMultiplier: 1.5 })}
                    className="px-3 py-1.5 bg-blue-900/30 rounded text-xs hover:bg-blue-800/30 transition-colors"
                  >
                    Normal
                  </button>
                  <button
                    onClick={() => updateConfig({ rate: 1.3, pitch: 1.1, pauseMultiplier: 1.0 })}
                    className="px-3 py-1.5 bg-yellow-900/30 rounded text-xs hover:bg-yellow-800/30 transition-colors"
                  >
                    Fast
                  </button>
                </div>
              </div>

              {/* Voice Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Rate Control */}
                <div className="space-y-2">
                  <label className="text-xs text-green-400 flex items-center justify-between">
                    <span>Speech Rate</span>
                    <span className="text-green-300">{config.rate.toFixed(2)}x</span>
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={config.rate}
                    onChange={(e) => updateConfig({ rate: parseFloat(e.target.value) })}
                    className="slider w-full"
                  />
                </div>

                {/* Pitch Control */}
                <div className="space-y-2">
                  <label className="text-xs text-green-400 flex items-center justify-between">
                    <span>Voice Pitch</span>
                    <span className="text-green-300">{config.pitch.toFixed(2)}</span>
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="1.5"
                    step="0.1"
                    value={config.pitch}
                    onChange={(e) => updateConfig({ pitch: parseFloat(e.target.value) })}
                    className="slider w-full"
                  />
                </div>

                {/* Volume Control */}
                <div className="space-y-2">
                  <label className="text-xs text-green-400 flex items-center justify-between">
                    <span>Volume</span>
                    <span className="text-green-300">{Math.round(config.volume * 100)}%</span>
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.05"
                    value={config.volume}
                    onChange={(e) => updateConfig({ volume: parseFloat(e.target.value) })}
                    className="slider w-full"
                  />
                </div>
              </div>

              {/* Feature Toggles */}
              <div className="space-y-2">
                <label className="text-xs text-green-400 font-bold">FEATURES</label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.autoAdvance}
                      onChange={(e) => updateConfig({ autoAdvance: e.target.checked })}
                      className="text-green-500"
                    />
                    <span className="text-xs">Auto-advance</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.visualEffects}
                      onChange={(e) => updateConfig({ visualEffects: e.target.checked })}
                      className="text-green-500"
                    />
                    <span className="text-xs">Visualization</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.highlightText}
                      onChange={(e) => updateConfig({ highlightText: e.target.checked })}
                      className="text-green-500"
                    />
                    <span className="text-xs">Highlight text</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.ambientSound}
                      onChange={(e) => updateConfig({ ambientSound: e.target.checked })}
                      className="text-green-500"
                    />
                    <span className="text-xs">Ambient sound</span>
                  </label>
                </div>
              </div>

              {/* Keyboard Shortcuts */}
              <div className="text-xs text-gray-400 space-y-1 border-t border-green-500/20 pt-2">
                <div>V - Toggle voice • Space - Play/Pause • Esc - Stop</div>
                <div>1-5 - Select persona • Ctrl+S - Settings</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};