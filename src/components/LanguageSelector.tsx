'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { LANGUAGES, Locale } from '@/lib/i18n';
import { Globe, Check, ChevronDown } from 'lucide-react';

interface LanguageSelectorProps {
  variant?: 'compact' | 'full';
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ variant = 'compact' }) => {
  const { locale, setLocale, dir } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLang = LANGUAGES.find((l) => l.code === locale) || LANGUAGES[0];
  const isRtl = dir === 'rtl';

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (code: Locale) => {
    setLocale(code);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: variant === 'full' ? '8px 14px' : '6px 10px',
          borderRadius: '10px',
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          color: '#1F2937',
          fontSize: '12px',
          fontWeight: 800,
          cursor: 'pointer',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          transition: 'all 0.15s ease',
        }}
        title="Dili Değiştir / Select Language"
      >
        <span style={{ fontSize: '15px' }}>{currentLang.flag}</span>
        <span style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {variant === 'full' ? currentLang.nativeName : currentLang.code}
        </span>
        <ChevronDown size={12} color="#64748B" style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }} />
      </button>

      {isOpen && (
        <div
          className="lang-selector-menu"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: isRtl ? 'auto' : 0,
            left: isRtl ? 0 : 'auto',
            zIndex: 9999,
            backgroundColor: '#FFFFFF',
            borderRadius: '14px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
            padding: '6px',
            minWidth: '160px',
            animation: 'modalSlideUp 0.15s ease-out',
          }}
        >
          <div style={{ fontSize: '10px', fontWeight: 800, color: '#94A3B8', padding: '6px 10px 4px', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: isRtl ? 'right' : 'left' }}>
            Dil / Language
          </div>
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
                  padding: '8px 10px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: isSelected ? '#F3F0FE' : 'transparent',
                  color: isSelected ? '#5D3EBC' : '#334155',
                  fontSize: '13px',
                  fontWeight: isSelected ? 800 : 600,
                  cursor: 'pointer',
                  textAlign: isRtl ? 'right' : 'left',
                  transition: 'background-color 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '16px' }}>{lang.flag}</span>
                  <span>{lang.nativeName}</span>
                </div>
                {isSelected && <Check size={14} color="#5D3EBC" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
