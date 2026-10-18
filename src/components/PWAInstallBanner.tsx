'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Download, X, Share, PlusSquare } from 'lucide-react';
import { useApp } from '@/context/AppContext';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PWAInstallBanner = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [showBanner, setShowBanner] = useState<boolean>(false);
  const [showIOSGuide, setShowIOSGuide] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if already running in standalone PWA mode
    const isStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      // @ts-expect-error - iOS Safari specific property
      Boolean(window.navigator.standalone);

    setIsStandalone(isStandaloneMode);
    if (isStandaloneMode) return;

    // Check dismissed timestamp
    const dismissedTime = localStorage.getItem('caglabufe_pwa_dismissed');
    if (dismissedTime) {
      const daysPassed = (Date.now() - parseInt(dismissedTime, 10)) / (1000 * 60 * 60 * 24);
      if (daysPassed < 3) {
        return; // Don't show if dismissed within 3 days
      }
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent) && !('MSStream' in window);
    setIsIOS(isIOSDevice);

    if (isIOSDevice) {
      // Delay showing banner slightly on iOS for smooth entrance
      const timer = setTimeout(() => setShowBanner(true), 2500);
      return () => clearTimeout(timer);
    }

    // Listen for Android / Chrome beforeinstallprompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }

    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;

    if (choice.outcome === 'accepted') {
      setShowBanner(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setShowIOSGuide(false);
    localStorage.setItem('caglabufe_pwa_dismissed', Date.now().toString());
  };

  const { cart } = useApp();

  if (isStandalone || !showBanner || cart.length > 0) return null;

  return (
    <>
      {/* Floating Bottom PWA Install Banner */}
      <div
        style={{
          position: 'fixed',
          bottom: 'calc(var(--bottom-nav-height, 66px) + env(safe-area-inset-bottom, 0px) + 14px)',
          left: '16px',
          right: '16px',
          maxWidth: '520px',
          margin: '0 auto',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '12px 14px',
          boxShadow: '0 8px 30px rgba(93, 62, 188, 0.22)',
          border: '1.5px solid #ebebf2',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          zIndex: 890,
          animation: 'slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              overflow: 'hidden',
              flexShrink: 0,
              boxShadow: '0 2px 8px rgba(93, 62, 188, 0.15)',
              backgroundColor: '#5D3EBC',
            }}
          >
            <Image
              src="/icon-192.png"
              alt="Çağla Büfe"
              width={42}
              height={42}
              style={{ objectFit: 'cover' }}
            />
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#191919', lineHeight: 1.2 }}>
              Çağla Büfe Uygulaması
            </div>
            <div style={{ fontSize: '11px', color: '#586174', marginTop: '2px' }}>
              Daha hızlı sipariş için ana ekrana ekle
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={handleInstallClick}
            style={{
              backgroundColor: '#5D3EBC',
              color: '#ffffff',
              padding: '8px 14px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap',
              boxShadow: '0 2px 8px rgba(93, 62, 188, 0.3)',
            }}
          >
            <Download size={15} />
            <span>Yükle</span>
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Kapat"
            style={{
              color: '#94a3b8',
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* iOS Safari Instruction Modal */}
      {showIOSGuide && (
        <div
          className="modal-overlay"
          onClick={() => setShowIOSGuide(false)}
          style={{ zIndex: 10000 }}
        >
          <div
            className="bottom-sheet"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '420px', padding: '24px 20px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#5D3EBC' }}>
                  <Image src="/icon-192.png" alt="Logo" width={36} height={36} />
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#191919' }}>iPhone & iPad Kurulumu</h3>
                  <p style={{ fontSize: '12px', color: '#64748b' }}>Çağla Büfe uygulamasını ana ekranına ekle</p>
                </div>
              </div>
              <button
                type="button"
                className="close-btn"
                onClick={() => setShowIOSGuide(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', margin: '20px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', backgroundColor: '#f8f9fc', borderRadius: '12px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#f3f0fe', color: '#5D3EBC', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Share size={18} />
                </div>
                <div style={{ fontSize: '13px', color: '#191919', lineHeight: 1.4 }}>
                  <strong>1. Adım:</strong> Safari tarayıcınızın alt çubuğundaki <strong>&quot;Paylaş&quot;</strong> butonuna dokunun.
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', backgroundColor: '#f8f9fc', borderRadius: '12px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#f3f0fe', color: '#5D3EBC', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <PlusSquare size={18} />
                </div>
                <div style={{ fontSize: '13px', color: '#191919', lineHeight: 1.4 }}>
                  <strong>2. Adım:</strong> Menüyü aşağı kaydırıp <strong>&quot;Ana Ekrana Ekle&quot;</strong> seçeneğini seçin.
                </div>
              </div>
            </div>

            <button
              type="button"
              className="btn-primary"
              onClick={() => setShowIOSGuide(false)}
              style={{ width: '100%', marginTop: '6px' }}
            >
              Anladım
            </button>
          </div>
        </div>
      )}
    </>
  );
};
