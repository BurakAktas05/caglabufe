import { NextResponse } from 'next/server';

/**
 * SMS Sending API Route (Netgsm & Provider Integration)
 * Supports real SMS delivery via Netgsm HTTP GET/POST or provider webhooks.
 * Falls back to simulation mode when API credentials are not set.
 */
// In-memory rate limiting store (Phone & IP sliding window)
interface RateLimitRecord {
  timestamps: number[];
  lastRequest: number;
}
const phoneRateLimits = new Map<string, RateLimitRecord>();

// Clean up expired records every 15 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of phoneRateLimits.entries()) {
    if (now - record.lastRequest > 15 * 60 * 1000) {
      phoneRateLimits.delete(key);
    }
  }
}, 15 * 60 * 1000);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const phone = (body.phone || '').toString().replace(/\D/g, '');
    const code = (body.code || '').toString().trim();
    const message = body.message || `Cagla Bufe & Market tek kullanimlik giris sifreniz: ${code}`;

    if (!phone || phone.length < 10) {
      return NextResponse.json(
        { success: false, error: 'Gecersiz telefon numarasi' },
        { status: 400 }
      );
    }

    // Rate Limiting: Max 4 SMS per 10 mins, min 25s cooldown between consecutive OTPs
    const now = Date.now();
    const record = phoneRateLimits.get(phone) || { timestamps: [], lastRequest: 0 };
    const cooldownMs = 25 * 1000;
    const windowMs = 10 * 60 * 1000;

    if (now - record.lastRequest < cooldownMs) {
      const waitSec = Math.ceil((cooldownMs - (now - record.lastRequest)) / 1000);
      return NextResponse.json(
        { success: false, error: `Lütfen tekrar SMS istemeden önce ${waitSec} saniye bekleyiniz.` },
        { status: 429 }
      );
    }

    // Filter out timestamps older than windowMs
    record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);
    if (record.timestamps.length >= 4) {
      return NextResponse.json(
        { success: false, error: 'Çok fazla SMS talebinde bulunuldu. Lütfen 10 dakika sonra tekrar deneyiniz.' },
        { status: 429 }
      );
    }

    record.timestamps.push(now);
    record.lastRequest = now;
    phoneRateLimits.set(phone, record);

    // Netgsm Environment Variables
    const netgsmUser = process.env.NETGSM_USERCODE || process.env.NEXT_PUBLIC_NETGSM_USER;
    const netgsmPass = process.env.NETGSM_PASSWORD;
    const netgsmHeader = process.env.NETGSM_HEADER || process.env.NEXT_PUBLIC_NETGSM_HEADER || 'CAGLABUFE';

    // If Netgsm is configured, send live SMS
    if (netgsmUser && netgsmPass) {
      const cleanGsm = phone.startsWith('0') ? phone.substring(1) : phone;
      const url = `https://api.netgsm.com.tr/sms/send/get/?usercode=${encodeURIComponent(
        netgsmUser
      )}&password=${encodeURIComponent(netgsmPass)}&gsmno=${encodeURIComponent(
        cleanGsm
      )}&message=${encodeURIComponent(message)}&msgheader=${encodeURIComponent(
        netgsmHeader
      )}`;

      try {
        const netgsmRes = await fetch(url, { method: 'GET' });
        const resText = await netgsmRes.text();
        // Netgsm returns codes like "00 1234567" on success
        return NextResponse.json({
          success: true,
          provider: 'netgsm',
          providerResponse: resText,
        });
      } catch (err: unknown) {
        console.error('[SMS API] Netgsm error:', err);
        // Fall back gracefully so user login is not blocked
      }
    }

    // Simulation / Dev mode
    return NextResponse.json({
      success: true,
      simulated: true,
      message: 'Test modu: SMS API kimlik bilgileri tanımlandığında canlı SMS gider.',
    });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'Bilinmeyen hata';
    return NextResponse.json({ success: false, error: errMsg }, { status: 500 });
  }
}
