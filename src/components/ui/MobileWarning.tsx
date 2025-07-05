import React from 'react';
import { motion } from 'framer-motion';
import { Monitor, AlertTriangle } from 'lucide-react';

interface MobileWarningProps {
  onDismiss?: () => void;
}

export const MobileWarning: React.FC<MobileWarningProps> = ({ onDismiss }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black z-50 flex items-center justify-center p-4"
    >
      {/* Matrix rain background effect */}
      <div className="absolute inset-0 opacity-10">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute text-green-500 animate-matrix-rain"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
            }}
          >
            {String.fromCharCode(0x30a0 + Math.random() * 96)}
          </div>
        ))}
      </div>

      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", damping: 20 }}
        className="relative bg-gray-900 border-2 border-green-500 rounded-lg p-8 max-w-md w-full shadow-[0_0_50px_rgba(0,255,0,0.3)]"
      >
        <div className="flex flex-col items-center text-center">
          {/* Warning Icon */}
          <div className="mb-6 relative">
            <AlertTriangle className="w-16 h-16 text-yellow-500 animate-pulse" />
            <div className="absolute inset-0 blur-xl bg-yellow-500/20"></div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-mono text-green-400 mb-4">
            DESKTOP REQUIRED
          </h2>

          {/* Message */}
          <p className="text-green-300 mb-6 leading-relaxed">
            The Matrix Arcade games require a desktop computer with keyboard controls 
            for the optimal gaming experience.
          </p>

          {/* Computer Icon */}
          <div className="mb-6">
            <Monitor className="w-12 h-12 text-green-500" />
          </div>

          {/* Additional Info */}
          <p className="text-sm text-gray-400 mb-6">
            Please visit us on your desktop browser to enter the Matrix.
          </p>

          {/* Dismiss button (if provided) */}
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="px-6 py-2 bg-green-500 text-black font-mono rounded hover:bg-green-400 transition-colors"
            >
              I UNDERSTAND
            </button>
          )}

          {/* ASCII decoration */}
          <pre className="text-xs text-green-500/50 mt-6">
{`    _____ 
   |     |
   |  □  |
   |_____|
   /     \\`}
          </pre>
        </div>
      </motion.div>
    </motion.div>
  );
};