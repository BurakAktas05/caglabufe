'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { RefreshCw, Home, AlertTriangle } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[App Error Boundary Caught]:', error);
  }, [error]);

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#0f0d23',
        backgroundImage: 'radial-gradient(circle at 50% 25%, #2e1065 0%, #0f0d23 85%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        color: '#ffffff',
        fontFamily: 'inherit',
      }}
    >
      <div
        style={{
          maxWidth: '460px',
          width: '100%',
          backgroundColor: 'rgba(30, 27, 75, 0.7)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: '28px',
          padding: '38px 26px',
          textAlign: 'center',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '20px',
            backgroundColor: 'rgba(239, 68, 68, 0.2)',
            color: '#ef4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            border: '1px solid rgba(239, 68, 68, 0.3)',
          }}
        >
          <AlertTriangle size={30} />
        </div>

        <h1 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '8px', color: '#ffffff' }}>
          Beklenmedik Bir Durum Oluştu
        </h1>

        <p style={{ fontSize: '14px', color: '#cbd5e1', lineHeight: 1.55, marginBottom: '24px' }}>
          Sayfa yüklenirken geçici bir aksaklık meydana geldi. Sayfayı yenileyerek siparişinize kaldığınız yerden devam edebilirsiniz.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button
            onClick={() => reset()}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '14px',
              borderRadius: '14px',
              backgroundColor: '#FFD10D',
              color: '#191919',
              fontWeight: 800,
              fontSize: '15px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 18px rgba(255, 209, 13, 0.3)',
            }}
          >
            <RefreshCw size={18} />
            <span>Sayfayı Yeniden Yükle</span>
          </button>

          <Link
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px',
              borderRadius: '14px',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              color: '#cbd5e1',
              fontWeight: 700,
              fontSize: '14px',
              textDecoration: 'none',
              border: '1px solid rgba(255, 255, 255, 0.12)',
            }}
          >
            <Home size={16} />
            <span>Ana Sayfaya Dön</span>
          </Link>
        </div>

        <div style={{ marginTop: '22px', fontSize: '11px', color: '#94a3b8' }}>
          Hata Kodu: {error.digest || 'ERR_RUNTIME_GENERIC'}
        </div>
      </div>
    </div>
  );
}
