import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, BarChart3, Users } from 'lucide-react';
import {
  getRandomCharacters,
  generateCharacterOpinion,
  generateConsensus,
  type CharacterPersonality
} from '../../data/characterPersonalities';
import { PuzzleData } from './PuzzleModal';

// ============================================================================
// CHARACTER CONVERSATION MODAL
// Shows characters discussing the puzzle answer
// ============================================================================

interface CharacterConversationModalProps {
  isOpen: boolean;
  puzzle: PuzzleData;
  onClose: () => void;
}

interface ConversationLine {
  character: CharacterPersonality;
  opinion: string;
  answer: string;
}

export const CharacterConversationModal: React.FC<CharacterConversationModalProps> = ({
  isOpen,
  puzzle,
  onClose
}) => {
  const [stage, setStage] = useState<'intercepting' | 'conversation' | 'consensus'>('intercepting');
  const [currentLine, setCurrentLine] = useState(0);

  // Generate conversation data
  const conversationData = useMemo(() => {
    if (!isOpen) return null;

    // Get correct answer
    const correctAnswer = Array.isArray(puzzle.answer) ? puzzle.answer[0] : puzzle.answer;

    // For multiple choice, get all options
    let allOptions: string[] = [];
    if (puzzle.type === 'multiple-choice') {
      // Extract options from puzzle (assuming optionA, optionB, etc.)
      const puzzleAny = puzzle as any;
      allOptions = ['A', 'B', 'C', 'D'].filter(opt => puzzleAny[`option${opt}`]);
    } else {
      // For other types, we'll just use correct/incorrect binary
      allOptions = [correctAnswer];
    }

    // Get 4-5 random characters
    const characters = getRandomCharacters(5);

    // Generate consensus percentages
    const consensus = generateConsensus(
      puzzle.type === 'multiple-choice' ? allOptions : [correctAnswer, 'other'],
      correctAnswer
    );

    // Generate conversation lines
    const lines: ConversationLine[] = characters.map((char, index) => {
      // Determine if this character will be right or wrong based on consensus
      const roll = Math.random() * 100;
      let chosenAnswer = correctAnswer;
      let cumulative = 0;

      // Weighted random selection based on consensus percentages
      for (const [ans, percentage] of Object.entries(consensus)) {
        cumulative += percentage;
        if (roll <= cumulative) {
          chosenAnswer = ans;
          break;
        }
      }

      const isCorrect = chosenAnswer === correctAnswer;
      const opinion = generateCharacterOpinion(char, chosenAnswer, isCorrect, puzzle.type);

      return {
        character: char,
        opinion,
        answer: chosenAnswer
      };
    });

    return {
      lines,
      consensus,
      correctAnswer,
      majorityAnswer: Object.entries(consensus).sort((a, b) => b[1] - a[1])[0][0]
    };
  }, [isOpen, puzzle]);

  useEffect(() => {
    if (!isOpen) {
      setStage('intercepting');
      setCurrentLine(0);
      return;
    }

    // Stage 1: Intercepting (1.5s)
    const interceptTimer = setTimeout(() => {
      setStage('conversation');

      // Stage 2: Show conversation lines one by one
      if (conversationData) {
        let lineIndex = 0;
        const lineInterval = setInterval(() => {
          setCurrentLine(lineIndex);
          lineIndex++;

          if (lineIndex >= conversationData.lines.length) {
            clearInterval(lineInterval);

            // Stage 3: Show consensus after all lines
            setTimeout(() => {
              setStage('consensus');

              // Auto-close after 8 seconds
              setTimeout(onClose, 8000);
            }, 1000);
          }
        }, 1200); // Each line appears every 1.2s

        return () => clearInterval(lineInterval);
      }
    }, 1500);

    return () => clearTimeout(interceptTimer);
  }, [isOpen, conversationData, onClose]);

  if (!isOpen || !conversationData) return null;

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
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative w-full max-w-2xl bg-gray-900 border-2 border-green-500 rounded-xl shadow-[0_0_40px_rgba(0,255,0,0.3)] overflow-hidden max-h-[80vh] flex flex-col"
        >
          {/* Header */}
          <div className="bg-green-900/30 border-b border-green-500/50 p-4">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{
                  scale: stage === 'intercepting' ? [1, 1.2, 1] : 1,
                }}
                transition={{
                  duration: 0.5,
                  repeat: stage === 'intercepting' ? Infinity : 0,
                }}
              >
                <Radio className="w-6 h-6 text-green-400" />
              </motion.div>
              <h2 className="text-xl font-mono text-green-400 uppercase tracking-wider">
                📡 Intercepted Team Communication
              </h2>
            </div>
          </div>

          {/* Content */}
          <div className="relative p-6 flex-1 overflow-y-auto">
            {stage === 'intercepting' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center space-y-4 py-8"
              >
                <Users className="w-16 h-16 text-green-400 mx-auto" />
                <p className="text-green-300 font-mono text-lg">
                  Intercepting team communications...
                </p>
                <div className="flex justify-center gap-2">
                  {[0, 1, 2, 3].map((i) => (
                    <motion.div
                      key={i}
                      className="w-2 h-8 bg-green-400 rounded"
                      animate={{
                        scaleY: [0.3, 1, 0.3],
                      }}
                      transition={{
                        duration: 0.8,
                        repeat: Infinity,
                        delay: i * 0.2,
                      }}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {(stage === 'conversation' || stage === 'consensus') && (
              <div className="space-y-3">
                {/* Conversation lines */}
                {conversationData.lines.slice(0, currentLine + 1).map((line, index) => (
                  <motion.div
                    key={index}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex gap-3 items-start"
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-900/50 border border-green-500/50 flex items-center justify-center text-xs font-mono text-green-400">
                      {line.character.name[0]}
                    </div>
                    <div className="flex-1">
                      <div className="text-xs text-green-500/80 font-mono mb-1">
                        {line.character.name}
                      </div>
                      <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-3">
                        <p className="text-green-300 font-mono text-sm">
                          "{line.opinion}"
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}

                {/* Consensus section */}
                {stage === 'consensus' && (
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="mt-6 pt-6 border-t border-green-500/50 space-y-4"
                  >
                    <div className="flex items-center gap-2 justify-center">
                      <BarChart3 className="w-5 h-5 text-green-400" />
                      <h3 className="text-lg font-mono text-green-400 uppercase">
                        Team Consensus
                      </h3>
                    </div>

                    {/* Consensus bars */}
                    <div className="space-y-2">
                      {Object.entries(conversationData.consensus)
                        .sort((a, b) => b[1] - a[1])
                        .map(([answer, percentage]) => {
                          const isHighest = answer === conversationData.majorityAnswer;
                          return (
                            <motion.div
                              key={answer}
                              initial={{ scaleX: 0 }}
                              animate={{ scaleX: 1 }}
                              transition={{ duration: 0.5, delay: 0.2 }}
                              className="space-y-1"
                            >
                              <div className="flex justify-between items-center text-xs font-mono">
                                <span className={isHighest ? 'text-green-300 font-bold' : 'text-green-500/70'}>
                                  {answer}
                                </span>
                                <span className={isHighest ? 'text-green-300 font-bold' : 'text-green-500/70'}>
                                  {percentage}%
                                </span>
                              </div>
                              <div className="w-full bg-gray-800 rounded-full h-6 overflow-hidden">
                                <motion.div
                                  className={`h-full rounded-full ${
                                    isHighest
                                      ? 'bg-gradient-to-r from-green-500 to-green-300'
                                      : 'bg-green-900/50'
                                  }`}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${percentage}%` }}
                                  transition={{ duration: 1, delay: 0.3 }}
                                >
                                  <div className="flex items-center justify-end h-full pr-2">
                                    {isHighest && (
                                      <span className="text-xs font-bold text-white">🎯</span>
                                    )}
                                  </div>
                                </motion.div>
                              </div>
                            </motion.div>
                          );
                        })}
                    </div>

                    {/* Majority verdict */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1 }}
                      className="text-center mt-4 p-3 bg-green-900/30 border border-green-500/50 rounded-lg"
                    >
                      <p className="text-green-400 font-mono text-sm">
                        Most characters agree on:{' '}
                        <span className="font-bold text-green-300">{conversationData.majorityAnswer}</span>
                      </p>
                    </motion.div>

                    {/* Auto-close indicator */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1.5 }}
                      className="text-center text-xs text-green-500/60 font-mono mt-4"
                    >
                      Closing in 8 seconds...
                    </motion.div>
                  </motion.div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
