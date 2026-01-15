import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const autoCloseTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Debug logging
    console.log('[PWA] Checking PWA capabilities...');

    // Check if already installed (standalone mode)
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone ||
      document.referrer.includes('android-app://');
    
    setIsStandalone(isStandaloneMode);
    console.log('[PWA] Standalone mode:', isStandaloneMode);

    // Check if mobile
    const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    setIsMobile(mobile);
    console.log('[PWA] Is mobile:', mobile);

    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(iOS);
    console.log('[PWA] Is iOS:', iOS);

    // Check if manifest is loaded
    const manifestLink = document.querySelector('link[rel="manifest"]');
    console.log('[PWA] Manifest link:', manifestLink ? 'Found' : 'Not found');

    // Check if service worker is registered
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        console.log('[PWA] Service Worker registered:', reg ? 'Yes' : 'No');
      });
    }

    // Listen for beforeinstallprompt event (Android/Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('[PWA] beforeinstallprompt event fired!');
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Show prompt after 3 seconds (user sudah lihat konten)
      setTimeout(() => {
        if (!isStandaloneMode) {
          console.log('[PWA] Showing install prompt');
          setShowPrompt(true);
        }
      }, 3000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // For mobile devices, show prompt even if beforeinstallprompt doesn't fire
    // (some browsers/devices don't fire this event immediately)
    if (mobile && !isStandaloneMode && !iOS) {
      // Check if user already dismissed (localStorage)
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      let shouldShow = true;

      if (dismissed) {
        const dismissedTime = parseInt(dismissed, 10);
        const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
        
        // Show again after 7 days
        if (daysSinceDismissed < 7) {
          shouldShow = false;
        }
      }

      // Show prompt for Android even without beforeinstallprompt event
      // (user can manually install via browser menu)
      if (shouldShow) {
        setTimeout(() => {
          console.log('[PWA] Showing manual install prompt for mobile');
          setShowPrompt(true);
        }, 5000); // Show after 5 seconds for mobile
      }
    }

    // For iOS, always show instructions after delay
    if (iOS && !isStandaloneMode) {
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      if (!dismissed) {
        setTimeout(() => {
          console.log('[PWA] Showing iOS install prompt');
          setShowPrompt(true);
        }, 5000);
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    // Clear auto-close timer when user interacts
    if (autoCloseTimerRef.current) {
      clearTimeout(autoCloseTimerRef.current);
      autoCloseTimerRef.current = null;
    }

    if (deferredPrompt) {
      // Show native install prompt (Android/Chrome)
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
          console.log('[PWA] User accepted install prompt');
          setShowPrompt(false);
        } else {
          console.log('[PWA] User dismissed install prompt');
          localStorage.setItem('pwa-install-dismissed', Date.now().toString());
        }

        setDeferredPrompt(null);
        setShowPrompt(false);
      } catch (error) {
        console.error('[PWA] Install prompt error:', error);
        // Fallback to manual instructions
        showManualInstructions();
      }
    } else {
      // Manual install instructions
      showManualInstructions();
    }
  };

  const showManualInstructions = () => {
    if (isIOS) {
      alert('Untuk menginstall aplikasi:\n\n1. Tap tombol Share (□↑) di bagian bawah\n2. Scroll dan pilih "Add to Home Screen"\n3. Tap "Add" untuk menginstall');
    } else if (isMobile) {
      alert('Untuk menginstall aplikasi:\n\n1. Tap menu (⋮) di pojok kanan atas\n2. Pilih "Install app" atau "Add to Home screen"\n3. Tap "Install" untuk menginstall\n\nAtau buka menu browser dan cari opsi "Install"');
    } else {
      alert('Untuk menginstall aplikasi:\n\n1. Klik ikon install (➕) di address bar\n2. Atau buka menu browser (⋮) → "Install Bali PET"\n\nPastikan browser mendukung PWA (Chrome, Edge, atau Opera)');
    }
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  const handleDismiss = () => {
    if (autoCloseTimerRef.current) {
      clearTimeout(autoCloseTimerRef.current);
      autoCloseTimerRef.current = null;
    }
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  // Don't show if already installed
  if (isStandalone) {
    return null;
  }

  // Auto-close after 10 seconds if not responded
  useEffect(() => {
    if (showPrompt) {
      autoCloseTimerRef.current = setTimeout(() => {
        console.log('[PWA] Auto-closing prompt after 10 seconds');
        handleDismiss();
      }, 10000); // 10 seconds

      return () => {
        if (autoCloseTimerRef.current) {
          clearTimeout(autoCloseTimerRef.current);
        }
      };
    }
  }, [showPrompt]);

  // Show prompt if:
  // 1. Prompt state is true (set by useEffect)
  // 2. OR on mobile/iOS (for manual install instructions)
  if (!showPrompt) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed bottom-4 left-4 right-4 z-[35] md:left-auto md:right-4 md:w-96 pointer-events-auto"
      >
        <div className="glass-panel rounded-xl p-4 shadow-lg border border-border">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Download className="w-5 h-5 text-primary" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-foreground mb-1">
                Install Aplikasi
              </h3>
              <p className="text-xs text-muted-foreground mb-3">
                {deferredPrompt 
                  ? 'Install aplikasi untuk akses lebih cepat dan pengalaman offline'
                  : isIOS
                  ? 'Tambahkan ke Home Screen untuk akses lebih cepat'
                  : 'Install aplikasi via menu browser untuk akses lebih cepat'}
              </p>
              
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleInstall}
                  className="flex-1"
                >
                  {deferredPrompt ? 'Install' : isIOS ? 'Cara Install' : 'Cara Install'}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleDismiss}
                  className="px-2"
                  aria-label="Tutup"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
