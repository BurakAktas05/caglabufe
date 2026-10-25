'use client';

import React, { useState, useEffect } from 'react';
import { Bell, X, Check } from 'lucide-react';
import { isPushSupported, getNotificationPermission, requestNotificationPermission } from '@/lib/pushNotifications';
import { useApp } from '@/context/AppContext';

export const NotificationPromptBanner = () => {
  const [show, setShow] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { showToast, cart } = useApp();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!isPushSupported()) return;

    // Only prompt if permission is currently 'default' (not yet granted or denied)
    const perm = getNotificationPermission();
    if (perm !== 'default') return;

    // Check if dismissed recently (within 2 days)
    const dismissed = localStorage.getItem('caglabufe_notif_dismissed');
    if (dismissed) {
      const daysPassed = (Date.now() - parseInt(dismissed, 10)) / (1000 * 60 * 60 * 24);
      if (daysPassed < 2) return;
    }

    // Delay 2.5s for smooth entrance after page load
    const timer = setTimeout(() => {
      setShow(true);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  const handleEnable = async () => {
    setIsLoading(true);
    try {
      const granted = await requestNotificationPermission();
      if (granted) {
        showToast('Sipariş bildirimleri başarıyla açıldı!', 'success');
        setShow(false);
      } else {
        setShow(false);
        localStorage.setItem('caglabufe_notif_dismissed', Date.now().toString());
      }
    } catch {
      setShow(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem('caglabufe_notif_dismissed', Date.now().toString());
  };

  if (!show || cart.length > 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '68px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'calc(100% - 20px)',
        maxWidth: '460px',
        zIndex: 80,
        backgroundColor: '#1E1B4B',
        color: '#FFFFFF',
        borderRadius: '16px',
        padding: '10px 12px',
        boxShadow: '0 10px 30px -5px rgba(30, 27, 75, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '10px',
        animation: 'fadeInDown 0.35s ease-out',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
        <div
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            backgroundColor: '#5D3EBC',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            color: '#FFD10D',
          }}
        >
          <Bell size={20} />
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: '13px', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.2 }}>
            Sipariş Bildirimlerini Açın
          </div>
          <div style={{ fontSize: '11px', color: '#CBD5E1', marginTop: '2px', lineHeight: 1.3 }}>
            Kurye yola çıktığında anında bildirim alın
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
        <button
          type="button"
          onClick={handleEnable}
          disabled={isLoading}
          style={{
            backgroundColor: '#FFD10D',
            color: '#1E1B4B',
            border: 'none',
            borderRadius: '10px',
            padding: '7px 12px',
            fontSize: '12px',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            whiteSpace: 'nowrap',
          }}
        >
          {isLoading ? '...' : (
            <>
              <Check size={14} />
              <span>İzin Ver</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleDismiss}
          style={{
            background: 'none',
            border: 'none',
            color: '#94A3B8',
            padding: '4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="Kapat"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
};
