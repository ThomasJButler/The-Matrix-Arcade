import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, X, Coffee, FileText, Clock, Key, Award, Sparkles } from 'lucide-react';
import { useGameState, GameItem } from '../../contexts/GameStateContext';

// ============================================================================
// INVENTORY PANEL COMPONENT
// Slide-out drawer showing collected items
// ============================================================================

interface ItemCardProps {
  item: GameItem;
  onUse?: (itemId: string) => void;
  isNew?: boolean;
}

const ItemCard: React.FC<ItemCardProps> = ({ item, onUse, isNew }) => {
  // Get icon based on item type
  const getIcon = () => {
    const iconClass = "w-8 h-8";
    switch (item.type) {
      case 'quest':
        return <Key className={iconClass} />;
      case 'consumable':
        return <Coffee className={iconClass} />;
      case 'collectible':
        return <Award className={iconClass} />;
      case 'special':
        return <Sparkles className={iconClass} />;
      default:
        return <FileText className={iconClass} />;
    }
  };

  // Get border color based on type
  const getBorderColor = () => {
    switch (item.type) {
      case 'quest':
        return 'border-yellow-500 bg-yellow-900/20';
      case 'consumable':
        return 'border-green-500 bg-green-900/20';
      case 'collectible':
        return 'border-blue-500 bg-blue-900/20';
      case 'special':
        return 'border-purple-500 bg-purple-900/20';
      default:
        return 'border-gray-500 bg-gray-900/20';
    }
  };

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`
        relative p-3 rounded-lg border-2 ${getBorderColor()}
        hover:scale-105 transition-transform cursor-pointer group
      `}
    >
      {/* New badge */}
      {isNew && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-pulse"
        >
          !
        </motion.div>
      )}

      {/* Icon */}
      <div className="flex justify-center mb-2 text-green-400">
        {getIcon()}
      </div>

      {/* Name */}
      <div className="text-sm font-bold text-green-100 text-center mb-1 font-mono">
        {item.name}
      </div>

      {/* Description */}
      <div className="text-xs text-green-300/70 text-center leading-relaxed min-h-[2.5rem]">
        {item.description}
      </div>

      {/* Quantity */}
      {item.quantity > 1 && (
        <div className="absolute top-2 right-2 bg-black/80 text-green-400 text-xs font-mono px-1.5 py-0.5 rounded border border-green-500/50">
          x{item.quantity}
        </div>
      )}

      {/* Use button */}
      {item.usable && onUse && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onUse(item.id)}
          className="w-full mt-2 py-1.5 px-3 bg-green-600 hover:bg-green-500 text-white text-xs font-mono rounded transition-colors"
        >
          USE
        </motion.button>
      )}

      {/* Hover tooltip */}
      <div className="absolute hidden group-hover:block bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-10 max-w-xs pointer-events-none">
        <div className="bg-gray-900 border-2 border-green-500 rounded-lg p-3 text-xs text-green-300 shadow-lg">
          <div className="font-bold text-green-100 mb-1">{item.name}</div>
          <div className="mb-1">{item.description}</div>
          {item.effect && (
            <div className="text-yellow-400">Effect: {item.effect}</div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

interface InventoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InventoryPanel: React.FC<InventoryPanelProps> = ({ isOpen, onClose }) => {
  const gameState = useGameState();
  const [viewedItems, setViewedItems] = useState<Set<string>>(new Set());

  // Mark items as viewed when panel opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        setViewedItems(new Set(gameState.state.inventory.map(item => item.id)));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, gameState.state.inventory]);

  // Handle item use
  const handleUseItem = (itemId: string) => {
    gameState.useItem(itemId);
  };

  // Group items by type
  const questItems = gameState.state.inventory.filter(item => item.type === 'quest');
  const consumables = gameState.state.inventory.filter(item => item.type === 'consumable');
  const collectibles = gameState.state.inventory.filter(item => item.type === 'collectible');
  const specials = gameState.state.inventory.filter(item => item.type === 'special');

  const isEmpty = gameState.state.inventory.length === 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed left-0 top-0 bottom-0 w-80 bg-gray-900 border-r-2 border-green-500 shadow-[0_0_30px_rgba(0,255,0,0.3)] z-50 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="bg-green-900/20 border-b border-green-500/50 p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="w-6 h-6 text-green-400" />
                <h2 className="text-xl font-mono text-green-400 uppercase tracking-wider">
                  Inventory
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-1 hover:bg-red-900/50 rounded transition-colors text-red-400"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {isEmpty ? (
                /* Empty State */
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <Package className="w-16 h-16 text-green-500/30 mb-4" />
                  <p className="text-green-400/70 font-mono mb-2">
                    No items collected yet
                  </p>
                  <p className="text-green-500/50 text-sm max-w-xs">
                    Solve puzzles and complete challenges to collect items
                  </p>
                </div>
              ) : (
                <>
                  {/* Quest Items */}
                  {questItems.length > 0 && (
                    <div>
                      <h3 className="text-sm font-mono text-yellow-400 mb-3 uppercase tracking-wider flex items-center gap-2">
                        <Key className="w-4 h-4" />
                        Quest Items ({questItems.length})
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        {questItems.map(item => (
                          <ItemCard
                            key={item.id}
                            item={item}
                            onUse={handleUseItem}
                            isNew={!viewedItems.has(item.id)}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Consumables */}
                  {consumables.length > 0 && (
                    <div>
                      <h3 className="text-sm font-mono text-green-400 mb-3 uppercase tracking-wider flex items-center gap-2">
                        <Coffee className="w-4 h-4" />
                        Consumables ({consumables.length})
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        {consumables.map(item => (
                          <ItemCard
                            key={item.id}
                            item={item}
                            onUse={handleUseItem}
                            isNew={!viewedItems.has(item.id)}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Collectibles */}
                  {collectibles.length > 0 && (
                    <div>
                      <h3 className="text-sm font-mono text-blue-400 mb-3 uppercase tracking-wider flex items-center gap-2">
                        <Award className="w-4 h-4" />
                        Collectibles ({collectibles.length})
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        {collectibles.map(item => (
                          <ItemCard
                            key={item.id}
                            item={item}
                            isNew={!viewedItems.has(item.id)}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Special Items */}
                  {specials.length > 0 && (
                    <div>
                      <h3 className="text-sm font-mono text-purple-400 mb-3 uppercase tracking-wider flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        Special ({specials.length})
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        {specials.map(item => (
                          <ItemCard
                            key={item.id}
                            item={item}
                            isNew={!viewedItems.has(item.id)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="bg-green-900/20 border-t border-green-500/50 p-3 text-center">
              <div className="text-xs text-green-400/70 font-mono">
                Press <kbd className="px-2 py-1 bg-green-900/50 rounded border border-green-500/50">I</kbd> to toggle
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default InventoryPanel;
