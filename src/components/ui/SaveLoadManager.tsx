import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Save, 
  Download, 
  Upload, 
  Trash2, 
  RotateCcw, 
  Trophy, 
  Clock, 
  X,
  AlertTriangle,
  CheckCircle,
  FileText,
  Settings
} from 'lucide-react';
import { useSaveSystem } from '../../hooks/useSaveSystem';

interface SaveLoadManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SaveLoadManager: React.FC<SaveLoadManagerProps> = ({ isOpen, onClose }) => {
  const {
    saveData,
    isLoading,
    error,
    exportSaveData,
    importSaveData,
    clearSaveData,
    restoreFromBackup,
    saveNow,
    getGameAchievements
  } = useSaveSystem();

  const [confirmingClear, setConfirmingClear] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const success = exportSaveData();
    if (success) {
      // Could add a toast notification here
      console.log('Save data exported successfully');
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    const success = await importSaveData(file);
    setImporting(false);
    
    if (success) {
      console.log('Save data imported successfully');
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClearData = () => {
    if (confirmingClear) {
      clearSaveData();
      setConfirmingClear(false);
    } else {
      setConfirmingClear(true);
      setTimeout(() => setConfirmingClear(false), 5000);
    }
  };

  const formatPlayTime = (milliseconds: number) => {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const getGameDisplayName = (gameId: string) => {
    const names: Record<string, string> = {
      snakeClassic: 'Snake Classic',
      vortexPong: 'Vortex Pong',
      matrixCloud: 'Matrix Cloud',
      ctrlSWorld: 'CTRL-S | The World',
      metris: 'Metris',
      matrixInvaders: 'Matrix Invaders'
    };
    return names[gameId] || gameId;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
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
          className="bg-gray-900 border-2 border-green-500 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto font-mono"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-green-500/30">
            <div className="flex items-center gap-3">
              <Save className="w-6 h-6 text-green-400" />
              <h2 className="text-xl font-bold text-green-400">SAVE DATA MANAGER</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-green-900 rounded transition-colors"
            >
              <X className="w-5 h-5 text-green-400" />
            </button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="m-4 p-3 bg-red-900/50 border border-red-500 rounded flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <span className="text-red-400 text-sm">{error}</span>
            </div>
          )}

          {/* Loading State */}
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-green-400">Loading save data...</p>
            </div>
          ) : (
            <div className="p-6 space-y-6">
              {/* Quick Actions */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button
                  onClick={saveNow}
                  className="flex items-center justify-center gap-2 p-3 bg-green-900/50 hover:bg-green-800 border border-green-500/30 rounded transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span className="text-sm">Save Now</span>
                </button>
                
                <button
                  onClick={handleExport}
                  className="flex items-center justify-center gap-2 p-3 bg-blue-900/50 hover:bg-blue-800 border border-blue-500/30 rounded transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span className="text-sm">Export</span>
                </button>
                
                <label className="flex items-center justify-center gap-2 p-3 bg-purple-900/50 hover:bg-purple-800 border border-purple-500/30 rounded transition-colors cursor-pointer">
                  <Upload className="w-4 h-4" />
                  <span className="text-sm">{importing ? 'Importing...' : 'Import'}</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleImport}
                    className="hidden"
                    disabled={importing}
                  />
                </label>
                
                <button
                  onClick={handleClearData}
                  className={`flex items-center justify-center gap-2 p-3 border rounded transition-colors ${
                    confirmingClear 
                      ? 'bg-red-900/70 border-red-500 text-red-400' 
                      : 'bg-red-900/50 hover:bg-red-800 border-red-500/30'
                  }`}
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="text-sm">{confirmingClear ? 'Confirm?' : 'Clear All'}</span>
                </button>
              </div>

              {/* Global Stats */}
              <div className="bg-black/50 border border-green-500/30 rounded-lg p-4">
                <h3 className="text-green-400 font-bold mb-4 flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  GLOBAL STATISTICS
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-gray-400">Total Play Time</div>
                    <div className="text-green-400 font-bold">
                      {formatPlayTime(saveData.globalStats.totalPlayTime)}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400">First Played</div>
                    <div className="text-green-400 font-bold">
                      {formatDate(saveData.globalStats.firstPlayDate)}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400">Favorite Game</div>
                    <div className="text-green-400 font-bold">
                      {saveData.globalStats.favoriteGame || 'None yet'}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400">Global Achievements</div>
                    <div className="text-green-400 font-bold">
                      {saveData.globalStats.globalAchievements.length}
                    </div>
                  </div>
                </div>
              </div>

              {/* Game Progress */}
              <div className="space-y-4">
                <h3 className="text-green-400 font-bold flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  GAME PROGRESS
                </h3>
                
                <div className="grid gap-4">
                  {Object.entries(saveData.games).map(([gameId, gameData]) => (
                    <div key={gameId} className="bg-black/50 border border-green-500/30 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-green-400 font-bold">{getGameDisplayName(gameId)}</h4>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <Clock className="w-3 h-3" />
                          Last played: {formatDate(gameData.lastPlayed)}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="text-gray-400">High Score</div>
                          <div className="text-green-400 font-bold">{gameData.highScore.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-gray-400">Level</div>
                          <div className="text-green-400 font-bold">{gameData.level}</div>
                        </div>
                        <div>
                          <div className="text-gray-400">Games Played</div>
                          <div className="text-green-400 font-bold">{gameData.stats.gamesPlayed}</div>
                        </div>
                        <div>
                          <div className="text-gray-400">Achievements</div>
                          <div className="text-green-400 font-bold">
                            {gameData.achievements.length} / {getGameAchievements(gameId as GameId).length}
                          </div>
                        </div>
                      </div>

                      {/* Achievement Progress */}
                      {gameData.achievements.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-green-500/20">
                          <div className="text-xs text-gray-400 mb-2">Recent Achievements:</div>
                          <div className="flex flex-wrap gap-1">
                            {gameData.achievements.slice(-3).map((achievement, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-green-900/30 border border-green-500/50 rounded text-xs"
                              >
                                {achievement.replace('_', ' ').toUpperCase()}
                              </span>
                            ))}
                            {gameData.achievements.length > 3 && (
                              <span className="px-2 py-1 bg-gray-700 rounded text-xs">
                                +{gameData.achievements.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Backup Options */}
              <div className="bg-black/50 border border-yellow-500/30 rounded-lg p-4">
                <h3 className="text-yellow-400 font-bold mb-4 flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  BACKUP & RECOVERY
                </h3>
                <div className="flex flex-wrap gap-4 text-sm">
                  <button
                    onClick={restoreFromBackup}
                    className="flex items-center gap-2 px-3 py-2 bg-yellow-900/50 hover:bg-yellow-800 border border-yellow-500/30 rounded transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Restore Backup
                  </button>
                  
                  <div className="flex items-center gap-2 text-gray-400">
                    <CheckCircle className="w-4 h-4" />
                    Auto-save: {saveData.settings.autoSave ? 'Enabled' : 'Disabled'}
                  </div>
                  
                  {saveData.settings.lastBackupDate && (
                    <div className="flex items-center gap-2 text-gray-400">
                      <Clock className="w-4 h-4" />
                      Last backup: {formatDate(saveData.settings.lastBackupDate)}
                    </div>
                  )}
                </div>
              </div>

              {/* Matrix-themed divider */}
              <div className="flex items-center gap-2">
                <div className="flex-1 h-px bg-green-500/30"></div>
                <span className="text-green-500 text-xs">SAVE DATA v{saveData.version}</span>
                <div className="flex-1 h-px bg-green-500/30"></div>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SaveLoadManager;