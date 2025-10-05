import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Volume2, 
  VolumeX, 
  Music, 
  Volume1, 
  Settings, 
  X,
  Play
} from 'lucide-react';
import { useSoundSystem, SoundConfig } from '../../hooks/useSoundSystem';

interface AudioSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  compact?: boolean;
  isMuted?: boolean;
  toggleMute?: () => void;
}

export const AudioSettings: React.FC<AudioSettingsProps> = ({
  isOpen,
  onClose,
  compact = false,
  isMuted = false,
  toggleMute
}) => {
  const { config, updateConfig, playSFX, playMusic, stopMusic } = useSoundSystem();
  const [testingSound, setTestingSound] = useState<string | null>(null);

  const handleVolumeChange = (key: keyof SoundConfig, value: number) => {
    updateConfig({ [key]: value });
  };

  const handleToggle = (key: keyof SoundConfig) => {
    updateConfig({ [key]: !config[key] });
  };

  const testSound = (soundType: string) => {
    setTestingSound(soundType);
    playSFX(soundType);
    setTimeout(() => setTestingSound(null), 300);
  };

  const testMusic = () => {
    if (config.music) {
      playMusic('menu');
      setTimeout(() => stopMusic(), 3000);
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => handleToggle('sfx')}
          className={`p-2 rounded transition-colors ${
            config.sfx 
              ? 'bg-green-900 text-green-400 hover:bg-green-800' 
              : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
          }`}
          title="Toggle Sound Effects"
        >
          {config.sfx ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>
        
        <button
          onClick={() => handleToggle('music')}
          className={`p-2 rounded transition-colors ${
            config.music 
              ? 'bg-green-900 text-green-400 hover:bg-green-800' 
              : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
          }`}
          title="Toggle Music"
        >
          <Music className={`w-4 h-4 ${config.music ? 'text-green-400' : 'text-gray-400'}`} />
        </button>
      </div>
    );
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="bg-gray-900 border-2 border-green-500 rounded-lg p-6 max-w-md w-full font-mono"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-green-400" />
                <h2 className="text-lg font-bold text-green-400">AUDIO SETTINGS</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-green-900 rounded transition-colors"
              >
                <X className="w-5 h-5 text-green-400" />
              </button>
            </div>

            {/* Master Mute Toggle - Prominent at Top */}
            {toggleMute && (
              <div className="mb-6">
                <button
                  onClick={toggleMute}
                  className={`w-full py-3 px-4 rounded-lg transition-all border-2 flex items-center justify-center gap-3 font-mono font-bold text-lg ${
                    isMuted
                      ? 'bg-red-600 hover:bg-red-500 border-red-400 text-white animate-pulse-red'
                      : 'bg-green-600 hover:bg-green-500 border-green-400 text-white'
                  }`}
                  title="Toggle Master Mute (V)"
                >
                  {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                  <span>{isMuted ? 'SOUND MUTED' : 'SOUND ON'}</span>
                </button>
                <div className="text-center text-xs text-gray-400 mt-2">
                  Press V to quickly toggle mute
                </div>
              </div>
            )}

            {/* Master Volume */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label className="text-green-400 flex items-center gap-2">
                  <Volume1 className="w-4 h-4" />
                  MASTER VOLUME
                </label>
                <span className="text-white">{Math.round(config.masterVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={config.masterVolume}
                onChange={(e) => handleVolumeChange('masterVolume', Number(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>

            {/* Music Settings */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label className="text-green-400 flex items-center gap-2">
                  <Music className="w-4 h-4" />
                  BACKGROUND MUSIC
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={testMusic}
                    className="p-1 hover:bg-green-900 rounded transition-colors"
                    title="Test Music"
                  >
                    <Play className="w-3 h-3 text-green-400" />
                  </button>
                  <button
                    onClick={() => handleToggle('music')}
                    className={`px-3 py-1 rounded text-xs transition-colors ${
                      config.music 
                        ? 'bg-green-600 text-white' 
                        : 'bg-gray-600 text-gray-300'
                    }`}
                  >
                    {config.music ? 'ON' : 'OFF'}
                  </button>
                </div>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={config.musicVolume}
                onChange={(e) => handleVolumeChange('musicVolume', Number(e.target.value))}
                disabled={!config.music}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="text-right text-xs text-gray-400 mt-1">
                {Math.round(config.musicVolume * 100)}%
              </div>
            </div>

            {/* SFX Settings */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label className="text-green-400 flex items-center gap-2">
                  <Volume2 className="w-4 h-4" />
                  SOUND EFFECTS
                </label>
                <button
                  onClick={() => handleToggle('sfx')}
                  className={`px-3 py-1 rounded text-xs transition-colors ${
                    config.sfx 
                      ? 'bg-green-600 text-white' 
                      : 'bg-gray-600 text-gray-300'
                  }`}
                >
                  {config.sfx ? 'ON' : 'OFF'}
                </button>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={config.sfxVolume}
                onChange={(e) => handleVolumeChange('sfxVolume', Number(e.target.value))}
                disabled={!config.sfx}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="text-right text-xs text-gray-400 mt-1">
                {Math.round(config.sfxVolume * 100)}%
              </div>
            </div>

            {/* Sound Test Grid */}
            <div className="mb-6">
              <h3 className="text-green-400 text-sm mb-3">SOUND TEST</h3>
              <div className="grid grid-cols-2 gap-2">
                {['jump', 'hit', 'score', 'powerup', 'levelUp', 'combo'].map((sound) => (
                  <button
                    key={sound}
                    onClick={() => testSound(sound)}
                    disabled={!config.sfx || testingSound === sound}
                    className={`p-2 text-xs rounded transition-all ${
                      testingSound === sound
                        ? 'bg-green-600 text-white scale-95'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    } disabled:opacity-50`}
                  >
                    {testingSound === sound ? 'PLAYING...' : sound.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Matrix-themed divider */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex-1 h-px bg-green-500/30"></div>
              <span className="text-green-500 text-xs">MATRIX AUDIO v2.0</span>
              <div className="flex-1 h-px bg-green-500/30"></div>
            </div>

            {/* Info Text */}
            <div className="text-xs text-gray-400 text-center">
              Advanced Web Audio API synthesis<br />
              No external audio files required
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AudioSettings;