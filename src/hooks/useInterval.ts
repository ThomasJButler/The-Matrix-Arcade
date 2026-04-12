import { useEffect, useRef } from 'react';

export function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay !== null) {
      const safeDelay = Math.max(delay, 1);
      const id = setInterval(() => savedCallback.current(), safeDelay);
      return () => clearInterval(id);
    }
  }, [delay]);
}