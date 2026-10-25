'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { LANGUAGES, Locale } from '@/lib/i18n';
import { FLAG_ICONS } from './FlagIcons';
import { Globe, Check, ArrowRight, Sparkles } from 'lucide-react';

interface LanguageWelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LANGUAGE_DETAILS: Record<Locale, { subtitle: string; popular?: boolean }> = {
  tr: { subtitle: 'Karabük & KYK Yurtları (Varsayılan)', popular: true },
  en: { subtitle: 'International & Fast Delivery' },
  ru: { subtitle: 'Быстрая доставка по Карабуку' },
  ar: { subtitle: 'توصيل سريع للطلبات في كارابوك' },
  fr: { subtitle: 'Livraison rapide à Karabük' },
};

export const LanguageWelcomeModal: React.FC<LanguageWelcomeModalProps> = ({ isOpen, onClose }) => {
  const { locale, setLocale, setIsLanguageWelcomeOpen, showToast } = useApp();
  const [selected, setSelected] = useState<Locale>(locale || 'tr');

  if (!isOpen) return null;

  const handleConfirm = (chosenLocale: Locale = selected) => {
    setLocale(chosenLocale);
    if (typeof window !== 'undefined') {
      localStorage.setItem('caglabufe_locale', chosenLocale);
      localStorage.setItem('caglabufe_lang_selected', 'true');
    }
    setIsLanguageWelcomeOpen(false);
    onClose();
    showToast(
      chosenLocale === 'tr' ? 'Hoş geldiniz! Siparişinizi keyifle verebilirsiniz.' : 'Welcome! Enjoy ordering with Çağla Büfe.',
      'success'
    );
  };

  return (
    <div
      className="modal-overlay"
      style={{
        zIndex: 99999,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        alignItems: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={(e) => {
        // Prevent accidental closing by backdrop click on first launch - user must select their language
        e.stopPropagation();
      }}
    >
      <div
        className="bottom-sheet"
        style={{
          width: '100%',
          maxWidth: '460px',
          borderRadius: '24px',
          backgroundColor: '#FFFFFF',
          boxShadow: '0 25px 50px -12px rgba(93, 62, 188, 0.25), 0 10px 25px -5px rgba(0, 0, 0, 0.2)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
          animation: 'modalSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Decorative Gradient Banner */}
        <div
          style={{
            background: 'linear-gradient(135deg, #5D3EBC 0%, #7C3AED 50%, #4C1D95 100%)',
            padding: '24px 22px 20px',
            color: '#FFFFFF',
            position: 'relative',
            overflow: 'hidden',
            textAlign: 'center',
          }}
        >
          {/* Background Ambient Glow */}
          <div
            style={{
              position: 'absolute',
              top: '-30px',
              right: '-30px',
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 209, 13, 0.2)',
              filter: 'blur(30px)',
              pointerEvents: 'none',
            }}
          />

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(6px)',
              padding: '5px 12px',
              borderRadius: '999px',
              fontSize: '11px',
              fontWeight: 800,
              letterSpacing: '0.6px',
              textTransform: 'uppercase',
              color: '#FFD10D',
              marginBottom: '10px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
            }}
          >
            <Globe size={13} color="#FFD10D" />
            <span>Dil Tercihi • Language</span>
          </div>

          <h2
            style={{
              fontSize: '22px',
              fontWeight: 900,
              margin: '0 0 6px',
              letterSpacing: '-0.3px',
              color: '#FFFFFF',
              lineHeight: 1.25,
            }}
          >
            Hoş Geldiniz • Welcome
          </h2>

          <p
            style={{
              fontSize: '13px',
              margin: 0,
              color: '#E0E7FF',
              lineHeight: 1.45,
              fontWeight: 500,
            }}
          >
            Lütfen tercih ettiğiniz dili seçin / Please select your preferred language
          </p>
        </div>

        {/* Language Options List */}
        <div
          style={{
            padding: '14px 18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          {LANGUAGES.map((lang) => {
            const isSelected = selected === lang.code;
            const details = LANGUAGE_DETAILS[lang.code];

            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => {
                  setSelected(lang.code);
                }}
                onDoubleClick={() => handleConfirm(lang.code)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: '14px',
                  border: isSelected ? '2px solid #5D3EBC' : '1.5px solid #F1F5F9',
                  backgroundColor: isSelected ? '#F5F3FF' : '#FAFAFA',
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                  textAlign: 'left',
                  boxShadow: isSelected ? '0 4px 12px rgba(93, 62, 188, 0.12)' : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                  <div
                    style={{
                      width: '38px',
                      height: '28px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '6px',
                      backgroundColor: '#FFFFFF',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                      flexShrink: 0,
                    }}
                  >
                    {FLAG_ICONS[lang.code]}
                  </div>

                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span
                        style={{
                          fontSize: '14px',
                          fontWeight: isSelected ? 800 : 700,
                          color: isSelected ? '#5D3EBC' : '#1E293B',
                        }}
                      >
                        {lang.nativeName}
                      </span>
                      {details?.popular && (
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 800,
                            padding: '1px 6px',
                            borderRadius: '6px',
                            backgroundColor: '#FEF3C7',
                            color: '#92400E',
                            letterSpacing: '0.2px',
                          }}
                        >
                          Varsayılan
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        fontSize: '11.5px',
                        color: isSelected ? '#6D28D9' : '#64748B',
                        marginTop: '2px',
                        fontWeight: 500,
                      }}
                    >
                      {details?.subtitle || lang.name}
                    </div>
                  </div>
                </div>

                {/* Radio / Check Circle */}
                <div
                  style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    border: isSelected ? '2px solid #5D3EBC' : '2px solid #CBD5E1',
                    backgroundColor: isSelected ? '#5D3EBC' : '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'all 0.15s ease',
                  }}
                >
                  {isSelected && <Check size={13} color="#FFFFFF" strokeWidth={3.5} />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '14px 18px 18px',
            borderTop: '1px solid #F1F5F9',
            backgroundColor: '#FFFFFF',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <button
            type="button"
            onClick={() => handleConfirm(selected)}
            style={{
              width: '100%',
              padding: '14px 20px',
              borderRadius: '14px',
              backgroundColor: '#5D3EBC',
              color: '#FFFFFF',
              border: 'none',
              fontSize: '15px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(93, 62, 188, 0.35)',
              transition: 'all 0.15s ease',
            }}
          >
            <span>
              {selected === 'tr'
                ? 'Devam Et'
                : selected === 'ar'
                ? 'متابعة'
                : selected === 'ru'
                ? 'Продолжить'
                : selected === 'fr'
                ? 'Continuer'
                : 'Continue'}
            </span>
            <ArrowRight size={17} strokeWidth={2.5} />
          </button>

          <p
            style={{
              margin: '2px 0 0',
              textAlign: 'center',
              fontSize: '11px',
              color: '#94A3B8',
              fontWeight: 500,
            }}
          >
            Dil seçiminizi daha sonra üst menüdeki 🌐 simgesinden değiştirebilirsiniz.
          </p>
        </div>
      </div>
    </div>
  );
};
