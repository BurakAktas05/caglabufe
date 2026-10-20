'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Sparkles, Phone, MessageCircle, ArrowRight, ShieldCheck, Bike, Zap, ShoppingBag, X } from 'lucide-react';
import { getSystemSettings, isStoreOpen, subscribeToSettings } from '@/lib/settingsManager';

interface StoreLandingPageProps {
  onEnterStore?: () => void;
  forceShow?: boolean; // When opened manually via button/info
  onClose?: () => void;
  autoCloseDuration?: number; // In ms, default 2400
}

export const StoreLandingPage: React.FC<StoreLandingPageProps> = ({
  onEnterStore,
  forceShow = false,
  onClose,
  autoCloseDuration = 2400,
}) => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(true);
  const [openTime, setOpenTime] = useState('16:00');
  const [closeTime, setCloseTime] = useState('03:00');
  const [storePhone, setStorePhone] = useState('0542 000 7878');
  const [whatsAppPhone, setWhatsAppPhone] = useState('905420007878');
  const [timeUntilOpen, setTimeUntilOpen] = useState<string>('');

  // Auto-close Splash screen state
  const [progress, setProgress] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const isClosingRef = useRef(false);

  useEffect(() => {
    const update = () => {
      const openStatus = isStoreOpen();
      setIsOpen(openStatus);
      const settings = getSystemSettings();
      const oTime = settings.storeOpenTime || '16:00';
      const cTime = settings.storeCloseTime || '03:00';
      setOpenTime(oTime);
      setCloseTime(cTime);
      setStorePhone(settings.storePhone || '0542 000 7878');
      setWhatsAppPhone((settings.storeWhatsApp || '905420007878').replace(/\D/g, ''));

      if (!openStatus) {
        const now = new Date();
        const [oH, oM] = oTime.split(':').map(Number);
        const target = new Date(now);
        target.setHours(oH, oM, 0, 0);
        if (target.getTime() <= now.getTime()) {
          target.setDate(target.getDate() + 1);
        }
        const diffMs = target.getTime() - now.getTime();
        const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        setTimeUntilOpen(`${diffHrs > 0 ? `${diffHrs} sa ` : ''}${diffMins} dk`);
      }
    };

    update();
    const unsub = subscribeToSettings(update);
    return () => unsub();
  }, []);

  const triggerExit = useCallback(() => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;
    setIsExiting(true);

    setTimeout(() => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('cagla_device_splash_seen', 'true');
        sessionStorage.setItem('cagla_pwa_splash_seen', 'true');
        sessionStorage.setItem('cagla_seen_landing', 'true');
      }
      if (onEnterStore) onEnterStore();
      if (onClose) onClose();
    }, 320);
  }, [onEnterStore, onClose]);

  // Automatic progress & exit (only when NOT manually opened)
  useEffect(() => {
    if (forceShow) return;

    const intervalTime = 30; // update every 30ms
    const totalSteps = autoCloseDuration / intervalTime;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const pct = Math.min(100, Math.round((currentStep / totalSteps) * 100));
      setProgress(pct);

      if (currentStep >= totalSteps) {
        clearInterval(timer);
        triggerExit();
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, [forceShow, autoCloseDuration, triggerExit]);

  const handleInstantExit = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    triggerExit();
  };

  const isAdmin = Boolean(pathname && pathname.startsWith('/admin'));
  if (isAdmin) return null;

  const cleanPhone = storePhone.replace(/\s+/g, '');

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'radial-gradient(ellipse at 50% 20%, #20144D 0%, #0D0A21 65%, #05030A 100%)',
        color: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 'calc(env(safe-area-inset-top, 16px) + 12px) 20px calc(env(safe-area-inset-bottom, 16px) + 16px)',
        boxSizing: 'border-box',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        fontFamily: 'inherit',
        opacity: isExiting ? 0 : 1,
        transform: isExiting ? 'scale(1.02)' : 'scale(1)',
        transition: 'opacity 0.32s cubic-bezier(0.16, 1, 0.3, 1), transform 0.32s cubic-bezier(0.16, 1, 0.3, 1)',
        pointerEvents: isExiting ? 'none' : 'auto',
      }}
    >
      {/* Top Header: Badge & Skip Button */}
      <div
        style={{
          width: '100%',
          maxWidth: '540px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: 'rgba(255, 209, 13, 0.15)',
            border: '1px solid rgba(255, 209, 13, 0.35)',
            padding: '5px 12px',
            borderRadius: '20px',
            color: '#FFD10D',
            fontSize: '11px',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.6px',
          }}
        >
          <Sparkles size={13} color="#FFD10D" />
          <span>Karabük &amp; KYK Gece Marketi</span>
        </div>

        <button
          type="button"
          onClick={handleInstantExit}
          style={{
            background: 'rgba(255, 255, 255, 0.12)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: '#FFFFFF',
            padding: '6px 14px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            cursor: 'pointer',
            backdropFilter: 'blur(8px)',
            transition: 'background-color 0.15s ease',
          }}
          aria-label="Atla veya Kapat"
        >
          <span>{forceShow ? 'Kapat' : 'Atla'}</span>
          <X size={14} />
        </button>
      </div>

      {/* Center Body: Logo, Brand, Status & Chips */}
      <div
        style={{
          width: '100%',
          maxWidth: '500px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          margin: 'auto 0',
          padding: '16px 0',
        }}
      >
        {/* 3D Glowing Emblem */}
        <div
          style={{
            position: 'relative',
            width: '104px',
            height: '104px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: '-12px',
              borderRadius: '32px',
              background: 'radial-gradient(circle, rgba(255, 209, 13, 0.45) 0%, rgba(93, 62, 188, 0.65) 65%, transparent 100%)',
              filter: 'blur(16px)',
              animation: 'pulse 2.5s infinite ease-in-out',
            }}
          />
          <div
            style={{
              position: 'relative',
              width: '96px',
              height: '96px',
              borderRadius: '24px',
              overflow: 'hidden',
              boxShadow: '0 12px 30px rgba(0, 0, 0, 0.6), 0 0 0 2px rgba(255, 209, 13, 0.45)',
              backgroundColor: '#5D3EBC',
            }}
          >
            <Image
              src="/caglabufe_logo.jpg"
              alt="Çağla Büfe Logo"
              fill
              priority
              style={{ objectFit: 'cover' }}
            />
          </div>
        </div>

        {/* Title */}
        <h1
          style={{
            fontSize: 'clamp(26px, 6vw, 36px)',
            fontWeight: 950,
            margin: '0 0 4px 0',
            letterSpacing: '-0.8px',
            lineHeight: 1.1,
            background: 'linear-gradient(135deg, #FFFFFF 0%, #EDE9FE 60%, #FFD10D 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          ÇAĞLA BÜFE
        </h1>
        <p
          style={{
            fontSize: '13px',
            color: '#C4B5FD',
            fontWeight: 600,
            margin: '0 0 16px 0',
          }}
        >
          Sıcak Tost, Soğuk İçecek &amp; Gece Teslimatı
        </p>

        {/* Working Hours / Status Card */}
        <div
          style={{
            width: '100%',
            backgroundColor: isOpen ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
            border: isOpen ? '1.5px solid rgba(16, 185, 129, 0.4)' : '1.5px solid rgba(245, 158, 11, 0.4)',
            borderRadius: '16px',
            padding: '12px 16px',
            marginBottom: '16px',
            backdropFilter: 'blur(10px)',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <span
              style={{
                width: '9px',
                height: '9px',
                borderRadius: '50%',
                backgroundColor: isOpen ? '#10B981' : '#F59E0B',
                boxShadow: isOpen ? '0 0 10px #10B981' : '0 0 10px #F59E0B',
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontSize: '13px',
                fontWeight: 800,
                color: isOpen ? '#34D399' : '#FBBF24',
              }}
            >
              {isOpen ? `Şu Anda Açığız (${openTime} - ${closeTime})` : `🌙 Açılış: ${openTime} (Gece ${closeTime}'e kadar)`}
            </span>
          </div>
          {!isOpen && timeUntilOpen && (
            <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#CBD5E1', fontWeight: 600 }}>
              Açılışa yaklaşık <strong>{timeUntilOpen}</strong> kaldı • Menüyü inceleyebilirsiniz
            </p>
          )}
        </div>

        {/* 3 Quick Chips */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            flexWrap: 'wrap',
            width: '100%',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '6px 10px',
              borderRadius: '10px',
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              fontSize: '11px',
              fontWeight: 700,
              color: '#EDE9FE',
            }}
          >
            <Zap size={13} color="#FFD10D" />
            <span>20-30 Dk Teslimat</span>
          </div>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '6px 10px',
              borderRadius: '10px',
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              fontSize: '11px',
              fontWeight: 700,
              color: '#EDE9FE',
            }}
          >
            <Bike size={13} color="#34D399" />
            <span>Sıcak Tost &amp; Market</span>
          </div>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '6px 10px',
              borderRadius: '10px',
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              fontSize: '11px',
              fontWeight: 700,
              color: '#EDE9FE',
            }}
          >
            <ShieldCheck size={13} color="#A78BFA" />
            <span>Kapıda Ödeme</span>
          </div>
        </div>
      </div>

      {/* Bottom Area: Progress Bar or Enter Button */}
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
          flexShrink: 0,
        }}
      >
        {/* Animated Progress Bar (only on automatic splash) */}
        {!forceShow && (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
            <div
              style={{
                width: '100%',
                height: '5px',
                borderRadius: '6px',
                backgroundColor: 'rgba(255, 255, 255, 0.12)',
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${progress}%`,
                  background: 'linear-gradient(90deg, #5D3EBC, #FFD10D)',
                  borderRadius: '6px',
                  transition: 'width 0.04s linear',
                  boxShadow: '0 0 10px rgba(255, 209, 13, 0.6)',
                }}
              />
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                width: '100%',
                fontSize: '11px',
                color: '#A5B4FC',
                fontWeight: 600,
              }}
            >
              <span>{progress < 100 ? 'Çağla Büfe hazırlanıyor...' : 'Giriş yapılıyor...'}</span>
              <span>%{progress}</span>
            </div>
          </div>
        )}

        {/* Enter Store Button */}
        <button
          type="button"
          onClick={handleInstantExit}
          style={{
            width: '100%',
            padding: '14px 20px',
            borderRadius: '14px',
            backgroundColor: '#FFD10D',
            color: '#1F2937',
            fontSize: '15px',
            fontWeight: 900,
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: '0 8px 20px rgba(255, 209, 13, 0.35)',
            transition: 'transform 0.15s ease',
          }}
        >
          <ShoppingBag size={18} color="#1F2937" />
          <span>{isOpen ? 'HEMEN SİPARİŞE BAŞLA' : 'MENÜYÜ & ÜRÜNLERİ İNCELE'}</span>
          <ArrowRight size={17} color="#1F2937" />
        </button>

        {/* Quick Contact for manual inspection */}
        {forceShow && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '2px' }}>
            <a
              href={`tel:${cleanPhone}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '7px 12px',
                borderRadius: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                color: '#FFFFFF',
                fontSize: '11px',
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              <Phone size={13} color="#34D399" />
              <span>{storePhone}</span>
            </a>

            <a
              href={`https://wa.me/${whatsAppPhone}?text=${encodeURIComponent('Merhaba Çağla Büfe, sipariş vermek istiyorum.')}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '7px 12px',
                borderRadius: '8px',
                backgroundColor: 'rgba(37, 211, 102, 0.15)',
                color: '#25D366',
                fontSize: '11px',
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              <MessageCircle size={13} color="#25D366" />
              <span>WhatsApp</span>
            </a>
          </div>
        )}
      </div>
    </div>
  );
};
