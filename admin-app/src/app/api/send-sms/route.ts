import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Netgsm SMS Sending API Route (Admin App)
 * Supports:
 * - Direct single key (API Key or usercode:password:header)
 * - Separate usercode, password, and msgheader
 * - Automatic resolution from Supabase system_settings or environment variables (.env.local)
 * - Netgsm v2 REST API (POST JSON) with fallback to HTTP Form-Data
 * - Clean error code explanations & test mode
 */

const NETGSM_ERROR_MAP: Record<string, string> = {
  '20': 'Mesaj metni çok uzun veya karakter kodlama hatası.',
  '30': 'Geçersiz kullanıcı adı veya şifre (Netgsm web panelinizde "Abonelik İşlemleri > API İşlemleri" kısmından API erişimini aktif ettiğinizden emin olun).',
  '40': 'SMS başlığı (gönderici adı) Netgsm sisteminizde tanımlı değil veya henüz onaylanmamış.',
  '50': 'Netgsm hesabınızda SMS bakiyesi / kredisi yetersiz.',
  '51': 'Abonelik veya tarife süresi dolmuş.',
  '60': 'Gönderilmek istenen telefon numarası hatalı.',
  '70': 'Hatalı parametreler veya eksik bilgi.',
  '80': 'Gönderim sınır aşımı / frekans limiti.',
  '85': 'Mükerrer gönderim sınır aşımı (aynı numaraya 1 dakika içinde aynı mesaj tekrar gönderilemez).',
};

// In-memory rate limiting store (Phone sliding window)
interface RateLimitRecord {
  timestamps: number[];
  lastRequest: number;
}
const phoneRateLimits = new Map<string, RateLimitRecord>();

function normalizeGsm(phone: string): string {
  let cleaned = (phone || '').replace(/\D/g, '');
  if (cleaned.startsWith('90') && cleaned.length === 12) {
    cleaned = cleaned.substring(2);
  }
  if (cleaned.startsWith('0') && cleaned.length === 11) {
    cleaned = cleaned.substring(1);
  }
  return cleaned;
}

// Clean up expired records every 15 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of phoneRateLimits.entries()) {
      if (now - record.lastRequest > 15 * 60 * 1000) {
        phoneRateLimits.delete(key);
      }
    }
  }, 15 * 60 * 1000);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rawPhone = (body.phone || body.phoneNumber || body.gsmno || '').toString();
    const cleanGsm = normalizeGsm(rawPhone);
    const code = (body.code || '').toString().trim();
    const message = body.message || `Cagla Bufe & Market tek kullanimlik giris sifreniz: ${code}`;
    const isTest = Boolean(body.isTest);

    if (!cleanGsm || cleanGsm.length !== 10) {
      return NextResponse.json(
        { success: false, error: 'Lütfen 10 haneli geçerli bir telefon numarası giriniz (örn: 5xxxxxxxxx).' },
        { status: 400 }
      );
    }

    // Rate Limiting (bypassed for explicit admin test sends)
    if (!isTest) {
      const now = Date.now();
      const record = phoneRateLimits.get(cleanGsm) || { timestamps: [], lastRequest: 0 };
      const cooldownMs = 20 * 1000; // 20s cooldown between consecutive OTPs
      const windowMs = 10 * 60 * 1000;

      if (now - record.lastRequest < cooldownMs) {
        const waitSec = Math.ceil((cooldownMs - (now - record.lastRequest)) / 1000);
        return NextResponse.json(
          { success: false, error: `Lütfen tekrar SMS istemeden önce ${waitSec} saniye bekleyiniz.` },
          { status: 429 }
        );
      }

      record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);
      if (record.timestamps.length >= 5) {
        return NextResponse.json(
          { success: false, error: 'Çok fazla SMS talebinde bulunuldu. Lütfen 10 dakika sonra tekrar deneyiniz.' },
          { status: 429 }
        );
      }

      record.timestamps.push(now);
      record.lastRequest = now;
      phoneRateLimits.set(cleanGsm, record);
    }

    // Resolve Netgsm credentials from multiple possible sources:
    // 1. Direct custom credentials passed in request (e.g. from admin live test button)
    // 2. Database system_settings (Supabase)
    // 3. Process environment variables (.env.local)
    let rawApiKey = (body.customCredentials?.apiKey || '').trim();
    let usercode = (body.customCredentials?.usercode || '').trim();
    let password = (body.customCredentials?.password || '').trim();
    let header = (body.customCredentials?.header || '').trim();
    let isSmsEnabledSetting: boolean | null = null;

    // Check environment variables if not provided
    if (!rawApiKey) {
      rawApiKey = (process.env.NETGSM_API_KEY || process.env.NETGSM_KEY || '').trim();
    }
    if (!usercode) {
      usercode = (
        process.env.NETGSM_USERCODE ||
        process.env.NETGSM_USERNAME ||
        process.env.NEXT_PUBLIC_NETGSM_USER ||
        ''
      ).trim();
    }
    if (!password) {
      password = (process.env.NETGSM_PASSWORD || '').trim();
    }
    if (!header) {
      header = (
        process.env.NETGSM_HEADER ||
        process.env.NEXT_PUBLIC_NETGSM_HEADER ||
        ''
      ).trim();
    }

    // If still missing, check Supabase system_settings
    if (!rawApiKey && (!usercode || !password)) {
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        if (supabaseUrl && supabaseKey) {
          const supabase = createClient(supabaseUrl, supabaseKey);
          const { data } = await supabase.from('system_settings').select('settings').eq('id', 'current').single();
          if (data?.settings) {
            if (data.settings.isSmsEnabled !== undefined) {
              isSmsEnabledSetting = Boolean(data.settings.isSmsEnabled);
            }
            if (!rawApiKey && data.settings.netgsmApiKey) {
              rawApiKey = (data.settings.netgsmApiKey || '').trim();
            }
            if (!usercode && data.settings.netgsmUsercode) {
              usercode = (data.settings.netgsmUsercode || '').trim();
            }
            if (!password && data.settings.netgsmPassword) {
              password = (data.settings.netgsmPassword || '').trim();
            }
            if (!header && data.settings.netgsmHeader) {
              header = (data.settings.netgsmHeader || '').trim();
            }
          }
        }
      } catch {
        // fallback
      }
    }

    // If SMS is explicitly disabled by admin and this is not a test send
    if (isSmsEnabledSetting === false && !isTest) {
      return NextResponse.json({
        success: true,
        simulated: true,
        debugCode: code,
        message: 'SMS servisi yönetici tarafından kapatılmıştır (Simülasyon Modu).',
      });
    }

    // Single-key parsing: if rawApiKey is provided
    if (rawApiKey) {
      if (rawApiKey.includes(':')) {
        const parts = rawApiKey.split(':');
        if (!usercode) usercode = parts[0].trim();
        if (!password) password = parts[1].trim();
        if (parts[2] && !header) header = parts[2].trim();
      } else {
        // Standalone key: if usercode is provided, key is the password
        if (usercode && !password) {
          password = rawApiKey;
        } else if (!usercode && !password) {
          // If only key is provided without colon, use it as usercode/apiKey
          usercode = rawApiKey;
          password = rawApiKey;
        }
      }
    }

    // Also check if usercode or password themselves contain colon
    if (usercode && usercode.includes(':') && !password) {
      const parts = usercode.split(':');
      usercode = parts[0].trim();
      password = parts[1].trim();
      if (parts[2] && !header) header = parts[2].trim();
    } else if (password && password.includes(':') && !usercode) {
      const parts = password.split(':');
      usercode = parts[0].trim();
      password = parts[1].trim();
      if (parts[2] && !header) header = parts[2].trim();
    }

    // Default header fallback
    if (!header) {
      header = 'CAGLABUFE';
    }

    // If credentials exist, send LIVE SMS through Netgsm
    if (usercode && password) {
      let liveResponseText = '';
      let isSuccess = false;
      let rawError = '';

      // Method 1: Netgsm v2 REST API (POST JSON)
      try {
        const basicAuth = Buffer.from(`${usercode}:${password}`).toString('base64');
        const v2Res = await fetch('https://api.netgsm.com.tr/sms/rest/v2/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${basicAuth}`,
          },
          body: JSON.stringify({
            usercode,
            password,
            msgheader: header,
            messages: [
              {
                msg: message,
                no: cleanGsm,
              },
            ],
          }),
        });

        const v2Data = await v2Res.text();
        liveResponseText = v2Data;

        // Try JSON parsing
        try {
          const parsed = JSON.parse(v2Data);
          if (parsed.code === '00' || parsed.code === 0 || parsed.jobid) {
            isSuccess = true;
          } else if (parsed.code) {
            rawError = String(parsed.code);
          }
        } catch {
          // Plain text response check (e.g. "00 1234567")
          if (v2Data.startsWith('00') || v2Data.startsWith('01') || v2Data.startsWith('02')) {
            isSuccess = true;
          } else {
            rawError = v2Data.trim().split(/\s+/)[0];
          }
        }
      } catch (err: unknown) {
        console.warn('[Netgsm v2 REST API error, trying fallback]:', err);
      }

      // Method 2 Fallback: Netgsm HTTP POST (x-www-form-urlencoded) to /sms/send/get/
      if (!isSuccess) {
        try {
          const formParams = new URLSearchParams({
            usercode,
            password,
            gsmno: cleanGsm,
            message,
            msgheader: header,
          });

          const postRes = await fetch('https://api.netgsm.com.tr/sms/send/get/', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formParams.toString(),
          });

          const postText = (await postRes.text()).trim();
          liveResponseText = postText;

          if (postText.startsWith('00') || postText.startsWith('01') || postText.startsWith('02')) {
            isSuccess = true;
          } else {
            rawError = postText.split(/\s+/)[0];
          }
        } catch (err: unknown) {
          console.error('[Netgsm fallback error]:', err);
        }
      }

      // Handle Result
      if (isSuccess) {
        const jobId = liveResponseText.replace(/^00\s*/, '').trim() || 'OK';
        return NextResponse.json({
          success: true,
          provider: 'netgsm',
          jobId,
          message: 'SMS Netgsm üzerinden başarıyla iletildi.',
          phone: cleanGsm,
        });
      } else {
        const explanation = NETGSM_ERROR_MAP[rawError] || `Netgsm Yanıtı: ${liveResponseText || 'Bilinmeyen hata'}`;
        return NextResponse.json(
          {
            success: false,
            error: explanation,
            netgsmCode: rawError,
            rawResponse: liveResponseText,
          },
          { status: isTest ? 400 : 200 } // Don't block normal user flow on provider credit failure, but flag error on test
        );
      }
    }

    // Simulation / Dev mode when Netgsm credentials are not yet entered
    return NextResponse.json({
      success: true,
      simulated: true,
      debugCode: code,
      message: 'Test modu: Netgsm bilgileri girildiğinde canlı SMS gidecektir.',
    });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'Bilinmeyen hata';
    return NextResponse.json({ success: false, error: errMsg }, { status: 500 });
  }
}
