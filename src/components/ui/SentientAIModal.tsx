import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, Zap } from 'lucide-react';
import { generateAIResponse, getThinkingState } from '../../data/aiResponses';

// ============================================================================
// SENTIENT AI MODAL
// Shows the AI's response when the "Ask Sentient AI" lifeline is used
// ============================================================================

interface SentientAIModalProps {
  isOpen: boolean;
  difficulty: 'easy' | 'medium' | 'hard';
  puzzleType: string;
  answer: string | string[];
  onClose: () => void;
}

export const SentientAIModal: React.FC<SentientAIModalProps> = ({
  isOpen,
  difficulty,
  puzzleType,
  answer,
  onClose
}) => {
  const [stage, setStage] = useState<'thinking' | 'revealing' | 'complete'>('thinking');
  const [thinkingText, setThinkingText] = useState(getThinkingState());
  const [response, setResponse] = useState<{ intro: string; answer: string; outro: string } | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setStage('thinking');
      setResponse(null);
      return;
    }

    // Animate thinking state
    const thinkingInterval = setInterval(() => {
      setThinkingText(getThinkingState());
    }, 600);

    // After 2 seconds, generate and show response
    const revealTimer = setTimeout(() => {
      const aiResponse = generateAIResponse(difficulty, puzzleType, answer);
      setResponse(aiResponse);
      setStage('revealing');
      clearInterval(thinkingInterval);

      // After showing answer for 5 seconds, auto-close
      setTimeout(() => {
        setStage('complete');
        setTimeout(onClose, 500);
      }, 5000);
    }, 2000);

    return () => {
      clearInterval(thinkingInterval);
      clearTimeout(revealTimer);
    };
  }, [isOpen, difficulty, puzzleType, answer, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 50 }}
          className="relative w-full max-w-lg bg-gray-900 border-2 border-cyan-500 rounded-xl shadow-[0_0_50px_rgba(0,255,255,0.4)] overflow-hidden"
        >
          {/* Animated border glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-cyan-500/20 animate-pulse" />

          {/* Header */}
          <div className="relative bg-cyan-900/30 border-b border-cyan-500/50 p-4">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{
                  rotate: stage === 'thinking' ? 360 : 0,
                }}
                transition={{
                  duration: 2,
                  repeat: stage === 'thinking' ? Infinity : 0,
                  ease: 'linear'
                }}
              >
                <Cpu className="w-6 h-6 text-cyan-400" />
              </motion.div>
              <h2 className="text-xl font-mono text-cyan-400 uppercase tracking-wider">
                🤖 Sentient AI
              </h2>
              {stage === 'revealing' && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                >
                  <Zap className="w-5 h-5 text-yellow-400" />
                </motion.div>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="relative p-6 min-h-[200px] flex flex-col justify-center">
            {stage === 'thinking' && (
              <motion.div
                key={thinkingText}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center space-y-4"
              >
                <div className="flex justify-center gap-2">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-3 h-3 rounded-full bg-cyan-400"
                      animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.5, 1, 0.5],
                      }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        delay: i * 0.2,
                      }}
                    />
                  ))}
                </div>
                <p className="text-cyan-300 font-mono text-sm">
                  {thinkingText}
                </p>
                <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 2, ease: 'linear' }}
                  />
                </div>
              </motion.div>
            )}

            {stage === 'revealing' && response && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {/* Intro */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-cyan-300 font-mono text-sm text-center italic"
                >
                  {response.intro}
                </motion.p>

                {/* Answer (highlighted) */}
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.5, type: 'spring' }}
                  className="bg-cyan-900/40 border-2 border-cyan-400 rounded-lg p-4 text-center"
                >
                  <div className="text-xs text-cyan-500 font-mono mb-1">ANSWER:</div>
                  <div className="text-2xl font-mono text-cyan-100 font-bold">
                    {response.answer}
                  </div>
                </motion.div>

                {/* Outro */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="text-cyan-300 font-mono text-sm text-center italic"
                >
                  {response.outro}
                </motion.p>

                {/* Auto-close indicator */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="text-center text-xs text-cyan-500/60 font-mono"
                >
                  Closing in 5 seconds...
                </motion.div>
              </motion.div>
            )}
          </div>

          {/* Footer indicator */}
          <div className="relative bg-cyan-900/20 border-t border-cyan-500/50 p-3">
            <div className="flex justify-center gap-1">
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 rounded-full bg-cyan-400/50"
                  animate={{
                    opacity: [0.3, 1, 0.3],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.3,
                  }}
                />
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
