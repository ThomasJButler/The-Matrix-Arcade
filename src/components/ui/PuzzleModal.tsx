import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, Clock, Lightbulb, CheckCircle, XCircle, Zap, Cpu, Users } from 'lucide-react';
import { useLifelineManager } from '@/hooks/useLifelineManager';
import { SentientAIModal } from './SentientAIModal';
import { CharacterConversationModal } from './CharacterConversationModal';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface PuzzleData {
  id: string;
  type: 'code' | 'riddle' | 'multiple-choice' | 'typing' | 'fill-in';
  question: string;
  answer: string | string[];
  hints: string[];
  timeLimit?: number;
  points: number;
  difficulty: 'easy' | 'medium' | 'hard';
  context?: string;
  // Multiple choice options for lifeline system
  optionA?: string;
  optionB?: string;
  optionC?: string;
  optionD?: string;
}

interface PuzzleModalProps {
  isOpen: boolean;
  puzzle: PuzzleData;
  onClose: () => void;
  onComplete: (success: boolean, hintsUsed: number, lifelinesUsed: number) => void;
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
  const [lifelinesUsed, setLifelinesUsed] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(puzzle.timeLimit || 0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<'correct' | 'incorrect' | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const MAX_ATTEMPTS = 3;
  const inputRef = useRef<HTMLInputElement>(null);

  // Lifeline system
  const lifelineManager = useLifelineManager();
  const [showFiftyFifty, setShowFiftyFifty] = useState(false);
  const [eliminatedOptions, setEliminatedOptions] = useState<string[]>([]);
  const [showSentientAI, setShowSentientAI] = useState(false);
  const [showCharacters, setShowCharacters] = useState(false);
  const [showAnswerConfirm, setShowAnswerConfirm] = useState(false);

  // Reset state when puzzle changes
  useEffect(() => {
    if (isOpen) {
      setUserAnswer('');
      setCurrentHint(-1);
      setHintsUsed(0);
      setLifelinesUsed(0);
      setTimeRemaining(puzzle.timeLimit || 0);
      setIsSubmitting(false);
      setResult(null);
      setAttempts(0);
      setShowAnswer(false);

      // Reset lifeline UI states (not the manager - that persists)
      setShowFiftyFifty(false);
      setEliminatedOptions([]);
      setShowSentientAI(false);
      setShowCharacters(false);
      setShowAnswerConfirm(false);

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

  // Lifeline handlers
  const hasMultipleChoice = !!(puzzle.optionA && puzzle.optionB && puzzle.optionC && puzzle.optionD);

  const handle5050 = () => {
    if (!hasMultipleChoice) return;

    const options = [puzzle.optionA, puzzle.optionB, puzzle.optionC, puzzle.optionD].filter(Boolean) as string[];
    const correctAnswer = Array.isArray(puzzle.answer) ? puzzle.answer[0] : puzzle.answer;

    // Find correct option
    const correctIndex = options.findIndex(opt =>
      opt.toLowerCase().trim() === correctAnswer.toLowerCase().trim()
    );

    if (correctIndex === -1) return; // Safety check

    const incorrectIndices = options
      .map((_, i) => i)
      .filter(i => i !== correctIndex);

    // Keep one random incorrect option
    const keepIndex = incorrectIndices[Math.floor(Math.random() * incorrectIndices.length)];

    // Eliminate the other two
    const toEliminate = incorrectIndices.filter(i => i !== keepIndex);
    const eliminated = toEliminate.map(i => options[i]);

    setEliminatedOptions(eliminated);
    setShowFiftyFifty(true);
    setLifelinesUsed(prev => prev + 1);
    lifelineManager.useFiftyFifty(puzzle.id);
    playSFX?.('powerup');
  };

  const handleShowAnswer = () => {
    const result = lifelineManager.useFreeAnswer();
    if (result.success) {
      const correctAnswer = Array.isArray(puzzle.answer) ? puzzle.answer[0] : puzzle.answer;
      setUserAnswer(correctAnswer);
      setShowAnswerConfirm(false);
      setLifelinesUsed(prev => prev + 1);
      playSFX?.('hit');

      // Note: Penalties are applied in the game state via GameStateContext
      // We'll just fill in the answer for the user
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

    const isCorrect = !timedOut && checkAnswer(userAnswer);

    if (isCorrect) {
      // Correct answer!
      setResult('correct');
      setIsSubmitting(true);
      playSFX?.('score');

      // Show result for 2 seconds, then close
      setTimeout(() => {
        onComplete(true, hintsUsed, lifelinesUsed);
        onClose();
      }, 2000);
    } else {
      // Incorrect answer
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setResult('incorrect');
      playSFX?.('death');

      if (newAttempts >= MAX_ATTEMPTS) {
        // Out of attempts - show correct answer
        setShowAnswer(true);
        setIsSubmitting(true);

        // Auto-close after 4 seconds to give time to read answer
        setTimeout(() => {
          onComplete(false, hintsUsed, lifelinesUsed);
          onClose();
        }, 4000);
      } else {
        // Still have attempts left - allow retry
        setTimeout(() => {
          setResult(null);
          setUserAnswer('');
          inputRef.current?.focus();
        }, 1500);
      }
    }
  };

  // Handle Enter key
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && userAnswer.trim() && !isSubmitting) {
      handleSubmit();
    }
  };

  // Render multiple choice options
  const renderMultipleChoice = () => {
    if (!Array.isArray(puzzle.answer)) {
      return null;
    }

    const options = [
      { key: 'A', value: puzzle.optionA },
      { key: 'B', value: puzzle.optionB },
      { key: 'C', value: puzzle.optionC },
      { key: 'D', value: puzzle.optionD }
    ];

    return (
      <div className="space-y-2">
        {options.map(({ key, value }) => {
          if (!value) return null;

          const isEliminated = eliminatedOptions.includes(value);
          const isSelected = userAnswer === value;

          return (
            <button
              key={key}
              onClick={() => {
                if (!isSubmitting && !isEliminated) {
                  setUserAnswer(value || '');
                  // Auto-submit for multiple choice
                  setTimeout(() => handleSubmit(), 300);
                }
              }}
              disabled={isSubmitting || isEliminated}
              className={`w-full p-3 text-left rounded-lg border-2 transition-all ${
                isEliminated
                  ? 'opacity-30 line-through cursor-not-allowed bg-gray-900/50 border-gray-700'
                  : isSelected
                  ? 'border-green-400 bg-green-900/30'
                  : 'border-green-500/30 bg-black/50 hover:border-green-400 hover:bg-green-900/20'
              } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span className="font-mono text-green-400">{key})</span>{' '}
              <span className={isEliminated ? 'text-gray-500' : 'text-green-100'}>
                {value}
              </span>
            </button>
          );
        })}
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
          className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative w-full max-w-6xl bg-gray-900 border-2 border-green-500 rounded-xl shadow-[0_0_30px_rgba(0,255,0,0.3)] overflow-hidden"
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

              {/* Answer Required Notice */}
              <div className="text-xs font-mono text-yellow-400 flex items-center gap-1">
                <span className="text-red-400">*</span> Answer Required
              </div>
            </div>
          </div>

          {/* Content - Landscape layout with two columns */}
          <div className="p-6 max-h-[85vh] overflow-y-auto">
            {/* Two-column grid on desktop, single column on mobile */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* LEFT COLUMN - Question, Context, Hints */}
              <div className="space-y-4">
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
              </div>

              {/* RIGHT COLUMN - Answer Input, Multiple Choice, Lifelines, Submit */}
              <div className="space-y-4">
                {/* Answer Input - Always show for text entry */}
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

                {/* Multiple Choice Options - Show if available */}
                {hasMultipleChoice && (
                  <div className="space-y-2">
                    <div className="text-green-400 font-mono text-sm text-center">
                      - OR SELECT FROM OPTIONS -
                    </div>
                    {renderMultipleChoice()}
                  </div>
                )}

                {/* Lifeline System */}
                <div className="space-y-3">
                  <div className="text-xs font-mono text-green-400 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4" />
                    <span>LIFELINES AVAILABLE</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {/* Show Answer Button */}
                    <button
                      onClick={() => setShowAnswerConfirm(true)}
                      disabled={lifelineManager.freeAnswersRemaining === 0 || isSubmitting}
                      className="px-2 py-2 bg-red-900/30 hover:bg-red-900/50 border border-red-500/50 rounded text-sm font-mono disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <div className="flex flex-col items-center gap-1">
                        <Lightbulb className="w-4 h-4" />
                        <span className="text-xs">Show Answer</span>
                        <span className="text-xs text-red-400">
                          {lifelineManager.freeAnswersRemaining} left
                        </span>
                      </div>
                    </button>

                    {/* 50/50 Button */}
                    <button
                      onClick={handle5050}
                      disabled={
                        !lifelineManager.isLifelineAvailable('fiftyFifty', puzzle.id) ||
                        !hasMultipleChoice ||
                        isSubmitting
                      }
                      className="px-2 py-2 bg-blue-900/30 hover:bg-blue-900/50 border border-blue-500/50 rounded text-sm font-mono disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <div className="flex flex-col items-center gap-1">
                        <Zap className="w-4 h-4" />
                        <span className="text-xs">50/50</span>
                        <span className="text-xs">
                          {lifelineManager.isLifelineAvailable('fiftyFifty', puzzle.id)
                            ? 'Available'
                            : 'Used'}
                        </span>
                      </div>
                    </button>

                    {/* Sentient AI Button */}
                    <button
                      onClick={() => setShowSentientAI(true)}
                      disabled={!lifelineManager.isLifelineAvailable('sentientAI', puzzle.id) || isSubmitting}
                      className="px-2 py-2 bg-purple-900/30 hover:bg-purple-900/50 border border-purple-500/50 rounded text-sm font-mono disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <div className="flex flex-col items-center gap-1">
                        <Cpu className="w-4 h-4" />
                        <span className="text-xs">Ask AI</span>
                        <span className="text-xs">
                          {lifelineManager.isLifelineAvailable('sentientAI', puzzle.id)
                            ? '100% Right'
                            : 'Used'}
                        </span>
                      </div>
                    </button>

                    {/* Characters Button */}
                    <button
                      onClick={() => setShowCharacters(true)}
                      disabled={!lifelineManager.isLifelineAvailable('characters', puzzle.id) || isSubmitting}
                      className="px-2 py-2 bg-yellow-900/30 hover:bg-yellow-900/50 border border-yellow-500/50 rounded text-sm font-mono disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <div className="flex flex-col items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span className="text-xs">Ask Team</span>
                        <span className="text-xs">
                          {lifelineManager.isLifelineAvailable('characters', puzzle.id)
                            ? 'Available'
                            : 'Used'}
                        </span>
                      </div>
                    </button>
                  </div>
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
                            {showAnswer ? (
                              <p className="text-sm opacity-80">
                                The correct answer was: <span className="font-bold text-yellow-300">{Array.isArray(puzzle.answer) ? puzzle.answer[0] : puzzle.answer}</span>
                              </p>
                            ) : (
                              <p className="text-sm opacity-80">
                                Attempts remaining: {MAX_ATTEMPTS - attempts}/{MAX_ATTEMPTS}
                              </p>
                            )}
                          </div>
                        </>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Show Answer Confirmation Modal */}
        <AnimatePresence>
          {showAnswerConfirm && (
            <motion.div className="fixed inset-0 z-[70] flex items-center justify-center">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60"
                onClick={() => setShowAnswerConfirm(false)}
              />
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative bg-black border-2 border-red-500 rounded-lg p-6 max-w-md mx-4"
              >
                <h3 className="text-xl font-mono text-red-400 mb-4">⚠️ Confirm Show Answer</h3>
                <p className="text-green-400 mb-4">
                  This will reveal the correct answer, but you'll lose:
                </p>
                <ul className="text-yellow-400 mb-6 space-y-1">
                  <li>• -5 Wisdom points</li>
                  <li>• -3 Reputation points</li>
                </ul>
                <p className="text-sm text-green-400 mb-4">
                  Remaining free answers: <span className="font-bold">{lifelineManager.freeAnswersRemaining}</span>
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={handleShowAnswer}
                    className="flex-1 px-4 py-2 bg-red-900 hover:bg-red-800 border border-red-500 rounded font-mono transition-colors"
                  >
                    Reveal Answer
                  </button>
                  <button
                    onClick={() => setShowAnswerConfirm(false)}
                    className="flex-1 px-4 py-2 bg-green-900 hover:bg-green-800 border border-green-500 rounded font-mono transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sentient AI Modal */}
        <SentientAIModal
          isOpen={showSentientAI}
          difficulty={puzzle.difficulty}
          puzzleType={puzzle.type}
          answer={Array.isArray(puzzle.answer) ? puzzle.answer[0] : puzzle.answer}
          onClose={() => {
            setShowSentientAI(false);
            setLifelinesUsed(prev => prev + 1);
            lifelineManager.useSentientAI(puzzle.id);
          }}
        />

        {/* Characters Conversation Modal */}
        <CharacterConversationModal
          isOpen={showCharacters}
          puzzle={puzzle}
          onClose={() => {
            setShowCharacters(false);
            setLifelinesUsed(prev => prev + 1);
            lifelineManager.useCharacters(puzzle.id);
          }}
        />
      </div>
    </AnimatePresence>
  );
};

export default PuzzleModal;
