// Firebase Phone Authentication (SMS Doğrulama Servisi)
import { auth } from './firebase';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';

export interface SendOtpResult {
  success: boolean;
  message: string;
}

export interface VerifyOtpResult {
  success: boolean;
  message?: string;
  user?: unknown;
}

// Global window genişletmesi
declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier | null;
    confirmationResult?: ConfirmationResult | null;
  }
}

/**
 * Telefon numarasını E.164 uluslararası formatına (+90XXXXXXXXXX) dönüştürür.
 */
export const formatToE164 = (phone: string): string => {
  const digits = phone.replace(/\D/g, '');

  // 05XX XXX XX XX -> +905XXXXXXXXX (11 hane)
  if (digits.startsWith('0') && digits.length === 11) {
    return `+9${digits}`;
  }

  // 905XX XXX XX XX -> +905XXXXXXXXX (12 hane)
  if (digits.startsWith('90') && digits.length === 12) {
    return `+${digits}`;
  }

  // 5XX XXX XX XX -> +905XXXXXXXXX (10 hane)
  if (digits.length === 10) {
    return `+90${digits}`;
  }

  // Diğer durumlar (başında + varsa ve rakamlar)
  if (phone.trim().startsWith('+')) {
    return `+${digits}`;
  }

  return `+90${digits}`;
};

/**
 * reCAPTCHA doğrulayıcısını başlatır veya yeniler
 */
export const initRecaptchaVerifier = (containerId: string = 'recaptcha-container'): RecaptchaVerifier => {
  if (typeof window === 'undefined') {
    throw new Error('reCAPTCHA sadece tarayıcı ortamında çalışır.');
  }

  // Önceki doğrulayıcıyı ve container'ı güvenle temizle
  if (window.recaptchaVerifier) {
    try {
      window.recaptchaVerifier.clear();
    } catch {
      // sessizce geç
    }
    window.recaptchaVerifier = null;
  }

  const containerEl = document.getElementById(containerId);
  if (containerEl) {
    containerEl.innerHTML = '';
  }

  const verifier = new RecaptchaVerifier(auth, containerId, {
    size: 'invisible',
    callback: () => {
      // reCAPTCHA otomatik çözüldü
    },
    'expired-callback': () => {
      // reCAPTCHA süresi doldu
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
        } catch {
          // sessizce geç
        }
        window.recaptchaVerifier = null;
      }
    },
  });

  window.recaptchaVerifier = verifier;
  return verifier;
};

// Client-side Anti-Spam & Cost-Protection Rate Limiter
const OTP_RATE_STORAGE_KEY = 'caglabufe_otp_rate_limits';

interface ClientOtpRateState {
  globalTimestamps: number[];
  phoneTimestamps: Record<string, number[]>;
  lastAttemptAt: number;
}

const getOtpRateState = (): ClientOtpRateState => {
  if (typeof window === 'undefined') {
    return { globalTimestamps: [], phoneTimestamps: {}, lastAttemptAt: 0 };
  }
  try {
    const raw = localStorage.getItem(OTP_RATE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : { globalTimestamps: [], phoneTimestamps: {}, lastAttemptAt: 0 };
  } catch {
    return { globalTimestamps: [], phoneTimestamps: {}, lastAttemptAt: 0 };
  }
};

const saveOtpRateState = (state: ClientOtpRateState) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(OTP_RATE_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // quota error yoksay
  }
};

const checkOtpRateLimit = (cleanDigits: string): { allowed: boolean; message?: string } => {
  const now = Date.now();
  const state = getOtpRateState();

  // 1. Minimum 45 saniye bekleme zorunluluğu (Cooldown)
  if (state.lastAttemptAt && now - state.lastAttemptAt < 45 * 1000) {
    const remaining = Math.ceil((45 * 1000 - (now - state.lastAttemptAt)) / 1000);
    return {
      allowed: false,
      message: `Yeni kod istemeden önce lütfen ${remaining} saniye bekleyiniz knk!`,
    };
  }

  // 2. Numaraya göre 10 dakikada maksimum 3 SMS
  const tenMins = 10 * 60 * 1000;
  const phoneList = (state.phoneTimestamps[cleanDigits] || []).filter((ts) => now - ts < tenMins);
  if (phoneList.length >= 3) {
    return {
      allowed: false,
      message: 'Bu numaraya kısa sürede çok fazla SMS gönderildi. Lütfen 10 dakika sonra deneyin veya Google / E-posta ile giriş yapın knk!',
    };
  }

  // 3. Cihaz geneli 15 dakikada maksimum 5 SMS
  const fifteenMins = 15 * 60 * 1000;
  const globalList = (state.globalTimestamps || []).filter((ts) => now - ts < fifteenMins);
  if (globalList.length >= 5) {
    return {
      allowed: false,
      message: 'Çok fazla doğrulama isteğinde bulunuldu. Güvenliğiniz için lütfen biraz bekleyip tekrar deneyiniz.',
    };
  }

  return { allowed: true };
};

const recordOtpSent = (cleanDigits: string) => {
  const now = Date.now();
  const state = getOtpRateState();
  const tenMins = 10 * 60 * 1000;
  const fifteenMins = 15 * 60 * 1000;

  const phoneList = (state.phoneTimestamps[cleanDigits] || []).filter((ts) => now - ts < tenMins);
  phoneList.push(now);

  const globalList = (state.globalTimestamps || []).filter((ts) => now - ts < fifteenMins);
  globalList.push(now);

  state.phoneTimestamps[cleanDigits] = phoneList;
  state.globalTimestamps = globalList;
  state.lastAttemptAt = now;

  saveOtpRateState(state);
};

/**
 * Firebase üzerinden gerçek SMS doğrulama kodu (OTP) gönderir.
 */
export const sendSmsOtp = async (phone: string, containerId: string = 'recaptcha-container'): Promise<SendOtpResult> => {
  const cleanDigits = phone.replace(/\D/g, '');
  if (cleanDigits.length < 10) {
    return {
      success: false,
      message: 'Lütfen geçerli bir telefon numarası giriniz (05XX XXX XX XX).',
    };
  }

  // Fatura şişmesini ve SMS bot saldırılarını önleyen güvenlik & rate limit kontrolü
  const rateCheck = checkOtpRateLimit(cleanDigits);
  if (!rateCheck.allowed) {
    return {
      success: false,
      message: rateCheck.message || 'Çok fazla SMS isteği yapıldı.',
    };
  }

  const e164Phone = formatToE164(phone);

  try {
    const verifier = initRecaptchaVerifier(containerId);
    const confirmation = await signInWithPhoneNumber(auth, e164Phone, verifier);
    window.confirmationResult = confirmation;

    // Başarılı gönderimde sayacı kaydet
    recordOtpSent(cleanDigits);

    return {
      success: true,
      message: 'SMS doğrulama kodu başarıyla gönderildi.',
    };
  } catch (error: any) {
    console.error('Firebase SMS Gönderim Hatası:', error);

    // Hata durumunda reCAPTCHA'yı sıfırla
    if (typeof window !== 'undefined' && window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier.clear();
      } catch {
        // yoksay
      }
      window.recaptchaVerifier = null;
    }

    const code = error?.code || '';
    let message = 'SMS gönderilemedi. Lütfen tekrar deneyiniz.';

    if (code === 'auth/invalid-phone-number') {
      message = 'Geçersiz telefon numarası formatı. Lütfen numaranızı kontrol ediniz.';
    } else if (code === 'auth/missing-phone-number') {
      message = 'Lütfen bir telefon numarası giriniz.';
    } else if (code === 'auth/quota-exceeded') {
      message = 'SMS gönderim kotası aşıldı. Lütfen daha sonra tekrar deneyiniz.';
    } else if (code === 'auth/too-many-requests') {
      message = 'Çok fazla istek yapıldı. Lütfen biraz bekleyip tekrar deneyiniz.';
    } else if (code === 'auth/captcha-check-failed') {
      message = 'Güvenlik doğrulaması (reCAPTCHA) başarısız oldu. Lütfen sayfayı yenileyip tekrar deneyiniz.';
    } else if (code === 'auth/app-not-authorized') {
      message = 'Bu alan adı (domain) Firebase üzerinde yetkilendirilmemiş. Firebase Console > Authentication > Settings > Authorized Domains kısmına alan adınızı ekleyiniz.';
    } else if (code === 'auth/operation-not-allowed') {
      message = 'Firebase üzerinde Telefon (Phone) doğrulaması etkinleştirilmemiş. Lütfen Firebase Console üzerinden aktif ediniz.';
    } else if (error?.message) {
      message = error.message;
    }

    return {
      success: false,
      message,
    };
  }
};

/**
 * Kullanıcının SMS ile aldığı kodu Firebase ile doğrular.
 */
export const verifySmsOtp = async (inputOtp: string): Promise<VerifyOtpResult> => {
  const trimmed = inputOtp.trim();

  if (!trimmed || trimmed.length < 6) {
    return {
      success: false,
      message: 'Lütfen 6 haneli SMS doğrulama kodunu eksiksiz giriniz.',
    };
  }

  if (typeof window === 'undefined' || !window.confirmationResult) {
    return {
      success: false,
      message: 'Doğrulama oturumu bulunamadı. Lütfen tekrar SMS kodu isteyiniz.',
    };
  }

  try {
    const credential = await window.confirmationResult.confirm(trimmed);
    return {
      success: true,
      user: credential.user,
    };
  } catch (error: any) {
    console.error('Firebase OTP Doğrulama Hatası:', error);

    const code = error?.code || '';
    let message = 'Hatalı veya süresi dolmuş SMS kodu! Tekrar deneyiniz.';

    if (code === 'auth/invalid-verification-code') {
      message = 'Girdiğiniz SMS doğrulama kodu hatalı. Lütfen kontrol edip tekrar giriniz.';
    } else if (code === 'auth/code-expired') {
      message = 'SMS kodunun süresi dolmuş. Lütfen yeni bir kod isteyiniz.';
    } else if (code === 'auth/session-expired') {
      message = 'Oturum süresi doldu. Lütfen yeniden SMS isteyiniz.';
    }

    return {
      success: false,
      message,
    };
  }
};
