import React, { useEffect, useState } from 'react';
import { DownloadCloud, X } from 'lucide-react';

export const InstallPopup: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if the app is already installed or standalone
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return;
    }

    const handler = (e: any) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Update UI notify the user they can install the PWA
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Show the install prompt natively
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    // Check if the user accepted or dismissed
    if (outcome === 'accepted') {
        setShowPrompt(false);
    }
    
    setDeferredPrompt(null);
  };

  const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

  // Manual iOS check since Apple doesn't cleanly emit beforeinstallprompt
  const [showIOSPrompt, setShowIOSPrompt] = useState(iOS && !isStandalone);

  if (!showPrompt && !showIOSPrompt) {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return (
        <button 
           onClick={() => {
             const e = new Event('beforeinstallprompt');
             Object.assign(e, { prompt: () => console.log('Mock Native Prompt Triggered'), userChoice: Promise.resolve({ outcome: 'accepted' }) });
             window.dispatchEvent(e);
           }}
           style={{ position: 'fixed', top: '10px', right: '10px', backgroundColor: 'purple', color: 'white', padding: '8px', borderRadius: '8px', zIndex: 10000, border: 'none', fontWeight: 'bold' }}>
           Simulate Install (Dev)
         </button>
      )
    }
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '100px', // Just above the bottom nav
      left: '16px',
      right: '16px',
      backgroundColor: 'var(--color-near-black)',
      color: 'var(--color-white)',
      padding: '16px',
      borderRadius: '20px',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      zIndex: 9999,
      boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
      border: '2px solid var(--color-wise-green)'
    }}>
      <div className="flex gap-4 items-center">
        <div style={{ backgroundColor: 'var(--color-wise-green)', padding: '10px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
           <DownloadCloud color="var(--color-dark-green)" size={24} />
        </div>
        <div>
          <h4 style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '4px' }}>Get the App</h4>
          {showPrompt ? (
            <p className="body-light" style={{ fontSize: '12px', color: 'var(--color-gray)' }}>Install Tax Pilot natively for 100% offline access.</p>
          ) : (
            <p className="body-light" style={{ fontSize: '12px', color: 'var(--color-gray)' }}>Tap the <strong>Share</strong> icon below, then choose <strong>"Add to Home Screen"</strong>.</p>
          )}
          
          {showPrompt && (
            <button 
              style={{ marginTop: '12px', padding: '6px 16px', backgroundColor: 'var(--color-wise-green)', color: 'var(--color-dark-green)', fontWeight: 'bold', borderRadius: '999px', border: 'none', cursor: 'pointer' }}
              onClick={handleInstallClick}
            >
              Install Now
            </button>
          )}
        </div>
      </div>
      
      <button 
        style={{ background: 'none', border: 'none', color: 'var(--color-gray)', cursor: 'pointer', padding: '4px' }}
        onClick={() => { setShowPrompt(false); setShowIOSPrompt(false); }}
      >
        <X size={18} />
      </button>
    </div>
  );
};
