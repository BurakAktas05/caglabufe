'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { getSystemSettings, isStoreOpen, subscribeToSettings } from '@/lib/settingsManager';
import { Clock, Moon, ArrowRight } from 'lucide-react';

export const StoreClosedOverlay = () => {
  const pathname = usePathname();
  const [open, setOpen] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);
  const [closedMessage, setClosedMessage] = useState('');
  const [openTime, setOpenTime] = useState('16:00');
  const [closeTime, setCloseTime] = useState('03:00');

  useEffect(() => {
    const check = () => {
      const isOpen = isStoreOpen();
      setOpen(isOpen);
      if (!isOpen) {
        const settings = getSystemSettings();
        const oTime = settings.storeOpenTime || '16:00';
        const cTime = settings.storeCloseTime || '03:00';
        setOpenTime(oTime);
        setCloseTime(cTime);
        const dynamicMsg = `Sipariş saatleri dışındayız. Hizmet saatlerimiz her gün ${oTime} - ${cTime} arasıdır.`;
        setClosedMessage(settings.closedMessage?.includes('Hizmet saatlerimiz') ? dynamicMsg : (settings.closedMessage || dynamicMsg));
      }
    };

    check();
    const unsub = subscribeToSettings(() => check());
    const interval = setInterval(check, 10000);
    return () => {
      clearInterval(interval);
      unsub();
    };
  }, []);

  // Do NOT show customer closed overlay on admin portal!
  const isAdmin =
    Boolean(pathname && pathname.startsWith('/admin')) ||
    (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin'));

  if (isAdmin) {
    return null;
  }

  if (open || isDismissed) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(17, 24, 39, 0.75)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          padding: '36px 28px',
          maxWidth: '420px',
          width: '100%',
          textAlign: 'center',
          border: '1px solid #E5E7EB',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
        }}
      >
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '12px',
            backgroundColor: '#F3F0FE',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}
        >
          <Moon size={28} color="#5D3EBC" />
        </div>

        <h2
          style={{
            fontSize: '20px',
            fontWeight: 800,
            color: '#1F2937',
            marginBottom: '6px',
          }}
        >
          Şu Anda Kapalıyız
        </h2>

        <p
          style={{
            fontSize: '13px',
            color: '#4B5563',
            lineHeight: 1.5,
            marginBottom: '20px',
          }}
        >
          {closedMessage}
        </p>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            backgroundColor: '#F3F4F6',
            padding: '10px 16px',
            borderRadius: '8px',
            color: '#374151',
            fontSize: '13px',
            fontWeight: 700,
            marginBottom: '20px',
          }}
        >
          <Clock size={16} color="#5D3EBC" />
          <span>Hizmet Saatleri: {openTime} - {closeTime}</span>
        </div>

        <button
          type="button"
          className="btn-primary"
          onClick={() => setIsDismissed(true)}
          style={{ width: '100%', marginBottom: '10px' }}
        >
          <span>Ürünleri &amp; Menüyü İncele</span>
          <ArrowRight size={16} />
        </button>

        <p
          style={{
            fontSize: '12px',
            color: '#9CA3AF',
          }}
        >
          Katalogdaki ürünlere göz atabilir, açılış saatinde sipariş verebilirsiniz.
        </p>
      </div>
    </div>
  );
};
