import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Çağla Büfe & Market | Karabük & KYK Hızlı Sipariş';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0f0d23',
          backgroundImage: 'radial-gradient(circle at 50% 30%, #311677 0%, #0f0d23 85%)',
          color: '#ffffff',
          fontFamily: 'sans-serif',
          position: 'relative',
          padding: '60px',
        }}
      >
        {/* Subtle grid accent */}
        <div
          style={{
            position: 'absolute',
            top: 40,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              backgroundColor: '#FFD10D',
              color: '#191919',
              fontWeight: 900,
              fontSize: '26px',
              padding: '8px 20px',
              borderRadius: '12px',
              letterSpacing: '1px',
            }}
          >
            ⚡ ÇAĞLA BÜFE & MARKET
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            maxWidth: '960px',
            marginTop: '40px',
          }}
        >
          <div
            style={{
              fontSize: '64px',
              fontWeight: 900,
              lineHeight: 1.15,
              color: '#ffffff',
              marginBottom: '20px',
              letterSpacing: '-1px',
            }}
          >
            Karabük 100. Yıl & KYK Yurtlarına
            <span style={{ color: '#FFD10D', marginLeft: '16px' }}>15-20 Dakikada</span>
          </div>

          <div
            style={{
              fontSize: '32px',
              color: '#cbd5e1',
              fontWeight: 500,
              marginBottom: '36px',
            }}
          >
            Gece Tost, Sandviç, İçecek & Market Kapında!
          </div>

          <div
            style={{
              display: 'flex',
              gap: '24px',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.12)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '16px',
                padding: '12px 24px',
                fontSize: '22px',
                fontWeight: 700,
                color: '#ffffff',
              }}
            >
              🌙 Gece 16:00 - 03:00
            </div>
            <div
              style={{
                backgroundColor: 'rgba(255, 209, 13, 0.15)',
                border: '1px solid rgba(255, 209, 13, 0.3)',
                borderRadius: '16px',
                padding: '12px 24px',
                fontSize: '22px',
                fontWeight: 700,
                color: '#FFD10D',
              }}
            >
              🚪 Kapıda Nakit & POS
            </div>
            <div
              style={{
                backgroundColor: 'rgba(93, 62, 188, 0.4)',
                border: '1px solid rgba(93, 62, 188, 0.6)',
                borderRadius: '16px',
                padding: '12px 24px',
                fontSize: '22px',
                fontWeight: 700,
                color: '#ffffff',
              }}
            >
              🏢 Tüm KYK Yurtları
            </div>
          </div>
        </div>

        <div
          style={{
            position: 'absolute',
            bottom: 30,
            fontSize: '20px',
            color: '#94a3b8',
            letterSpacing: '0.5px',
          }}
        >
          caglabufe.com • Karabük Üniversitesi & 100. Yıl Mahallesi
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
