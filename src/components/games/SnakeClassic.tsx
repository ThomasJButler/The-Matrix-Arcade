import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useInterval } from '../../hooks/useInterval';

type Position = {
  x: number;
  y: number;
};

const GRID_SIZE = 20;
const INITIAL_SNAKE = [{ x: 10, y: 10 }];
const INITIAL_FOOD = { x: 15, y: 15 };
const INITIAL_DIRECTION = { x: 1, y: 0 };
const GAME_SPEED = 100; // Increased speed for more difficulty

export default function SnakeClassic() {
  const [snake, setSnake] = useState<Position[]>(INITIAL_SNAKE);
  const [food, setFood] = useState<Position>(INITIAL_FOOD);
  const [direction, setDirection] = useState(INITIAL_DIRECTION);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const boardRef = useRef<HTMLDivElement>(null);

  const generateFood = useCallback(() => {
    let newFood;
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
    } while (snake.some(segment => segment.x === newFood.x && segment.y === newFood.y));
    return newFood;
  }, [snake]);

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setFood(generateFood());
    setDirection(INITIAL_DIRECTION);
    setIsGameOver(false);
    setScore(0);
  };

  const moveSnake = useCallback(() => {
    if (isGameOver) return;

    setSnake((currentSnake) => {
      const newHead = {
        x: (currentSnake[0].x + direction.x + GRID_SIZE) % GRID_SIZE,
        y: (currentSnake[0].y + direction.y + GRID_SIZE) % GRID_SIZE,
      };

      // Check collision with self
      if (currentSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
        setIsGameOver(true);
        return currentSnake;
      }

      const newSnake = [newHead, ...currentSnake];

      // Check if food is eaten
      if (newHead.x === food.x && newHead.y === food.y) {
        setFood(generateFood());
        setScore(s => s + 1);
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [direction, food, generateFood, isGameOver]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (isGameOver) {
        if (e.key === 'Enter') resetGame();
        return;
      }

      const keyDirections: { [key: string]: Position } = {
        ArrowUp: { x: 0, y: -1 },
        ArrowDown: { x: 0, y: 1 },
        ArrowLeft: { x: -1, y: 0 },
        ArrowRight: { x: 1, y: 0 },
      };

      if (keyDirections[e.key]) {
        const newDirection = keyDirections[e.key];
        // Prevent 180-degree turns
        if (Math.abs(newDirection.x) !== Math.abs(direction.x) ||
            Math.abs(newDirection.y) !== Math.abs(direction.y)) {
          setDirection(newDirection);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [direction, isGameOver]);

  useInterval(moveSnake, GAME_SPEED);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-black p-4">
      <div className="mb-4 font-mono text-green-500">Score: {score}</div>
      <div className="border-2 border-green-500 grid grid-cols-20 gap-0 bg-black" ref={boardRef}>
        {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, index) => {
          const x = index % GRID_SIZE;
          const y = Math.floor(index / GRID_SIZE);
          const isSnake = snake.some(segment => segment.x === x && segment.y === y);
          const isFood = food.x === x && food.y === y;

          return (
            <div
              key={index}
              className={`w-4 h-4 ${
                isSnake
                  ? 'bg-green-500'
                  : isFood
                  ? 'bg-green-300'
                  : 'bg-black'
              }`}
            />
          );
        })}
      </div>
      {isGameOver && (
        <div className="mt-4 text-center font-mono text-green-500">
          <p>Game Over! Score: {score}</p>
          <button
            onClick={resetGame}
            className="mt-2 px-4 py-2 bg-green-500 text-black rounded hover:bg-green-400"
          >
            Play Again
          </button>
        </div>
      )}
    </div>
  );
}