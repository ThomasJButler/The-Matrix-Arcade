import React from 'react';
import { motion } from 'framer-motion';

interface GameOverModalProps {
  score: {
    player: number;
    ai: number;
  };
  onRestart: () => void;
}

export const GameOverModal = ({ score, onRestart }: GameOverModalProps) => {
  const isWinner = score.player > score.ai;

  return (
    <motion.div
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-90 z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-black border-2 border-green-500 p-8 rounded-lg text-center font-mono"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0 }}
        transition={{ type: "spring", damping: 15 }}
      >
        <motion.h2 
          className={`text-4xl mb-6 ${isWinner ? 'text-green-500' : 'text-red-500'}`}
          animate={{ 
            textShadow: [
              '0 0 8px currentColor',
              '0 0 16px currentColor',
              '0 0 8px currentColor'
            ]
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {isWinner ? 'YOU WIN!' : 'GAME OVER'}
        </motion.h2>
        
        <div className="text-green-500 text-2xl mb-8">
          <div className="mb-2">FINAL SCORE</div>
          <div className="flex justify-center gap-8">
            <div>
              <div className="text-sm opacity-70">PLAYER</div>
              <div className="text-3xl">{score.player}</div>
            </div>
            <div>
              <div className="text-sm opacity-70">AI</div>
              <div className="text-3xl">{score.ai}</div>
            </div>
          </div>
        </div>

        <motion.button
          className="px-8 py-4 bg-green-500 text-black rounded-lg font-bold text-xl hover:bg-green-400 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onRestart}
        >
          PLAY AGAIN
        </motion.button>
      </motion.div>
    </motion.div>
  );
};


export default GameOverModal;