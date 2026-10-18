'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Clock, Sparkles, Phone, MessageCircle, ArrowRight, ShieldCheck, Bike, Zap, ShoppingBag, X } from 'lucide-react';
import { getSystemSettings, isStoreOpen, subscribeToSettings } from '@/lib/settingsManager';

interface StoreLandingPageProps {
  onEnterStore?: () => void;
  forceShow?: boolean;
  onClose?: () => void;
}

export const StoreLandingPage: React.FC<StoreLandingPageProps> = ({
  onEnterStore,
  forceShow = false,
  onClose,
}) => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(true);
  const [openTime, setOpenTime] = useState('16:00');
  const [closeTime, setCloseTime] = useState('03:00');
  const [storePhone, setStorePhone] = useState('0542 000 7878');
  const [whatsAppPhone, setWhatsAppPhone] = useState('905420007878');
  const [timeUntilOpen, setTimeUntilOpen] = useState<string>('');

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

      // Calculate countdown to next opening if closed
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
        setTimeUntilOpen(`${diffHrs > 0 ? `${diffHrs} saat ` : ''}${diffMins} dakika`);
      }
    };

    update();
    const unsub = subscribeToSettings(update);
    const interval = setInterval(update, 15000);
    return () => {
      clearInterval(interval);
      unsub();
    };
  }, []);

  const isAdmin = Boolean(pathname && pathname.startsWith('/admin'));
  if (isAdmin) return null;

  const handleStart = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('cagla_seen_landing', 'true');
    }
    if (onEnterStore) onEnterStore();
    if (onClose) onClose();
  };

  const cleanPhone = storePhone.replace(/\s+/g, '');

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'linear-gradient(180deg, #181236 0%, #0D0A21 60%, #05030A 100%)',
        color: '#FFFFFF',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        WebkitOverflowScrolling: 'touch',
        fontFamily: 'inherit',
      }}
    >
      {/* Optional Close Button if modal opened from header */}
      {forceShow && onClose && (
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 10,
          }}
          aria-label="Kapat"
        >
          <X size={20} />
        </button>
      )}

      {/* Main Content Container */}
      <div
        style={{
          maxWidth: '680px',
          width: '100%',
          margin: '0 auto',
          padding: '40px 20px 60px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          boxSizing: 'border-box',
        }}
      >
        {/* Glow Ambient behind Logo */}
        <div
          style={{
            position: 'relative',
            width: '120px',
            height: '120px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: '-10px',
              borderRadius: '30px',
              background: 'radial-gradient(circle, rgba(255, 209, 13, 0.4) 0%, rgba(93, 62, 188, 0.6) 70%, transparent 100%)',
              filter: 'blur(16px)',
              animation: 'pulse 3s infinite',
            }}
          />
          <div
            style={{
              position: 'relative',
              width: '110px',
              height: '110px',
              borderRadius: '26px',
              overflow: 'hidden',
              boxShadow: '0 12px 35px rgba(0, 0, 0, 0.6), 0 0 0 2px rgba(255, 209, 13, 0.4)',
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

        {/* Brand Title with High Visual Importance */}
        <div style={{ marginBottom: '18px' }}>
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
              letterSpacing: '1px',
              marginBottom: '10px',
            }}
          >
            <Sparkles size={13} color="#FFD10D" />
            <span>Karabük &amp; KYK Yurtları Gece Marketi</span>
          </div>

          <h1
            style={{
              fontSize: 'clamp(28px, 6vw, 42px)',
              fontWeight: 950,
              margin: '0 0 6px 0',
              letterSpacing: '-1px',
              lineHeight: 1.15,
              background: 'linear-gradient(135deg, #FFFFFF 0%, #F5F3FF 50%, #FFD10D 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            ÇAĞLA BÜFE
          </h1>
          <p
            style={{
              fontSize: '14px',
              color: '#A5B4FC',
              fontWeight: 600,
              margin: 0,
              letterSpacing: '0.2px',
            }}
          >
            Sıcak Tost, Soğuk İçecek, Atıştırmalık &amp; Hızlı Kapıya Teslimat
          </p>
        </div>

        {/* HERO WORKING HOURS CARD (Büyük Çalışma Saatleri Kartı) */}
        <div
          style={{
            width: '100%',
            backgroundColor: 'rgba(30, 27, 75, 0.75)',
            border: isOpen ? '1.5px solid rgba(16, 185, 129, 0.4)' : '1.5px solid rgba(245, 158, 11, 0.4)',
            borderRadius: '20px',
            padding: '24px 20px',
            boxShadow: isOpen
              ? '0 12px 30px rgba(16, 185, 129, 0.15)'
              : '0 12px 30px rgba(245, 158, 11, 0.15)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            marginBottom: '22px',
            boxSizing: 'border-box',
          }}
        >
          {/* Status Badge */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '12px' }}>
            <span
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: isOpen ? '#10B981' : '#F59E0B',
                boxShadow: isOpen ? '0 0 10px #10B981' : '0 0 10px #F59E0B',
                display: 'inline-block',
              }}
            />
            <span
              style={{
                fontSize: '13px',
                fontWeight: 900,
                color: isOpen ? '#34D399' : '#FBBF24',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              {isOpen ? 'ŞU ANDA AÇIĞIZ' : 'ŞU ANDA KAPALIYIZ'}
            </span>
          </div>

          {/* Working Hours Text */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              padding: '12px 18px',
              borderRadius: '12px',
              marginBottom: '14px',
            }}
          >
            <Clock size={22} color="#FFD10D" />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>
                Resmi Hizmet Saatlerimiz
              </div>
              <div style={{ fontSize: '20px', fontWeight: 900, color: '#FFFFFF', letterSpacing: '0.5px' }}>
                Her Gün: {openTime} – {closeTime}
              </div>
            </div>
          </div>

          {/* Additional note / countdown */}
          <p style={{ margin: 0, fontSize: '12px', color: '#CBD5E1', lineHeight: 1.5 }}>
            {isOpen ? (
              <span>
                🔥 <strong>Gece saat {closeTime}&apos;e kadar</strong> Karabük 100. Yıl ve tüm KYK Yurtlarına sıcak tost ve market siparişleriniz teslim edilmektedir.
              </span>
            ) : (
              <span>
                🌙 Sipariş saatleri dışındayız. Saat <strong>{openTime}</strong>&apos;da açılıyoruz. {timeUntilOpen && `(Açılışa yaklaşık ${timeUntilOpen} kaldı)`}. Menüyü şimdiden inceleyebilirsiniz!
              </span>
            )}
          </p>
        </div>

        {/* 3 Pillars / Feature Cards */}
        <div
          style={{
            width: '100%',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px',
            marginBottom: '26px',
          }}
        >
          <div
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '16px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                backgroundColor: 'rgba(93, 62, 188, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 10px',
              }}
            >
              <Zap size={22} color="#A78BFA" />
            </div>
            <h4 style={{ margin: '0 0 4px 0', fontSize: '13px', fontWeight: 800 }}>20-30 Dk Teslimat</h4>
            <p style={{ margin: 0, fontSize: '11px', color: '#94A3B8', lineHeight: 1.4 }}>
              100. Yıl &amp; KYK Yurtları kapınıza kadar sıcak servis.
            </p>
          </div>

          <div
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '16px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                backgroundColor: 'rgba(16, 185, 129, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 10px',
              }}
            >
              <Bike size={22} color="#34D399" />
            </div>
            <h4 style={{ margin: '0 0 4px 0', fontSize: '13px', fontWeight: 800 }}>Sıcak Tost &amp; Market</h4>
            <p style={{ margin: 0, fontSize: '11px', color: '#94A3B8', lineHeight: 1.4 }}>
              Gece acıkanlara özel tost, cips, çikolata ve soğuk içecekler.
            </p>
          </div>

          <div
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '16px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                backgroundColor: 'rgba(255, 209, 13, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 10px',
              }}
            >
              <ShieldCheck size={22} color="#FFD10D" />
            </div>
            <h4 style={{ margin: '0 0 4px 0', fontSize: '13px', fontWeight: 800 }}>Kapıda Ödeme</h4>
            <p style={{ margin: 0, fontSize: '11px', color: '#94A3B8', lineHeight: 1.4 }}>
              Kapıda Nakit veya Temassız Kredi/Banka Kartı (POS).
            </p>
          </div>
        </div>

        {/* PRIMARY CALL TO ACTION BUTTON (Hemen Alışverişe / Menüye Geç) */}
        <button
          type="button"
          onClick={handleStart}
          style={{
            width: '100%',
            maxWidth: '420px',
            padding: '16px 24px',
            borderRadius: '16px',
            backgroundColor: '#FFD10D',
            color: '#1F2937',
            fontSize: '16px',
            fontWeight: 900,
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            boxShadow: '0 10px 25px rgba(255, 209, 13, 0.4)',
            transition: 'all 0.2s ease',
            marginBottom: '16px',
          }}
        >
          <ShoppingBag size={20} color="#1F2937" />
          <span>{isOpen ? 'HEMEN SİPARİŞE BAŞLA' : 'ÜRÜNLERİ & MENÜYÜ İNCELE'}</span>
          <ArrowRight size={18} color="#1F2937" />
        </button>

        {/* Contact Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <a
            href={`tel:${cleanPhone}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 16px',
              borderRadius: '10px',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              color: '#FFFFFF',
              fontSize: '12px',
              fontWeight: 700,
              textDecoration: 'none',
              border: '1px solid rgba(255, 255, 255, 0.12)',
            }}
          >
            <Phone size={14} color="#34D399" />
            <span>{storePhone}</span>
          </a>

          <a
            href={`https://wa.me/${whatsAppPhone}?text=${encodeURIComponent('Merhaba Çağla Büfe, sipariş vermek istiyorum.')}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 16px',
              borderRadius: '10px',
              backgroundColor: 'rgba(37, 211, 102, 0.15)',
              color: '#25D366',
              fontSize: '12px',
              fontWeight: 700,
              textDecoration: 'none',
              border: '1px solid rgba(37, 211, 102, 0.3)',
            }}
          >
            <MessageCircle size={14} color="#25D366" />
            <span>WhatsApp Sipariş</span>
          </a>
        </div>
      </div>
    </div>
  );
};
