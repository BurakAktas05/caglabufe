'use client';

import React from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'hero';
  showSubtitle?: boolean;
  className?: string;
  inverted?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showSubtitle = true,
  className = '',
  inverted = false,
}) => {
  const iconSizes = {
    sm: { width: 30, height: 30, fontSize: '16px', tagSize: '10px' },
    md: { width: 38, height: 38, fontSize: '20px', tagSize: '11px' },
    lg: { width: 48, height: 48, fontSize: '24px', tagSize: '12px' },
    hero: { width: 62, height: 62, fontSize: '32px', tagSize: '14px' },
  };

  const current = iconSizes[size];

  return (
    <div
      className={`brand-logo-container ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: size === 'hero' ? '14px' : '10px',
        textDecoration: 'none',
        userSelect: 'none',
      }}
    >
      {/* Dynamic Vector Emblem Badge */}
      <div
        style={{
          width: `${current.width}px`,
          height: `${current.height}px`,
          borderRadius: size === 'hero' ? '18px' : '12px',
          background: 'linear-gradient(135deg, #FFD10D 0%, #F59E0B 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 14px rgba(245, 158, 11, 0.35)',
          flexShrink: 0,
          position: 'relative',
        }}
      >
        <svg
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ width: '70%', height: '70%' }}
        >
          {/* Scooter / Fast Delivery + Warm Toast Vector Emblem */}
          {/* Scooter Body & Wheels */}
          <circle cx="12" cy="28" r="4" fill="#1F2937" stroke="#FFFFFF" strokeWidth="1.5" />
          <circle cx="28" cy="28" r="4" fill="#1F2937" stroke="#FFFFFF" strokeWidth="1.5" />
          <path
            d="M12 28h16M14 28l4-10h8l2 10"
            stroke="#1F2937"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Delivery Box / Warm Toast Shape on Back */}
          <rect
            x="6"
            y="14"
            width="9"
            height="9"
            rx="2"
            fill="#5D3EBC"
            stroke="#FFFFFF"
            strokeWidth="1.2"
          />
          <path d="M8 18.5h5" stroke="#FFD10D" strokeWidth="1.5" strokeLinecap="round" />
          {/* Handlebar & Wind Visor */}
          <path
            d="M24 14l2-4h3"
            stroke="#1F2937"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Steam / Heat Waves */}
          <path
            d="M21 8c0-1.5 1-2 1-3M25 8c0-1.5 1-2 1-3"
            stroke="#EF4444"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Typography / Wordmark */}
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span
            style={{
              fontSize: current.fontSize,
              fontWeight: 900,
              color: inverted ? '#1F2937' : '#FFFFFF',
              letterSpacing: '-0.6px',
              fontFamily: 'inherit',
            }}
          >
            çağla
          </span>
          <span
            style={{
              backgroundColor: '#FFD10D',
              color: '#1F2937',
              fontSize: current.tagSize,
              fontWeight: 900,
              padding: '2px 6px',
              borderRadius: '6px',
              letterSpacing: '0.3px',
              textTransform: 'uppercase',
            }}
          >
            büfe
          </span>
        </div>

        {showSubtitle && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              marginTop: '3px',
              fontSize: size === 'hero' ? '12px' : '10px',
              fontWeight: 700,
              color: inverted ? '#6B7280' : 'rgba(255, 255, 255, 0.82)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            <span>Market &amp; Gece Teslimatı</span>
            <span style={{ opacity: 0.5 }}>•</span>
            <span style={{ color: '#10B981', fontWeight: 800 }}>Karabük</span>
          </div>
        )}
      </div>
    </div>
  );
};
