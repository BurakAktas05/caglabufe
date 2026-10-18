import Link from 'next/link';
import { Home, ArrowLeft, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#0f0d23',
        backgroundImage: 'radial-gradient(circle at 50% 25%, #2e1065 0%, #0f0d23 85%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        color: '#ffffff',
        fontFamily: 'inherit',
      }}
    >
      <div
        style={{
          maxWidth: '460px',
          width: '100%',
          backgroundColor: 'rgba(30, 27, 75, 0.65)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: '28px',
          padding: '40px 28px',
          textAlign: 'center',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)',
        }}
      >
        <div
          style={{
            fontSize: '76px',
            fontWeight: 900,
            lineHeight: 1,
            color: '#FFD10D',
            letterSpacing: '-2px',
            marginBottom: '8px',
            textShadow: '0 4px 20px rgba(255, 209, 13, 0.3)',
          }}
        >
          404
        </div>

        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '20px',
            backgroundColor: 'rgba(93, 62, 188, 0.3)',
            color: '#ffd10d',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            border: '1px solid rgba(255, 209, 13, 0.25)',
          }}
        >
          <Search size={30} />
        </div>

        <h1 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '8px', color: '#ffffff' }}>
          Sayfa Bulunamadı
        </h1>

        <p style={{ fontSize: '14px', color: '#cbd5e1', lineHeight: 1.6, marginBottom: '28px' }}>
          Aradığınız sayfa veya ürün kaldırılmış ya da adresi değişmiş olabilir. Sıcak tostlar ve atıştırmalıklar ana sayfada sizi bekliyor!
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Link
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '14px',
              borderRadius: '14px',
              backgroundColor: '#FFD10D',
              color: '#191919',
              fontWeight: 800,
              fontSize: '15px',
              textDecoration: 'none',
              boxShadow: '0 4px 18px rgba(255, 209, 13, 0.3)',
              transition: 'transform 0.15s ease',
            }}
          >
            <Home size={18} />
            <span>Ana Sayfaya ve Menüye Dön</span>
          </Link>

          <Link
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px',
              borderRadius: '14px',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              color: '#cbd5e1',
              fontWeight: 700,
              fontSize: '14px',
              textDecoration: 'none',
              border: '1px solid rgba(255, 255, 255, 0.12)',
            }}
          >
            <ArrowLeft size={16} />
            <span>Geri Dön</span>
          </Link>
        </div>

        <div style={{ marginTop: '24px', fontSize: '12px', color: '#94a3b8' }}>
          Çağla Büfe & Market • Karabük 100. Yıl & KYK
        </div>
      </div>
    </div>
  );
}
