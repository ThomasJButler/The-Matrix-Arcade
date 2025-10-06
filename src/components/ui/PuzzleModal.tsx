import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, HelpCircle, Clock, Lightbulb, CheckCircle, XCircle } from 'lucide-react';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface PuzzleData {
  id: string;
  type: 'code' | 'riddle' | 'multiple-choice' | 'typing';
  question: string;
  answer: string | string[];
  hints: string[];
  timeLimit?: number;
  points: number;
  difficulty: 'easy' | 'medium' | 'hard';
  context?: string;
}

interface PuzzleModalProps {
  isOpen: boolean;
  puzzle: PuzzleData;
  onClose: () => void;
  onComplete: (success: boolean, hintsUsed: number) => void;
  playSFX?: (sound: string) => void;
}

// ============================================================================
// PUZZLE MODAL COMPONENT
// ============================================================================

export const PuzzleModal: React.FC<PuzzleModalProps> = ({
  isOpen,
  puzzle,
  onClose,
  onComplete,
  playSFX
}) => {
  const [userAnswer, setUserAnswer] = useState('');
  const [currentHint, setCurrentHint] = useState(-1);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(puzzle.timeLimit || 0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<'correct' | 'incorrect' | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset state when puzzle changes
  useEffect(() => {
    if (isOpen) {
      setUserAnswer('');
      setCurrentHint(-1);
      setHintsUsed(0);
      setTimeRemaining(puzzle.timeLimit || 0);
      setIsSubmitting(false);
      setResult(null);

      // Focus input after modal opens
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, puzzle]);

  // Timer countdown
  useEffect(() => {
    if (!isOpen || !puzzle.timeLimit || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          // Time's up!
          handleSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, puzzle.timeLimit, timeRemaining]);

  // Show next hint
  const showHint = () => {
    if (currentHint < puzzle.hints.length - 1) {
      setCurrentHint(prev => prev + 1);
      setHintsUsed(prev => prev + 1);
      playSFX?.('menu');
    }
  };

  // Check if answer is correct
  const checkAnswer = (answer: string): boolean => {
    const normalizedAnswer = answer.toLowerCase().trim();

    if (Array.isArray(puzzle.answer)) {
      return puzzle.answer.some(a =>
        a.toLowerCase().trim() === normalizedAnswer
      );
    }

    return puzzle.answer.toLowerCase().trim() === normalizedAnswer;
  };

  // Handle answer submission
  const handleSubmit = (timedOut: boolean = false) => {
    if (isSubmitting) return;

    setIsSubmitting(true);

    const isCorrect = !timedOut && checkAnswer(userAnswer);
    setResult(isCorrect ? 'correct' : 'incorrect');

    playSFX?.(isCorrect ? 'score' : 'death');

    // Show result for 2 seconds, then close
    setTimeout(() => {
      onComplete(isCorrect, hintsUsed);
      onClose();
    }, 2000);
  };

  // Handle Enter key
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && userAnswer.trim() && !isSubmitting) {
      handleSubmit();
    }
  };

  // Render multiple choice options
  const renderMultipleChoice = () => {
    if (puzzle.type !== 'multiple-choice' || !Array.isArray(puzzle.answer)) {
      return null;
    }

    const options = ['A', 'B', 'C', 'D'];

    return (
      <div className="space-y-2">
        {options.map((option, index) => (
          <button
            key={option}
            onClick={() => {
              if (!isSubmitting) {
                setUserAnswer(option);
                // Auto-submit for multiple choice
                setTimeout(() => handleSubmit(), 300);
              }
            }}
            disabled={isSubmitting}
            className={`w-full p-3 text-left rounded-lg border-2 transition-all ${
              userAnswer === option
                ? 'border-green-400 bg-green-900/30'
                : 'border-green-500/30 bg-black/50 hover:border-green-400 hover:bg-green-900/20'
            } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span className="font-mono text-green-400">{option})</span>{' '}
            <span className="text-green-100">
              {(puzzle as any)[`option${option}`] || `Option ${option}`}
            </span>
          </button>
        ))}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={() => !isSubmitting && onClose()}
        />

        {/* Modal */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative w-full max-w-2xl bg-gray-900 border-2 border-green-500 rounded-xl shadow-[0_0_30px_rgba(0,255,0,0.3)] overflow-hidden"
        >
          {/* Header */}
          <div className="bg-green-900/20 border-b border-green-500/50 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <h2 className="text-xl font-mono text-green-400 uppercase tracking-wider">
                {puzzle.type.replace('-', ' ')} Challenge
              </h2>
              <span className={`px-2 py-1 rounded text-xs font-mono ${
                puzzle.difficulty === 'easy' ? 'bg-green-900/50 text-green-400' :
                puzzle.difficulty === 'medium' ? 'bg-yellow-900/50 text-yellow-400' :
                'bg-red-900/50 text-red-400'
              }`}>
                {puzzle.difficulty.toUpperCase()}
              </span>
            </div>

            <div className="flex items-center gap-4">
              {puzzle.timeLimit && (
                <div className={`flex items-center gap-2 ${
                  timeRemaining <= 10 ? 'text-red-400 animate-pulse' : 'text-green-400'
                }`}>
                  <Clock className="w-5 h-5" />
                  <span className="font-mono font-bold">{timeRemaining}s</span>
                </div>
              )}

              <button
                onClick={onClose}
                disabled={isSubmitting}
                className="p-1 hover:bg-red-900/50 rounded transition-colors disabled:opacity-50"
              >
                <X className="w-6 h-6 text-red-400" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Context */}
            {puzzle.context && (
              <div className="bg-black/50 border border-green-500/30 rounded-lg p-4">
                <p className="text-green-300 font-mono text-sm leading-relaxed">
                  {puzzle.context}
                </p>
              </div>
            )}

            {/* Question */}
            <div className="bg-green-900/10 border-l-4 border-green-500 p-4">
              <p className="text-green-100 font-mono text-lg leading-relaxed">
                {puzzle.question}
              </p>
            </div>

            {/* Answer Input or Multiple Choice */}
            {puzzle.type === 'multiple-choice' ? (
              renderMultipleChoice()
            ) : (
              <div className="space-y-2">
                <label className="block text-green-400 font-mono text-sm">
                  Your Answer:
                </label>
                <input
                  ref={inputRef}
                  type="text"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isSubmitting}
                  placeholder="Type your answer here..."
                  className="w-full px-4 py-3 bg-black border-2 border-green-500/50 rounded-lg text-green-100 font-mono focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            )}

            {/* Hints */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-green-400">
                  <Lightbulb className="w-5 h-5" />
                  <span className="font-mono text-sm">
                    Hints ({hintsUsed}/{puzzle.hints.length})
                  </span>
                </div>

                {currentHint < puzzle.hints.length - 1 && (
                  <button
                    onClick={showHint}
                    disabled={isSubmitting}
                    className="px-3 py-1 bg-yellow-900/50 hover:bg-yellow-900/70 border border-yellow-500/50 rounded text-yellow-400 font-mono text-sm transition-colors disabled:opacity-50"
                  >
                    <HelpCircle className="w-4 h-4 inline mr-1" />
                    Show Hint
                  </button>
                )}
              </div>

              {currentHint >= 0 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-3"
                >
                  <p className="text-yellow-200 font-mono text-sm">
                    💡 {puzzle.hints[currentHint]}
                  </p>
                </motion.div>
              )}
            </div>

            {/* Submit Button */}
            {puzzle.type !== 'multiple-choice' && (
              <button
                onClick={() => handleSubmit()}
                disabled={!userAnswer.trim() || isSubmitting}
                className="w-full py-3 bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-mono font-bold rounded-lg transition-all transform hover:scale-105 disabled:scale-100"
              >
                {isSubmitting ? 'CHECKING...' : 'SUBMIT ANSWER'}
              </button>
            )}

            {/* Result Display */}
            <AnimatePresence>
              {result && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className={`p-4 rounded-lg border-2 flex items-center gap-3 ${
                    result === 'correct'
                      ? 'bg-green-900/50 border-green-400 text-green-100'
                      : 'bg-red-900/50 border-red-400 text-red-100'
                  }`}
                >
                  {result === 'correct' ? (
                    <>
                      <CheckCircle className="w-6 h-6 text-green-400" />
                      <div>
                        <p className="font-mono font-bold">CORRECT!</p>
                        <p className="text-sm opacity-80">+{puzzle.points} points</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-6 h-6 text-red-400" />
                      <div>
                        <p className="font-mono font-bold">INCORRECT</p>
                        <p className="text-sm opacity-80">
                          The answer was: {Array.isArray(puzzle.answer) ? puzzle.answer[0] : puzzle.answer}
                        </p>
                      </div>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default PuzzleModal;
