import React, { useState, useEffect } from 'react';
import { Download, X, Share, PlusSquare, Smartphone, CheckCircle2 } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PWAInstallModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode (already installed)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true;

    setIsInstalled(isStandalone);

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIPhoneOrIPad = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIPhoneOrIPad);

    // Listen for install prompt on Android / Chrome / Desktop
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-5 text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
          <div className="flex items-center space-x-3">
            <img
              src="/logo.png"
              alt="Fund View Logo"
              className="w-10 h-10 rounded-2xl object-cover border border-zinc-700/60 shadow-md"
              onError={(e) => {
                // Fallback if logo fails to load
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <div>
              <h3 className="text-base font-bold text-white">Install Fund View</h3>
              <p className="text-xs text-zinc-400">Install app for fast offline access</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {isInstalled ? (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <p className="text-xs font-semibold text-emerald-300">
              Fund View is already installed on this device!
            </p>
            <p className="text-[11px] text-zinc-400">
              You can launch it directly from your home screen or application list.
            </p>
          </div>
        ) : isIOS ? (
          /* iOS Instructions */
          <div className="space-y-4 text-xs text-zinc-300">
            <p className="text-zinc-400">
              To install <strong>Fund View</strong> on your iPhone or iPad:
            </p>
            <div className="space-y-2.5 bg-zinc-950 p-3.5 rounded-2xl border border-zinc-800/80 font-medium">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-zinc-800 rounded-xl text-blue-400 shrink-0">
                  <Share className="w-4 h-4" />
                </div>
                <span>1. Tap the <strong>Share</strong> button in Safari toolbar.</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-zinc-800 rounded-xl text-blue-400 shrink-0">
                  <PlusSquare className="w-4 h-4" />
                </div>
                <span>2. Scroll down and tap <strong>Add to Home Screen</strong>.</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-zinc-800 rounded-xl text-emerald-400 shrink-0">
                  <Smartphone className="w-4 h-4" />
                </div>
                <span>3. Tap <strong>Add</strong> in the top right corner.</span>
              </div>
            </div>
          </div>
        ) : (
          /* Android / Desktop Install Button */
          <div className="space-y-4">
            <p className="text-xs text-zinc-400 leading-relaxed">
              Install <strong>Fund View</strong> as a Progressive Web App on your phone or desktop. Works offline and launches instantly like a native app.
            </p>
            <button
              onClick={handleInstallClick}
              disabled={!deferredPrompt}
              className={`w-full py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                deferredPrompt
                  ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/30'
                  : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
              }`}
            >
              <Download className="w-4 h-4" />
              <span>{deferredPrompt ? 'Install App Now' : 'Use browser menu to Install'}</span>
            </button>
            {!deferredPrompt && (
              <p className="text-[11px] text-zinc-500 text-center">
                If the install button is disabled, open your browser options menu (⋮) and tap <strong>Install App</strong> or <strong>Add to Home screen</strong>.
              </p>
            )}
          </div>
        )}

        {/* Action Button */}
        <div className="pt-2">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
