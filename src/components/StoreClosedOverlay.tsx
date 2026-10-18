'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { isStoreOpen, subscribeToSettings } from '@/lib/settingsManager';
import { StoreLandingPage } from './StoreLandingPage';

export const StoreClosedOverlay = () => {
  const pathname = usePathname();
  const [storeIsOpen, setStoreIsOpen] = useState(true);
  const [hasSeenLanding, setHasSeenLanding] = useState(true);
  const [manualOpen, setManualOpen] = useState(false);

  useEffect(() => {
    // Check if user has already seen the landing page in this session
    if (typeof window !== 'undefined') {
      const seen = sessionStorage.getItem('cagla_seen_landing') === 'true';
      setHasSeenLanding(seen);
    }

    const check = () => {
      const openStatus = isStoreOpen();
      setStoreIsOpen(openStatus);
    };

    check();
    const unsub = subscribeToSettings(check);
    const interval = setInterval(check, 10000);

    // Listen for manual trigger to view store landing page / hours anytime
    const handleOpenLanding = () => {
      setManualOpen(true);
    };

    window.addEventListener('open-cagla-landing', handleOpenLanding);

    return () => {
      clearInterval(interval);
      unsub();
      window.removeEventListener('open-cagla-landing', handleOpenLanding);
    };
  }, []);

  // Do NOT show customer closed/landing overlay on admin portal!
  const isAdmin =
    Boolean(pathname && pathname.startsWith('/admin')) ||
    (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin'));

  if (isAdmin) {
    return null;
  }

  // Show landing if:
  // 1. Manually requested (via click on status bar or info button)
  // 2. First time opening the app (!hasSeenLanding)
  // 3. Store is currently closed and hasn't been explicitly entered
  const shouldShow = manualOpen || (!hasSeenLanding) || (!storeIsOpen && !hasSeenLanding);

  if (!shouldShow) return null;

  return (
    <StoreLandingPage
      forceShow={manualOpen}
      onEnterStore={() => {
        setHasSeenLanding(true);
        setManualOpen(false);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('cagla_seen_landing', 'true');
        }
      }}
      onClose={() => {
        setManualOpen(false);
      }}
    />
  );
};
