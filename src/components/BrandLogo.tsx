import Image from 'next/image';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'hero';
  showSubtitle?: boolean;
  className?: string;
  inverted?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showSubtitle = false,
  className = '',
  inverted = false,
}) => {
  const iconSizes = {
    sm: { width: 32, height: 32, fontSize: '17px', tagSize: '10px' },
    md: { width: 40, height: 40, fontSize: '21px', tagSize: '11px' },
    lg: { width: 50, height: 50, fontSize: '26px', tagSize: '13px' },
    hero: { width: 68, height: 68, fontSize: '34px', tagSize: '15px' },
  };

  const current = iconSizes[size];

  return (
    <div
      className={`brand-logo-container ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: size === 'hero' ? '12px' : '9px',
        textDecoration: 'none',
        userSelect: 'none',
      }}
    >
      {/* 3D Modern Glowing Emblem */}
      <div
        style={{
          width: `${current.width}px`,
          height: `${current.height}px`,
          borderRadius: size === 'hero' ? '18px' : '11px',
          overflow: 'hidden',
          boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25), 0 0 0 1.5px rgba(255, 209, 13, 0.4)',
          flexShrink: 0,
          position: 'relative',
          backgroundColor: '#5D3EBC',
        }}
      >
        <Image
          src="/caglabufe_logo.jpg"
          alt="Çağla Büfe"
          fill
          sizes="68px"
          style={{ objectFit: 'cover' }}
          priority
        />
      </div>

      {/* Typography / Wordmark - Bold & Prominent */}
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span
            style={{
              fontSize: current.fontSize,
              fontWeight: 950,
              color: inverted ? '#1F2937' : '#FFFFFF',
              letterSpacing: '-0.6px',
              fontFamily: 'inherit',
              textShadow: inverted ? 'none' : '0 2px 8px rgba(0,0,0,0.2)',
            }}
          >
            Çağla
          </span>
          <span
            style={{
              backgroundColor: '#FFD10D',
              color: '#1F2937',
              fontSize: current.tagSize,
              fontWeight: 950,
              padding: '2.5px 7px',
              borderRadius: '6px',
              letterSpacing: '0.4px',
              textTransform: 'uppercase',
              boxShadow: '0 2px 8px rgba(255, 209, 13, 0.35)',
            }}
          >
            BÜFE
          </span>
        </div>

        {showSubtitle && (
          <div
            className="brand-logo-subtitle"
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
