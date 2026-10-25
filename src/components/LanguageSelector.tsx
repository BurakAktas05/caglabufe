'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { LANGUAGES, Locale } from '@/lib/i18n';
import { Globe, Check, ChevronDown, X } from 'lucide-react';
import { FLAG_ICONS } from './FlagIcons';

interface LanguageSelectorProps {
  variant?: 'compact' | 'full';
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ variant = 'compact' }) => {
  const { locale, setLocale, dir } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const currentLang = LANGUAGES.find((l) => l.code === locale) || LANGUAGES[0];
  const isRtl = dir === 'rtl';

  const handleSelect = (code: Locale) => {
    setLocale(code);
    setIsOpen(false);
  };

  return (
    <div style={{ position: 'relative', display: 'inline-flex' }}>
      {/* Trigger Button */}
      <button
        type="button"
        id="lang-selector-trigger"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          padding: variant === 'full' ? '8px 14px' : '5px 9px',
          borderRadius: '12px',
          backgroundColor: isOpen ? '#5D3EBC' : 'rgba(255, 255, 255, 0.95)',
          border: '1.5px solid ' + (isOpen ? '#5D3EBC' : '#E2E8F0'),
          color: isOpen ? '#FFFFFF' : '#1F2937',
          fontSize: '12px',
          fontWeight: 800,
          cursor: 'pointer',
          boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
          transition: 'all 0.15s ease',
          flexShrink: 0,
          userSelect: 'none',
        }}
        title="Dili Değiştir / Select Language"
      >
        {variant === 'full' ? (
          FLAG_ICONS[currentLang.code]
        ) : (
          <Globe size={14} color={isOpen ? '#FFD10D' : '#5D3EBC'} style={{ flexShrink: 0 }} />
        )}
        <span
          style={{
            textTransform: 'uppercase',
            letterSpacing: '0.4px',
            fontSize: '11px',
            fontWeight: 800,
            color: isOpen ? '#FFFFFF' : '#1F2937',
          }}
        >
          {variant === 'full' ? currentLang.nativeName : currentLang.code}
        </span>
        <ChevronDown
          size={12}
          color={isOpen ? '#FFFFFF' : '#64748B'}
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.2s ease',
            flexShrink: 0,
          }}
        />
      </button>

      {/* Dropdown / Modal when isOpen */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            id="lang-backdrop"
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 99990,
              backgroundColor: isMobile ? 'rgba(0, 0, 0, 0.5)' : 'transparent',
              backdropFilter: isMobile ? 'blur(3px)' : 'none',
              animation: 'fadeIn 0.15s ease',
            }}
            onClick={() => setIsOpen(false)}
          />

          {/* Desktop Dropdown OR Mobile Bottom Sheet */}
          {isMobile ? (
            /* Mobile Bottom Sheet Modal */
            <div
              style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 99999,
                backgroundColor: '#FFFFFF',
                borderTopLeftRadius: '22px',
                borderTopRightRadius: '22px',
                padding: '20px 18px 28px',
                boxShadow: '0 -10px 40px rgba(0,0,0,0.25)',
                animation: 'modalSlideUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                maxHeight: '80vh',
                overflowY: 'auto',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  width: '40px',
                  height: '4px',
                  backgroundColor: '#E2E8F0',
                  borderRadius: '2px',
                  margin: '0 auto 16px',
                }}
              />
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '10px',
                      backgroundColor: '#EDE9FE',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Globe size={18} color="#5D3EBC" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#1F2937', margin: 0 }}>
                      Dil Seçin / Select Language
                    </h3>
                    <p style={{ fontSize: '11px', color: '#6B7280', margin: 0 }}>
                      Lütfen tercih ettiğiniz dili belirleyin
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  style={{
                    border: 'none',
                    background: '#F3F4F6',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#6B7280',
                  }}
                >
                  <X size={16} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {LANGUAGES.map((lang) => {
                  const isSelected = lang.code === locale;
                  return (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => handleSelect(lang.code)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 14px',
                        borderRadius: '14px',
                        border: isSelected ? '2px solid #5D3EBC' : '1.5px solid #F1F5F9',
                        backgroundColor: isSelected ? '#F5F3FF' : '#FFFFFF',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '20px', lineHeight: 1 }}>{FLAG_ICONS[lang.code]}</span>
                        <div style={{ textAlign: isRtl ? 'right' : 'left' }}>
                          <span
                            style={{
                              display: 'block',
                              fontSize: '14px',
                              fontWeight: 800,
                              color: isSelected ? '#5D3EBC' : '#1E293B',
                            }}
                          >
                            {lang.nativeName}
                          </span>
                          <span style={{ fontSize: '11px', color: '#64748B' }}>{lang.name}</span>
                        </div>
                      </div>
                      {isSelected ? (
                        <div
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            backgroundColor: '#5D3EBC',
                            color: '#FFFFFF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Check size={14} strokeWidth={3} />
                        </div>
                      ) : (
                        <div
                          style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            border: '1.5px solid #CBD5E1',
                          }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Desktop Anchored Dropdown (Directly below trigger button) */
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: isRtl ? 'auto' : 0,
                left: isRtl ? 0 : 'auto',
                zIndex: 99999,
                backgroundColor: '#FFFFFF',
                borderRadius: '16px',
                border: '1px solid #E2E8F0',
                boxShadow: '0 20px 40px -10px rgba(0,0,0,0.2), 0 8px 16px -6px rgba(0,0,0,0.1)',
                padding: '8px',
                minWidth: '190px',
                animation: 'modalSlideUp 0.15s ease-out',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  color: '#94A3B8',
                  padding: '6px 10px 4px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.6px',
                  textAlign: isRtl ? 'right' : 'left',
                }}
              >
                Dil Seçimi / Language
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {LANGUAGES.map((lang) => {
                  const isSelected = lang.code === locale;
                  return (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => handleSelect(lang.code)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '9px 12px',
                        borderRadius: '10px',
                        border: 'none',
                        backgroundColor: isSelected ? '#F3F0FE' : 'transparent',
                        color: isSelected ? '#5D3EBC' : '#334155',
                        fontSize: '13px',
                        fontWeight: isSelected ? 800 : 600,
                        cursor: 'pointer',
                        textAlign: isRtl ? 'right' : 'left',
                        transition: 'background-color 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.backgroundColor = '#F8FAFC';
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '15px' }}>{FLAG_ICONS[lang.code]}</span>
                        <span>{lang.nativeName}</span>
                      </div>
                      {isSelected && <Check size={14} color="#5D3EBC" strokeWidth={3} />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
