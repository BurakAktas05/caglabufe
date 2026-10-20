'use client';

import React from 'react';
import { BannedUser } from '@/types';
import {
  ShieldAlert,
  Phone,
  MessageCircle,
  LogOut,
  Calendar,
  AlertTriangle,
  Lock,
} from 'lucide-react';
import { formatPhoneNumber } from '@/lib/security';
import { useApp } from '@/context/AppContext';

interface BannedUserModalProps {
  bannedInfo: BannedUser | null;
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  storePhone?: string;
  storeWhatsApp?: string;
}

const LOCALE_DATE_MAP: Record<string, string> = {
  tr: 'tr-TR',
  en: 'en-US',
  ru: 'ru-RU',
  ar: 'ar-SA',
  fr: 'fr-FR',
};

export const BannedUserModal: React.FC<BannedUserModalProps> = ({
  bannedInfo,
  isOpen,
  onLogout,
  storePhone = '0542 000 7878',
  storeWhatsApp = '905420007878',
}) => {
  const { t, locale, dir } = useApp();

  if (!isOpen || !bannedInfo) return null;

  const rawWhatsApp = storeWhatsApp.replace(/\D/g, '');
  const cleanPhone = storePhone.replace(/\s+/g, '');
  const intlLocale = LOCALE_DATE_MAP[locale] || 'tr-TR';

  let formattedDate = '';
  try {
    if (bannedInfo.bannedAt) {
      formattedDate = new Intl.DateTimeFormat(intlLocale, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(bannedInfo.bannedAt));
    }
  } catch {
    formattedDate = bannedInfo.bannedAt || '';
  }

  const formattedUserPhone = formatPhoneNumber(bannedInfo.phone);

  const appealText = encodeURIComponent(
    t(
      'bannedAppealMessageTemplate',
      `Merhaba Çağla Büfe, ${formattedUserPhone} nolu telefonum için sistemde askıya alınma uyarısı görüyorum. Bir yanlışlık olduğunu düşünüyorum, yardımcı olabilir misiniz?`,
      { phone: formattedUserPhone }
    )
  );

  return (
    <div
      className="modal-overlay"
      dir={dir}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        backgroundColor: 'rgba(15, 23, 42, 0.88)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.25s ease-out',
      }}
    >
      <div
        className="banned-card"
        style={{
          width: '100%',
          maxWidth: '470px',
          backgroundColor: '#FFFFFF',
          borderRadius: '26px',
          boxShadow:
            '0 25px 60px -12px rgba(220, 38, 38, 0.35), 0 0 0 1px rgba(239, 68, 68, 0.2)',
          overflow: 'hidden',
          animation: 'modalSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Top Warning Banner with Glowing Shield */}
        <div
          style={{
            backgroundColor: '#DC2626',
            backgroundImage:
              'radial-gradient(circle at 50% 20%, #EF4444 0%, #B91C1C 70%, #991B1B 100%)',
            padding: '30px 24px 24px',
            textAlign: 'center',
            color: '#FFFFFF',
            position: 'relative',
          }}
        >
          {/* Status Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'rgba(0, 0, 0, 0.25)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              padding: '4px 12px',
              borderRadius: '999px',
              fontSize: '11px',
              fontWeight: 800,
              letterSpacing: '0.6px',
              textTransform: 'uppercase',
              marginBottom: '14px',
            }}
          >
            <Lock size={12} color="#FCA5A5" />
            <span>
              {t('bannedStatusBadge', 'GÜVENLİK KISITLAMASI AKTİF')}
            </span>
          </div>

          <div
            style={{
              width: '68px',
              height: '68px',
              borderRadius: '22px',
              backgroundColor: 'rgba(255, 255, 255, 0.16)',
              border: '2px solid rgba(255, 255, 255, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 14px',
              boxShadow: '0 12px 24px rgba(0, 0, 0, 0.25)',
            }}
          >
            <ShieldAlert size={38} color="#FFFFFF" />
          </div>

          <h2
            style={{
              fontSize: '22px',
              fontWeight: 900,
              letterSpacing: '-0.3px',
              margin: '0 0 6px 0',
              lineHeight: 1.25,
            }}
          >
            {t('bannedModalTitle', 'Erişiminiz Askıya Alındı')}
          </h2>

          <p
            style={{
              fontSize: '13px',
              opacity: 0.92,
              margin: 0,
              lineHeight: 1.45,
              fontWeight: 500,
              maxWidth: '380px',
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          >
            {t(
              'bannedModalSubtitle',
              'Hesabınız Çağla Büfe sipariş sisteminden geçici / kalıcı olarak kısıtlanmıştır.'
            )}
          </p>
        </div>

        {/* Content Body */}
        <div style={{ padding: '24px 22px 22px' }}>
          {/* Reason Box */}
          <div
            style={{
              backgroundColor: '#FEF2F2',
              border: '1.5px solid #FCA5A5',
              borderRadius: '18px',
              padding: '16px 18px',
              marginBottom: '18px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '11px',
                fontWeight: 800,
                color: '#991B1B',
                marginBottom: '8px',
                textTransform: 'uppercase',
                letterSpacing: '0.6px',
              }}
            >
              <AlertTriangle size={15} color="#DC2626" />
              <span>{t('bannedReasonLabel', 'Engellenme Gerekçesi')}</span>
            </div>

            <div
              style={{
                fontSize: '15px',
                fontWeight: 700,
                color: '#1F2937',
                lineHeight: 1.45,
                backgroundColor: '#FFFFFF',
                padding: '12px 14px',
                borderRadius: '12px',
                border: '1px solid #FECDD3',
                boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.03)',
              }}
            >
              &ldquo;
              {bannedInfo.reason ||
                t(
                  'bannedDefaultReason',
                  'Kötü niyetli sipariş / Güvenlik ihlali'
                )}
              &rdquo;
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '11px',
                color: '#6B7280',
                marginTop: '12px',
                fontWeight: 600,
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              {formattedDate && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  <Calendar size={13} color="#9CA3AF" />
                  <span>
                    {t('bannedDateLabel', 'Tarih')}: {formattedDate}
                  </span>
                </span>
              )}
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                <Phone size={13} color="#9CA3AF" />
                <span>
                  {t('bannedPhoneLabel', 'Telefon')}: {formattedUserPhone}
                </span>
              </span>
            </div>
          </div>

          {/* Policy explanation notice */}
          <p
            style={{
              fontSize: '12px',
              color: '#4B5563',
              lineHeight: 1.55,
              marginBottom: '20px',
              textAlign: 'center',
              backgroundColor: '#F9FAFB',
              padding: '10px 14px',
              borderRadius: '12px',
              border: '1px solid #F3F4F6',
            }}
          >
            {t(
              'bannedPolicyNotice',
              'Kapıda teslim alınmayan siparişler, sahte bildirimler veya işletme kurallarına aykırı durumlarda sipariş girişi kısıtlanır. Bir yanlışlık olduğunu düşünüyorsanız lütfen işletmemizle görüşünüz.'
            )}
          </p>

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <a
              href={`https://wa.me/${rawWhatsApp}?text=${appealText}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                backgroundColor: '#10B981',
                backgroundImage:
                  'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                color: '#FFFFFF',
                padding: '13px 18px',
                borderRadius: '14px',
                fontSize: '14px',
                fontWeight: 800,
                textDecoration: 'none',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
                transition: 'all 0.15s ease',
              }}
            >
              <MessageCircle size={18} />
              <span>
                {t('bannedWhatsappAppeal', 'Büfe WhatsApp İtiraz / İletişim')}
              </span>
            </a>

            <a
              href={`tel:${cleanPhone}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                backgroundColor: '#F3F4F6',
                color: '#1F2937',
                padding: '12px 18px',
                borderRadius: '14px',
                fontSize: '14px',
                fontWeight: 700,
                textDecoration: 'none',
                border: '1px solid #E5E7EB',
                transition: 'all 0.15s ease',
              }}
            >
              <Phone size={17} color="#4B5563" />
              <span>
                {t('bannedCallStore', `Büfeyi Ara: ${storePhone}`, {
                  phone: storePhone,
                })}
              </span>
            </a>

            <button
              type="button"
              onClick={onLogout}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                backgroundColor: 'transparent',
                color: '#DC2626',
                padding: '10px',
                borderRadius: '12px',
                fontSize: '13px',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                marginTop: '4px',
                transition: 'background-color 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#FEF2F2';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <LogOut size={15} />
              <span>
                {t('bannedLogoutSafe', 'Hesaptan Güvenli Çıkış Yap')}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
