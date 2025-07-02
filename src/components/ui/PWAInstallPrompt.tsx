import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show install prompt after a delay
      setTimeout(() => setShowPrompt(true), 2000);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    await deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }
    
    // Clear the deferred prompt
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Don't show again for this session
    sessionStorage.setItem('pwa-prompt-dismissed', 'true');
  };

  // Check if already dismissed
  useEffect(() => {
    if (sessionStorage.getItem('pwa-prompt-dismissed') === 'true') {
      setShowPrompt(false);
    }
  }, []);

  if (isInstalled || !showPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed bottom-8 left-8 z-50"
        initial={{ x: -400, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: -400, opacity: 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      >
        <div className="bg-black/90 border-2 border-green-500 rounded-lg p-6 
                       shadow-[0_0_30px_rgba(0,255,0,0.5)] backdrop-blur-md
                       max-w-[350px]">
          {/* Matrix rain effect background */}
          <div className="absolute inset-0 overflow-hidden rounded-lg opacity-10">
            <div className="matrix-rain" />
          </div>

          {/* Content */}
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <Download className="w-8 h-8 text-green-500" />
                <h3 className="text-xl font-mono text-green-500">
                  INSTALL MATRIX ARCADE
                </h3>
              </div>
              <button
                onClick={handleDismiss}
                className="p-1 hover:bg-green-500/20 rounded transition-colors"
              >
                <X className="w-5 h-5 text-green-500" />
              </button>
            </div>
            
            <p className="text-green-300 font-mono text-sm mb-6 leading-relaxed">
              Install The Matrix Arcade to your device for offline play and a better gaming experience.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={handleInstall}
                className="flex-1 px-4 py-2 bg-green-500 text-black font-mono rounded
                         hover:bg-green-400 transition-colors font-bold"
              >
                INSTALL NOW
              </button>
              <button
                onClick={handleDismiss}
                className="px-4 py-2 bg-transparent border border-green-500/50 text-green-500 
                         font-mono rounded hover:bg-green-500/10 transition-colors"
              >
                LATER
              </button>
            </div>
          </div>

          {/* Glitch effect */}
          <div className="absolute inset-0 pointer-events-none">
            <motion.div
              className="w-full h-full"
              animate={{
                clipPath: [
                  'inset(0 0 100% 0)',
                  'inset(0 0 80% 0)',
                  'inset(0 0 100% 0)',
                ],
                opacity: [0, 0.1, 0]
              }}
              transition={{
                duration: 0.5,
                repeat: Infinity,
                repeatDelay: 3
              }}
              style={{
                background: 'linear-gradient(180deg, transparent, rgba(0,255,0,0.1), transparent)',
                filter: 'blur(1px)'
              }}
            />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};