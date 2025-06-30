import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Volume2, 
  VolumeX, 
  Square, 
  Settings, 
  TestTube,
  Mic
} from 'lucide-react';
import { useShatnerVoice } from '../../hooks/useShatnerVoice';

interface ShatnerVoiceControlsProps {
  isExpanded?: boolean;
  onToggleExpanded?: () => void;
  className?: string;
}

export const ShatnerVoiceControls: React.FC<ShatnerVoiceControlsProps> = ({ 
  isExpanded = false, 
  onToggleExpanded,
  className = ""
}) => {
  const { 
    config, 
    updateConfig, 
    speak, 
    stop, 
    testVoice, 
    isSupported, 
    isSpeaking 
  } = useShatnerVoice();

  if (!isSupported) {
    return (
      <div className={`bg-red-900/20 border border-red-500/30 rounded-lg p-3 ${className}`}>
        <div className="flex items-center gap-2 text-red-400">
          <VolumeX className="w-4 h-4" />
          <span className="text-xs">Speech synthesis not supported in this browser</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-black/50 border border-green-500/30 rounded-lg overflow-hidden ${className}`}>
      {/* Main Control Bar */}
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Mic className={`w-4 h-4 ${config.enabled ? 'text-green-400' : 'text-gray-500'}`} />
            <span className="text-sm font-mono text-green-400">SHATNER VOICE</span>
          </div>
          
          {isSpeaking && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-1"
            >
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-xs text-green-300">Speaking...</span>
            </motion.div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Toggle */}
          <button
            onClick={() => updateConfig({ enabled: !config.enabled })}
            className={`p-1.5 rounded transition-colors ${
              config.enabled 
                ? 'bg-green-900/50 text-green-400 hover:bg-green-800/50' 
                : 'bg-gray-900/50 text-gray-500 hover:bg-gray-800/50'
            }`}
            title={config.enabled ? 'Disable Shatner Voice' : 'Enable Shatner Voice'}
          >
            {config.enabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Stop Speaking */}
          {isSpeaking && (
            <button
              onClick={stop}
              className="p-1.5 rounded bg-red-900/50 text-red-400 hover:bg-red-800/50 transition-colors"
              title="Stop Speaking"
            >
              <Square className="w-4 h-4" />
            </button>
          )}

          {/* Test Voice */}
          <button
            onClick={testVoice}
            disabled={!config.enabled || isSpeaking}
            className="p-1.5 rounded bg-yellow-900/50 text-yellow-400 hover:bg-yellow-800/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Test Shatner Voice"
          >
            <TestTube className="w-4 h-4" />
          </button>

          {/* Expand Settings */}
          {onToggleExpanded && (
            <button
              onClick={onToggleExpanded}
              className="p-1.5 rounded bg-blue-900/50 text-blue-400 hover:bg-blue-800/50 transition-colors"
              title="Voice Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Expanded Settings */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-green-500/30"
          >
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 gap-4">
                {/* Rate Control */}
                <div className="space-y-2">
                  <label className="text-xs text-green-400 flex items-center justify-between">
                    <span>Speech Rate (Shatner Pace)</span>
                    <span className="text-green-300">{config.rate.toFixed(2)}x</span>
                  </label>
                  <input
                    type="range"
                    min="0.3"
                    max="1.5"
                    step="0.05"
                    value={config.rate}
                    onChange={(e) => updateConfig({ rate: parseFloat(e.target.value) })}
                    className="slider w-full"
                  />
                  <div className="text-xs text-gray-400">Slower = More dramatic</div>
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
                    step="0.05"
                    value={config.pitch}
                    onChange={(e) => updateConfig({ pitch: parseFloat(e.target.value) })}
                    className="slider w-full"
                  />
                  <div className="text-xs text-gray-400">Lower = More commanding</div>
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

                {/* Pause Multiplier */}
                <div className="space-y-2">
                  <label className="text-xs text-green-400 flex items-center justify-between">
                    <span>Dramatic Pauses</span>
                    <span className="text-green-300">{config.pauseMultiplier.toFixed(1)}x</span>
                  </label>
                  <input
                    type="range"
                    min="1.0"
                    max="4.0"
                    step="0.1"
                    value={config.pauseMultiplier}
                    onChange={(e) => updateConfig({ pauseMultiplier: parseFloat(e.target.value) })}
                    className="slider w-full"
                  />
                  <div className="text-xs text-gray-400">Higher = More dramatic pauses</div>
                </div>
              </div>

              {/* Test Phrases */}
              <div className="space-y-2">
                <div className="text-xs text-green-400 font-bold">Test Phrases:</div>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    "The Production Bug... from Hell!",
                    "Friday afternoon... deployment... disaster!",
                    "Debug... the world... save... humanity!"
                  ].map((phrase, index) => (
                    <button
                      key={index}
                      onClick={() => speak(phrase)}
                      disabled={!config.enabled || isSpeaking}
                      className="text-left text-xs p-2 bg-green-900/20 hover:bg-green-900/40 rounded border border-green-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      "{phrase}"
                    </button>
                  ))}
                </div>
              </div>

              {/* Reset Button */}
              <button
                onClick={() => {
                  updateConfig({
                    rate: 0.85,
                    pitch: 0.9,
                    volume: 0.8,
                    pauseMultiplier: 2.0,
                    emphasisBoost: 1.3
                  });
                }}
                className="w-full text-xs p-2 bg-yellow-900/30 text-yellow-400 hover:bg-yellow-900/50 rounded border border-yellow-500/30 transition-colors"
              >
                Reset to Shatner Defaults
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};