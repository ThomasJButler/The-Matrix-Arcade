import React, { useState, useEffect } from 'react';

const COLORS = ['red', 'green', 'blue', 'yellow', 'purple', 'orange'];
const CODE_LENGTH = 4;
const MAX_ATTEMPTS = 10;

type Guess = {
  code: string[];
  feedback: { correct: number; misplaced: number };
};

export default function CodeBreaker() {
  const [secretCode, setSecretCode] = useState<string[]>([]);
  const [currentGuess, setCurrentGuess] = useState<string[]>([]);
  const [guesses, setGuesses] = useState<Guess[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);

  useEffect(() => {
    generateNewCode();
  }, []);

  const generateNewCode = () => {
    const newCode = Array.from({ length: CODE_LENGTH }, () =>
      COLORS[Math.floor(Math.random() * COLORS.length)]
    );
    setSecretCode(newCode);
    setCurrentGuess([]);
    setGuesses([]);
    setGameOver(false);
    setWon(false);
  };

  const addColor = (color: string) => {
    if (currentGuess.length < CODE_LENGTH) {
      setCurrentGuess([...currentGuess, color]);
    }
  };

  const removeLastColor = () => {
    setCurrentGuess(currentGuess.slice(0, -1));
  };

  const checkGuess = () => {
    if (currentGuess.length !== CODE_LENGTH) return;

    const codeCopy = [...secretCode];
    const guessCopy = [...currentGuess];
    let correct = 0;
    let misplaced = 0;

    // Check for correct positions
    for (let i = 0; i < CODE_LENGTH; i++) {
      if (guessCopy[i] === codeCopy[i]) {
        correct++;
        codeCopy[i] = guessCopy[i] = '';
      }
    }

    // Check for misplaced colors
    for (let i = 0; i < CODE_LENGTH; i++) {
      if (guessCopy[i]) {
        const index = codeCopy.indexOf(guessCopy[i]);
        if (index !== -1) {
          misplaced++;
          codeCopy[index] = '';
        }
      }
    }

    const newGuess = {
      code: currentGuess,
      feedback: { correct, misplaced },
    };

    setGuesses([...guesses, newGuess]);
    setCurrentGuess([]);

    if (correct === CODE_LENGTH) {
      setWon(true);
      setGameOver(true);
    } else if (guesses.length + 1 >= MAX_ATTEMPTS) {
      setGameOver(true);
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-black p-4 font-mono text-green-500">
      <div className="mb-4">Attempts: {guesses.length}/{MAX_ATTEMPTS}</div>

      {/* Previous Guesses */}
      <div className="mb-4">
        {guesses.map((guess, index) => (
          <div key={index} className="flex items-center gap-2 mb-2">
            <div className="flex gap-1">
              {guess.code.map((color, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <div className="ml-4">
              🎯 {guess.feedback.correct} | 📍 {guess.feedback.misplaced}
            </div>
          </div>
        ))}
      </div>

      {/* Current Guess */}
      <div className="flex gap-1 mb-4">
        {Array.from({ length: CODE_LENGTH }).map((_, i) => (
          <div
            key={i}
            className={`w-8 h-8 rounded-full border-2 border-green-500 ${
              currentGuess[i] ? '' : 'bg-gray-800'
            }`}
            style={{ backgroundColor: currentGuess[i] }}
          />
        ))}
      </div>

      {/* Color Picker */}
      {!gameOver && (
        <div className="grid grid-cols-3 gap-2 mb-4">
          {COLORS.map((color) => (
            <button
              key={color}
              className="w-8 h-8 rounded-full"
              style={{ backgroundColor: color }}
              onClick={() => addColor(color)}
            />
          ))}
        </div>
      )}

      {/* Control Buttons */}
      <div className="flex gap-2">
        {!gameOver && (
          <>
            <button
              onClick={removeLastColor}
              className="px-4 py-2 bg-red-500 text-white rounded"
              disabled={currentGuess.length === 0}
            >
              Undo
            </button>
            <button
              onClick={checkGuess}
              className="px-4 py-2 bg-green-500 text-black rounded"
              disabled={currentGuess.length !== CODE_LENGTH}
            >
              Check
            </button>
          </>
        )}
      </div>

      {/* Game Over Message */}
      {gameOver && (
        <div className="mt-4 text-center">
          <p>{won ? 'Congratulations! You broke the code!' : 'Game Over!'}</p>
          <p className="mb-4">The secret code was:</p>
          <div className="flex gap-1 justify-center mb-4">
            {secretCode.map((color, i) => (
              <div
                key={i}
                className="w-8 h-8 rounded-full"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <button
            onClick={generateNewCode}
            className="px-4 py-2 bg-green-500 text-black rounded"
          >
            Play Again
          </button>
        </div>
      )}
    </div>
  );
}