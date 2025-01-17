import React from 'react';
import { motion } from 'framer-motion';

interface ScoreBoardProps {
  score: {
    player: number;
    ai: number;
  };
  speed: number;
}

export const ScoreBoard = ({ score, speed }: ScoreBoardProps) => {
  return (
    <motion.div 
      className="w-full flex justify-between items-center font-mono px-2"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex gap-4 md:gap-8">
        <div className="flex flex-col items-center border-2 border-green-500 p-2 md:p-4 rounded-lg bg-black bg-opacity-70">
          <span className="text-xs md:text-sm text-green-500 opacity-70">PLAYER</span>
          <span className="text-2xl md:text-4xl text-green-500 font-bold">{score.player}</span>
        </div>
        <div className="flex flex-col items-center border-2 border-green-500 p-2 md:p-4 rounded-lg bg-black bg-opacity-70">
          <span className="text-xs md:text-sm text-green-500 opacity-70">AI</span>
          <span className="text-2xl md:text-4xl text-green-500 font-bold">{score.ai}</span>
        </div>
      </div>
      <motion.div 
        className="flex items-center gap-2 text-green-500 border-2 border-green-500 p-2 md:p-4 rounded-lg bg-black bg-opacity-70"
        animate={{
          boxShadow: speed > 10 ? [
            '0 0 10px #00ff00',
            '0 0 20px #00ff00',
            '0 0 10px #00ff00'
          ] : 'none'
        }}
        transition={{ duration: 1, repeat: Infinity }}
      >
        <span className="text-xs md:text-sm opacity-70">SPEED</span>
        <span className="text-lg md:text-2xl font-bold">{speed.toFixed(1)}x</span>
      </motion.div>
    </motion.div>
  );
};

export default ScoreBoard;