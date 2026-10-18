'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { StoreLandingPage } from './StoreLandingPage';

export const StoreClosedOverlay = () => {
  const pathname = usePathname();
  const [shouldShowSplash, setShouldShowSplash] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Detect if running as standalone PWA
    const isPWA =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    // Check conditions:
    // 1. Device first visit: Never seen on this device before
    const hasSeenDevice = localStorage.getItem('cagla_device_splash_seen') === 'true';

    // 2. PWA Startup: Standalone PWA opened in a fresh session
    const hasSeenPwaSession = sessionStorage.getItem('cagla_pwa_splash_seen') === 'true';

    if (!hasSeenDevice) {
      setShouldShowSplash(true);
    } else if (isPWA && !hasSeenPwaSession) {
      setShouldShowSplash(true);
    }

    // Listen for manual trigger to view store landing page / hours anytime
    const handleOpenLanding = () => {
      setManualOpen(true);
    };

    window.addEventListener('open-cagla-landing', handleOpenLanding);

    return () => {
      window.removeEventListener('open-cagla-landing', handleOpenLanding);
    };
  }, []);

  // Do NOT show splash/landing overlay on admin portal!
  const isAdmin =
    Boolean(pathname && pathname.startsWith('/admin')) ||
    (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin'));

  if (isAdmin) {
    return null;
  }

  const shouldShow = manualOpen || shouldShowSplash;

  if (!shouldShow) return null;

  return (
    <StoreLandingPage
      forceShow={manualOpen}
      onEnterStore={() => {
        setShouldShowSplash(false);
        setManualOpen(false);
        if (typeof window !== 'undefined') {
          localStorage.setItem('cagla_device_splash_seen', 'true');
          sessionStorage.setItem('cagla_pwa_splash_seen', 'true');
          sessionStorage.setItem('cagla_seen_landing', 'true');
        }
      }}
      onClose={() => {
        setShouldShowSplash(false);
        setManualOpen(false);
        if (typeof window !== 'undefined') {
          localStorage.setItem('cagla_device_splash_seen', 'true');
          sessionStorage.setItem('cagla_pwa_splash_seen', 'true');
          sessionStorage.setItem('cagla_seen_landing', 'true');
        }
      }}
    />
  );
};
