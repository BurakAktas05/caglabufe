import React from 'react';
import { Locale } from '@/lib/i18n';

export const FLAG_ICONS: Record<Locale, React.ReactNode> = {
  tr: (
    <svg width="22" height="15" viewBox="0 0 1200 800" style={{ borderRadius: '3px', display: 'inline-block', boxShadow: '0 1px 3px rgba(0,0,0,0.15)', flexShrink: 0 }}>
      <rect width="1200" height="800" fill="#E30A17" />
      <circle cx="425" cy="400" r="200" fill="#ffffff" />
      <circle cx="475" cy="400" r="160" fill="#E30A17" />
      <polygon points="583,400 706,438 657,322 657,478 706,362" fill="#ffffff" />
    </svg>
  ),
  en: (
    <svg width="22" height="15" viewBox="0 0 60 30" style={{ borderRadius: '3px', display: 'inline-block', boxShadow: '0 1px 3px rgba(0,0,0,0.15)', flexShrink: 0 }}>
      <clipPath id="flag-uk-clip"><path d="M0,0 v30 h60 v-30 z"/></clipPath>
      <clipPath id="flag-uk-diag"><path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z"/></clipPath>
      <g clipPath="url(#flag-uk-clip)">
        <path d="M0,0 v30 h60 v-30 z" fill="#012169"/>
        <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6"/>
        <path d="M0,0 L60,30 M60,0 L0,30" clipPath="url(#flag-uk-diag)" stroke="#C8102E" strokeWidth="4"/>
        <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10"/>
        <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6"/>
      </g>
    </svg>
  ),
  ru: (
    <svg width="22" height="15" viewBox="0 0 9 6" style={{ borderRadius: '3px', display: 'inline-block', boxShadow: '0 1px 3px rgba(0,0,0,0.15)', flexShrink: 0 }}>
      <rect fill="#ffffff" width="9" height="2"/>
      <rect fill="#0039A6" y="2" width="9" height="2"/>
      <rect fill="#D52B1E" y="4" width="9" height="2"/>
    </svg>
  ),
  ar: (
    <svg width="22" height="15" viewBox="0 0 3 2" style={{ borderRadius: '3px', display: 'inline-block', boxShadow: '0 1px 3px rgba(0,0,0,0.15)', flexShrink: 0 }}>
      <rect width="3" height="2" fill="#006C35"/>
      <path d="M0.5,1.2 L2.5,1.2" stroke="#ffffff" strokeWidth="0.16" strokeLinecap="round" />
      <circle cx="1.5" cy="0.8" r="0.25" fill="#ffffff" opacity="0.85"/>
    </svg>
  ),
  fr: (
    <svg width="22" height="15" viewBox="0 0 3 2" style={{ borderRadius: '3px', display: 'inline-block', boxShadow: '0 1px 3px rgba(0,0,0,0.15)', flexShrink: 0 }}>
      <rect width="1" height="2" fill="#002395" />
      <rect width="1" height="2" x="1" fill="#FFFFFF" />
      <rect width="1" height="2" x="2" fill="#ED2939" />
    </svg>
  ),
};
