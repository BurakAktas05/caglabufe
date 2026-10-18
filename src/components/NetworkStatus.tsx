'use client';

import React, { useState, useEffect } from 'react';
import { WifiOff, CheckCircle2 } from 'lucide-react';

export const NetworkStatus = () => {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [showReconnected, setShowReconnected] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      const timer = setTimeout(() => {
        setShowReconnected(false);
      }, 3500);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && !showReconnected) {
    return null;
  }

  if (!isOnline) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 'env(safe-area-inset-top, 0px)',
          left: 0,
          right: 0,
          zIndex: 9999,
          backgroundColor: '#ef4444',
          color: '#ffffff',
          padding: '8px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          fontSize: '13px',
          fontWeight: 700,
          boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
          animation: 'slideDown 0.3s ease',
        }}
      >
        <WifiOff size={16} />
        <span>İnternet bağlantısı kesildi. Çevrimdışı moddasınız.</span>
      </div>
    );
  }

  if (showReconnected) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 'env(safe-area-inset-top, 0px)',
          left: 0,
          right: 0,
          zIndex: 9999,
          backgroundColor: '#10b981',
          color: '#ffffff',
          padding: '8px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          fontSize: '13px',
          fontWeight: 700,
          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
          animation: 'slideDown 0.3s ease',
        }}
      >
        <CheckCircle2 size={16} />
        <span>Yeniden bağlandınız! Veriler güncellendi.</span>
      </div>
    );
  }

  return null;
};
