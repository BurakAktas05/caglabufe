'use client';

import React from 'react';
import {
  X,
  Phone,
  MessageCircle,
  Headphones,
  Wrench,
  ShoppingBag,
  ExternalLink,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupportModal: React.FC<SupportModalProps> = ({ isOpen, onClose }) => {
  const { systemSettings, user, t } = useApp();

  if (!isOpen) return null;

  const storePhone = systemSettings.storePhone || '0542 000 7878';
  const cleanStorePhone = storePhone.replace(/\s+/g, '');
  const rawStoreWhatsApp = (systemSettings.storeWhatsApp || '905420007878').replace(/\D/g, '');
  const rawTechWhatsApp = (systemSettings.techSupportWhatsApp || '905550000000').replace(/\D/g, '');

  const storeOrderMessage = encodeURIComponent(
    `Merhaba Çağla Büfe, siparişim / teslimat hakkında bilgi almak istiyorum.`
  );

  const techSupportMessage = encodeURIComponent(
    `Merhaba, Çağla Büfe uygulamasında teknik bir sorunla karşılaştım / geri bildirimde bulunmak istiyorum.\n${
      user ? `Müşteri: ${user.fullName} (${user.phone})\n` : ''
    }Sorun Detayı: `
  );

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 9999 }}>
      <div
        className="bottom-sheet"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '480px',
          margin: '0 auto',
          borderRadius: '24px 24px 0 0',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div className="sheet-header" style={{ padding: '18px 20px', borderBottom: '1px solid #F1F5F9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '12px',
                backgroundColor: '#F3F0FE',
                color: '#5D3EBC',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Headphones size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: 900, color: '#1F2937', margin: 0 }}>
                {t('supportTitle', 'Canlı Destek & İletişim')}
              </h3>
              <p style={{ fontSize: '11px', color: '#6B7280', margin: '2px 0 0', fontWeight: 600 }}>
                {t('supportSubtitle', 'Sipariş veya teknik sorularınız için doğru kanalı seçin')}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="sheet-close-btn"
            onClick={onClose}
            aria-label="Kapat"
            style={{
              background: '#F3F4F6',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <X size={18} color="#4B5563" />
          </button>
        </div>

        {/* Body */}
        <div className="sheet-body" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* 1. CHANNEL: SİPARİŞ & TESLİMAT HATTI (BÜFE) */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              border: '1.5px solid #E0E7FF',
              borderRadius: '18px',
              padding: '16px',
              boxShadow: '0 2px 8px rgba(93, 62, 188, 0.05)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '8px',
                  backgroundColor: '#EEF2FF',
                  color: '#4F46E5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ShoppingBag size={16} />
              </div>
              <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#1E1B4B', margin: 0 }}>
                {t('orderSupportTitle', 'Sipariş & Teslimat Hattı (Büfe)')}
              </h4>
            </div>

            <p style={{ fontSize: '12px', color: '#4B5563', margin: '0 0 12px', lineHeight: 1.45 }}>
              {t('orderSupportDesc', 'Siparişim nerede, adres güncelleme veya ürün ekleme için arayın:')}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <a
                href={`tel:${cleanStorePhone}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '10px 12px',
                  backgroundColor: '#5D3EBC',
                  color: '#FFFFFF',
                  borderRadius: '12px',
                  fontSize: '13px',
                  fontWeight: 800,
                  textDecoration: 'none',
                  boxShadow: '0 2px 6px rgba(93, 62, 188, 0.25)',
                }}
              >
                <Phone size={15} />
                <span>{t('callStore', 'Büfeyi Ara')}</span>
              </a>

              <a
                href={`https://wa.me/${rawStoreWhatsApp}?text=${storeOrderMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '10px 12px',
                  backgroundColor: '#10B981',
                  color: '#FFFFFF',
                  borderRadius: '12px',
                  fontSize: '13px',
                  fontWeight: 800,
                  textDecoration: 'none',
                  boxShadow: '0 2px 6px rgba(16, 185, 129, 0.25)',
                }}
              >
                <MessageCircle size={15} />
                <span>{t('whatsappStore', 'Büfe WhatsApp')}</span>
              </a>
            </div>

            <div
              style={{
                marginTop: '10px',
                fontSize: '11px',
                color: '#6366F1',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontWeight: 600,
              }}
            >
              <Clock size={12} />
              <span>Hizmet Saatleri: {systemSettings.storeOpenTime || '16:00'} - {systemSettings.storeCloseTime || '03:00'}</span>
            </div>
          </div>

          {/* 2. CHANNEL: UYGULAMA & TEKNİK DESTEK (YAZILIMCI) */}
          <div
            style={{
              backgroundColor: '#F8FAFC',
              border: '1.5px solid #CBD5E1',
              borderRadius: '18px',
              padding: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '8px',
                    backgroundColor: '#E2E8F0',
                    color: '#334155',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Wrench size={16} />
                </div>
                <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  {t('techSupportTitle', 'Uygulama & Yazılım Teknik Destek')}
                </h4>
              </div>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  backgroundColor: '#E0E7FF',
                  color: '#4338CA',
                  padding: '2px 7px',
                  borderRadius: '6px',
                }}
              >
                {t('techSupportBadge', 'Geliştirici')}
              </span>
            </div>

            <p style={{ fontSize: '12px', color: '#475569', margin: '0 0 12px', lineHeight: 1.45 }}>
              {t('techSupportDesc', 'Uygulamada bir hata, donma veya özellik öneriniz varsa geliştiriciye yazın:')}
            </p>

            <a
              href={`https://wa.me/${rawTechWhatsApp}?text=${techSupportMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px 16px',
                backgroundColor: '#0F172A',
                color: '#FFFFFF',
                borderRadius: '14px',
                fontSize: '13px',
                fontWeight: 800,
                textDecoration: 'none',
                boxShadow: '0 4px 10px rgba(15, 23, 42, 0.2)',
                transition: 'all 0.15s ease',
              }}
            >
              <MessageCircle size={16} color="#22C55E" />
              <span>{t('whatsappDev', "Geliştiriciye WhatsApp'tan Yaz")}</span>
              <ExternalLink size={13} style={{ opacity: 0.6 }} />
            </a>

            <div
              style={{
                marginTop: '10px',
                fontSize: '11px',
                color: '#64748B',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontWeight: 500,
              }}
            >
              <Sparkles size={12} color="#F59E0B" />
              <span>Siparişinizle ilgili olmayan sadece teknik/yazılımsal arızalar içindir.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
