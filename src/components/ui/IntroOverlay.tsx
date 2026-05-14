import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface IntroOverlayProps {
  onEnter: () => void;
}

const INTRO_VIDEO_URL =
  'https://res.cloudinary.com/depqttzlt/video/upload/f_auto,q_auto/v1776588213/Tom_Minimalist_3D_logo_of_The_Matrix_Arcade_glowing_neon-gree_016b41dc-119b-4ac5-889d-0ad44f535624_0_s2pqsg.mp4';

export function IntroOverlay({ onEnter }: IntroOverlayProps) {
  const redPillRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    redPillRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter') {
        e.preventDefault();
        onEnter();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onEnter]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 z-[60] bg-black flex items-end justify-center overflow-hidden pb-[10vh] sm:pb-[12vh]"
      role="dialog"
      aria-modal="true"
      aria-label="Enter The Matrix Arcade"
      data-testid="intro-overlay"
    >
      <video
        className="absolute inset-0 w-full h-full object-cover"
        src={INTRO_VIDEO_URL}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-hidden="true"
      />

      <div className="relative z-10 flex flex-col sm:flex-row items-center gap-4 sm:gap-8 px-6">
        <button
          ref={redPillRef}
          onClick={onEnter}
          aria-label="Take the red pill and enter The Matrix Arcade"
          className="px-8 py-3 min-w-[220px] bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-bold tracking-widest rounded-full border-2 border-red-400/70 shadow-[0_0_30px_rgba(239,68,68,0.6)] hover:shadow-[0_0_45px_rgba(239,68,68,0.9)] transition-all focus:outline-none focus:ring-4 focus:ring-red-300"
        >
          TAKE THE RED PILL
        </button>
        <button
          onClick={onEnter}
          aria-label="Take the blue pill and enter The Matrix Arcade"
          className="px-8 py-3 min-w-[220px] bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold tracking-widest rounded-full border-2 border-blue-400/70 shadow-[0_0_30px_rgba(59,130,246,0.6)] hover:shadow-[0_0_45px_rgba(59,130,246,0.9)] transition-all focus:outline-none focus:ring-4 focus:ring-blue-300"
        >
          TAKE THE BLUE PILL
        </button>
      </div>
    </motion.div>
  );
}
