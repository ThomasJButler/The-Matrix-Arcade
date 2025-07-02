import React from 'react';
import { RefreshCw, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRegisterSW } from 'virtual:pwa-register/react';

export const PWAUpdatePrompt: React.FC = () => {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered:', r);
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });

  const close = () => {
    setNeedRefresh(false);
  };

  const updateSW = () => {
    updateServiceWorker(true);
  };

  return (
    <AnimatePresence>
      {needRefresh && (
        <motion.div
          className="fixed top-8 left-1/2 transform -translate-x-1/2 z-50"
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        >
          <div className="bg-black/90 border-2 border-green-500 rounded-lg p-4 
                         shadow-[0_0_30px_rgba(0,255,0,0.5)] backdrop-blur-md">
            {/* Matrix rain effect background */}
            <div className="absolute inset-0 overflow-hidden rounded-lg opacity-10">
              <div className="matrix-rain" />
            </div>

            {/* Content */}
            <div className="relative z-10 flex items-center gap-4">
              <RefreshCw className="w-6 h-6 text-green-500 animate-spin" />
              
              <div className="flex-1">
                <h4 className="font-mono text-green-500 text-sm mb-1">
                  NEW VERSION AVAILABLE
                </h4>
                <p className="font-mono text-green-300 text-xs">
                  Reload to get the latest features and improvements
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={updateSW}
                  className="px-3 py-1 bg-green-500 text-black font-mono text-sm rounded
                           hover:bg-green-400 transition-colors font-bold"
                >
                  RELOAD
                </button>
                <button
                  onClick={close}
                  className="p-1 hover:bg-green-500/20 rounded transition-colors"
                >
                  <X className="w-4 h-4 text-green-500" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};